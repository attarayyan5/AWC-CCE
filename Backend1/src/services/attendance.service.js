// src/services/attendance.service.js
// Attendance import pipeline and management

import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import Member from '../models/Member.js';
import Activity from '../models/Activity.js';
import Attendance from '../models/Attendance.js';
import AttendanceImport from '../models/AttendanceImport.js';
import AttendanceImportRow from '../models/AttendanceImportRow.js';
import AppError from '../utils/AppError.js';
import { createAuditLog } from './auditLog.service.js';
import { normalizeEmail, normalizeStudentId } from '../utils/sanitize.js';
import mongoose from 'mongoose';

/**
 * Compute SHA-256 checksum of file buffer
 */
const computeChecksum = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Parse Excel file buffer and return rows as objects
 */
const parseExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new AppError('Excel file has no worksheets', 400);
  }

  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1); // ExcelJS uses 1-based index, slice to 0-based array

    if (rowNumber === 1) {
      headers = values.map((h) => (h ? String(h).trim() : `Column${rowNumber}`));
    } else {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] !== undefined && values[i] !== null ? String(values[i]).trim() : '';
      });
      rows.push({ rowNumber, data: obj });
    }
  });

  return { headers, rows };
};

/**
 * Parse CSV buffer
 */
const parseCsv = (buffer) => {
  const content = buffer.toString('utf-8');
  let records;

  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new AppError(`CSV parsing failed: ${err.message}`, 400);
  }

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const rows = records.map((record, index) => ({
    rowNumber: index + 2, // 1-based, row 1 is headers
    data: record,
  }));

  return { headers, rows };
};

/**
 * Upload attendance file and create import record
 */
export const uploadAttendanceFile = async (file, activityId, columnMapping, actorUserId, { ipAddress = '' } = {}) => {
  // Validate activity exists and allows imports
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  if (activity.status === 'CANCELLED') {
    throw new AppError('Cannot import attendance for a cancelled activity', 400);
  }

  const fileBuffer = file.buffer;
  const fileChecksum = computeChecksum(fileBuffer);
  const originalFilename = file.originalname;
  const ext = originalFilename.split('.').pop().toLowerCase();

  // Parse the file
  let parseResult;
  if (ext === 'csv') {
    parseResult = parseCsv(fileBuffer);
  } else {
    parseResult = await parseExcel(fileBuffer);
  }

  const { headers, rows } = parseResult;

  // Create the import record
  const importRecord = await AttendanceImport.create({
    activityId,
    uploadedBy: actorUserId,
    originalFilename,
    fileChecksum,
    totalRows: rows.length,
    status: 'UPLOADED',
    columnMapping: columnMapping || {},
  });

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_IMPORT_UPLOADED',
    entityType: 'AttendanceImport',
    entityId: importRecord._id,
    details: { activityId, filename: originalFilename, totalRows: rows.length },
    ipAddress,
  });

  return {
    importId: importRecord._id,
    headers,
    previewRows: rows.slice(0, 10).map((r) => r.data),
    totalRows: rows.length,
    status: 'UPLOADED',
  };
};

/**
 * Validate import rows against registered members
 */
export const validateImport = async (importId, columnMapping, actorUserId) => {
  const importRecord = await AttendanceImport.findById(importId).populate('activityId');
  if (!importRecord) {
    throw new AppError('Import record not found', 404);
  }

  if (!['UPLOADED', 'VALIDATED'].includes(importRecord.status)) {
    throw new AppError(`Cannot validate import with status: ${importRecord.status}`, 400);
  }

  // Re-parse the file is not possible since we use memory storage
  // The validation is done from AttendanceImportRow records if already validated
  // or from raw data. We store preview data during upload.
  // For this implementation, the admin sends the full data as part of validation.

  // Update status to PROCESSING
  await AttendanceImport.findByIdAndUpdate(importId, {
    status: 'PROCESSING',
    columnMapping,
  });

  const activity = importRecord.activityId;

  // Process rows sent by client
  const { rows } = columnMapping._rawRows || { rows: [] };

  // Delete existing row records for this import (re-validation)
  await AttendanceImportRow.deleteMany({ importId });

  const results = {
    valid: 0,
    duplicate: 0,
    unknownMember: 0,
    emailMismatch: 0,
    invalid: 0,
    alreadyImported: 0,
  };

  // Load existing attendance for this activity (for deduplication)
  const existingAttendance = await Attendance.find({
    activityId: activity._id,
  }).select('memberId').lean();
  const existingMemberIds = new Set(existingAttendance.map((a) => a.memberId.toString()));

  const rowDocs = [];
  const seenStudentIds = new Set(); // Within-file deduplication

  for (const row of rows) {
    const rawStudentId = row[columnMapping.studentId] || '';
    const rawEmail = row[columnMapping.email] || '';
    const rawName = row[columnMapping.fullName] || '';

    const studentId = normalizeStudentId(rawStudentId);
    const email = normalizeEmail(rawEmail);

    const errors = [];

    // Validate required fields
    if (!studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is missing' });
    }

    if (errors.length > 0) {
      results.invalid++;
      rowDocs.push({
        importId,
        rowNumber: row._rowNumber,
        rawData: { studentId: rawStudentId, email: rawEmail, name: rawName },
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'INVALID',
        errors,
      });
      continue;
    }

    // Within-file duplicate check
    if (seenStudentIds.has(studentId)) {
      results.duplicate++;
      rowDocs.push({
        importId,
        rowNumber: row._rowNumber,
        rawData: { studentId: rawStudentId, email: rawEmail },
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'DUPLICATE',
        errors: [{ field: 'studentId', message: 'Duplicate student ID in this file' }],
      });
      continue;
    }
    seenStudentIds.add(studentId);

    // Find member by student ID
    const member = await Member.findOne({ studentId, status: 'ACTIVE' }).lean();

    if (!member) {
      results.unknownMember++;
      rowDocs.push({
        importId,
        rowNumber: row._rowNumber,
        rawData: { studentId: rawStudentId, email: rawEmail },
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'UNKNOWN_MEMBER',
        errors: [{ field: 'studentId', message: `No active member found with Student ID: ${studentId}` }],
      });
      continue;
    }

    // Email cross-check
    if (email && member.email !== email) {
      results.emailMismatch++;
      rowDocs.push({
        importId,
        rowNumber: row._rowNumber,
        rawData: { studentId: rawStudentId, email: rawEmail },
        normalizedData: { studentId, email, fullName: rawName },
        resolvedMemberId: member._id,
        validationStatus: 'EMAIL_MISMATCH',
        errors: [
          {
            field: 'email',
            message: `Email mismatch: provided ${email}, registered ${member.email}`,
          },
        ],
      });
      continue;
    }

    // Check if already imported for this activity
    if (existingMemberIds.has(member._id.toString())) {
      results.alreadyImported++;
      rowDocs.push({
        importId,
        rowNumber: row._rowNumber,
        rawData: { studentId: rawStudentId, email: rawEmail },
        normalizedData: { studentId, email, fullName: rawName },
        resolvedMemberId: member._id,
        validationStatus: 'ALREADY_IMPORTED',
        errors: [{ field: 'studentId', message: 'Attendance already recorded for this activity' }],
      });
      continue;
    }

    // VALID
    results.valid++;
    rowDocs.push({
      importId,
      rowNumber: row._rowNumber,
      rawData: { studentId: rawStudentId, email: rawEmail },
      normalizedData: { studentId, email, fullName: rawName },
      resolvedMemberId: member._id,
      validationStatus: 'VALID',
      errors: [],
    });
  }

  // Bulk insert row records
  if (rowDocs.length > 0) {
    await AttendanceImportRow.insertMany(rowDocs);
  }

  // Update import record
  await AttendanceImport.findByIdAndUpdate(importId, {
    status: 'VALIDATED',
    validRows: results.valid,
    duplicateRows: results.duplicate,
    unknownMemberRows: results.unknownMember,
    mismatchedEmailRows: results.emailMismatch,
    invalidRows: results.invalid + results.alreadyImported,
    validationSummary: results,
    totalRows: rows.length,
  });

  return {
    importId,
    status: 'VALIDATED',
    summary: {
      total: rows.length,
      valid: results.valid,
      duplicate: results.duplicate,
      unknownMember: results.unknownMember,
      emailMismatch: results.emailMismatch,
      invalid: results.invalid,
      alreadyImported: results.alreadyImported,
    },
  };
};

/**
 * Confirm import and commit valid attendance records
 * Hours are awarded ONLY during confirmation, not validation.
 */
export const confirmImport = async (importId, actorUserId, { ipAddress = '' } = {}) => {
  const importRecord = await AttendanceImport.findById(importId).populate('activityId');
  if (!importRecord) {
    throw new AppError('Import record not found', 404);
  }

  if (importRecord.status !== 'VALIDATED') {
    throw new AppError(`Cannot confirm import with status: ${importRecord.status}. Must be VALIDATED first.`, 400);
  }

  const activity = importRecord.activityId;
  if (!activity) {
    throw new AppError('Associated activity not found', 404);
  }

  if (activity.status === 'CANCELLED') {
    throw new AppError('Cannot confirm attendance import for a cancelled activity', 400);
  }

  // Get valid rows
  const validRows = await AttendanceImportRow.find({
    importId,
    validationStatus: 'VALID',
  }).lean();

  if (validRows.length === 0) {
    // Cancel import if no valid rows
    await AttendanceImport.findByIdAndUpdate(importId, { status: 'CANCELLED' });
    throw new AppError('No valid rows to commit. Import cancelled.', 400);
  }

  // Mark as CONFIRMED (transitional state)
  await AttendanceImport.findByIdAndUpdate(importId, { status: 'CONFIRMED' });

  let committedCount = 0;
  const failedRows = [];

  for (const row of validRows) {
    if (!row.resolvedMemberId) continue;

    try {
      // Idempotent: use findOneAndUpdate with upsert=false to prevent duplicates
      const existing = await Attendance.findOne({
        memberId: row.resolvedMemberId,
        activityId: activity._id,
      });

      if (existing) {
        // Already exists - mark row as already imported
        await AttendanceImportRow.findByIdAndUpdate(row._id, {
          validationStatus: 'ALREADY_IMPORTED',
          attendanceId: existing._id,
        });
        continue;
      }

      // Create attendance record
      const attendance = await Attendance.create({
        memberId: row.resolvedMemberId,
        activityId: activity._id,
        status: 'PRESENT',
        hoursAwarded: activity.ccaHours,
        sourceImportId: importId,
        recordedBy: actorUserId,
        recordedAt: new Date(),
      });

      // Link row to created attendance
      await AttendanceImportRow.findByIdAndUpdate(row._id, {
        attendanceId: attendance._id,
      });

      committedCount++;
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key - already exists, skip silently
        committedCount++;
      } else {
        failedRows.push({ rowId: row._id, error: err.message });
      }
    }
  }

  const finalStatus = failedRows.length === 0 ? 'COMPLETED' : 'COMPLETED';

  await AttendanceImport.findByIdAndUpdate(importId, {
    status: finalStatus,
    committedRows: committedCount,
    completedAt: new Date(),
  });

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_IMPORT_CONFIRMED',
    entityType: 'AttendanceImport',
    entityId: importId,
    details: {
      activityId: activity._id,
      activityCode: activity.activityCode,
      committedRows: committedCount,
      totalValidRows: validRows.length,
    },
    ipAddress,
  });

  return {
    importId,
    status: finalStatus,
    committedRows: committedCount,
    failedRows: failedRows.length,
  };
};

/**
 * Cancel an import
 */
export const cancelImport = async (importId, actorUserId, { ipAddress = '' } = {}) => {
  const importRecord = await AttendanceImport.findById(importId);
  if (!importRecord) {
    throw new AppError('Import record not found', 404);
  }

  if (['COMPLETED', 'CANCELLED'].includes(importRecord.status)) {
    throw new AppError(`Cannot cancel import with status: ${importRecord.status}`, 400);
  }

  await AttendanceImport.findByIdAndUpdate(importId, { status: 'CANCELLED' });

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_IMPORT_CANCELLED',
    entityType: 'AttendanceImport',
    entityId: importId,
    details: { previousStatus: importRecord.status },
    ipAddress,
  });

  return { importId, status: 'CANCELLED' };
};

/**
 * Get paginated list of imports
 */
export const getImports = async ({ page = 1, limit = 20, activityId = null, status = null } = {}) => {
  const filter = {};
  if (activityId) filter.activityId = activityId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [imports, total] = await Promise.all([
    AttendanceImport.find(filter)
      .populate('activityId', 'title activityCode activityDate')
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AttendanceImport.countDocuments(filter),
  ]);

  return {
    imports,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get import detail with row breakdown
 */
export const getImportById = async (importId) => {
  const importRecord = await AttendanceImport.findById(importId)
    .populate('activityId', 'title activityCode activityDate ccaHours status')
    .populate('uploadedBy', 'email')
    .lean();

  if (!importRecord) {
    throw new AppError('Import record not found', 404);
  }

  const rows = await AttendanceImportRow.find({ importId })
    .populate('resolvedMemberId', 'studentId fullName email')
    .sort({ rowNumber: 1 })
    .lean();

  return { ...importRecord, rows };
};

/**
 * Get attendance records with filtering
 */
export const getAttendance = async ({
  page = 1,
  limit = 20,
  memberId = null,
  activityId = null,
  status = null,
} = {}) => {
  const filter = {};
  if (memberId) filter.memberId = new mongoose.Types.ObjectId(memberId);
  if (activityId) filter.activityId = new mongoose.Types.ObjectId(activityId);
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [attendance, total] = await Promise.all([
    Attendance.find(filter)
      .populate('memberId', 'studentId fullName email department')
      .populate('activityId', 'title activityCode activityDate ccaHours')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return {
    attendance,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Correct an attendance record (auditable)
 */
export const correctAttendance = async (attendanceId, correctionData, actorUserId, { ipAddress = '' } = {}) => {
  const { status, hoursAwarded, reason } = correctionData;

  const existing = await Attendance.findById(attendanceId);
  if (!existing) {
    throw new AppError('Attendance record not found', 404);
  }

  const previousStatus = existing.status;
  const previousHours = existing.hoursAwarded;

  // Only allowed fields
  const update = {
    correctedAt: new Date(),
    correctedBy: actorUserId,
    correctionReason: reason || 'Administrative correction',
    previousStatus,
    previousHours,
  };

  if (status !== undefined) {
    update.status = status;
    update.hoursAwarded = status === 'PRESENT' ? (hoursAwarded ?? existing.hoursAwarded) : 0;
  }

  if (hoursAwarded !== undefined && status !== 'ABSENT') {
    update.hoursAwarded = hoursAwarded;
    update.status = 'CORRECTED';
  }

  const attendance = await Attendance.findByIdAndUpdate(attendanceId, update, { new: true });

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_CORRECTED',
    entityType: 'Attendance',
    entityId: attendanceId,
    details: {
      memberId: existing.memberId,
      activityId: existing.activityId,
      previousStatus,
      previousHours,
      newStatus: update.status || existing.status,
      newHours: update.hoursAwarded,
      reason,
    },
    ipAddress,
  });

  return attendance;
};
