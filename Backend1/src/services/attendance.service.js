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

  // Resolve headers smartly from columnMapping or file headers
  const resolveHeader = (headersList, candidateNames, fallback) => {
    if (!headersList || headersList.length === 0) return fallback;
    for (const name of candidateNames) {
      const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = headersList.find(
        (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget
      );
      if (match) return match;
    }
    return fallback;
  };

  const studentIdCol =
    columnMapping?.studentId && headers.includes(columnMapping.studentId)
      ? columnMapping.studentId
      : resolveHeader(
          headers,
          ['studentId', 'student_id', 'student id', 'studentid', 'matric', 'matricno', 'id'],
          headers[0] || 'studentId'
        );

  const emailCol =
    columnMapping?.email && headers.includes(columnMapping.email)
      ? columnMapping.email
      : resolveHeader(
          headers,
          ['email', 'emailaddress', 'email address', 'mail'],
          'email'
        );

  const fullNameCol =
    columnMapping?.fullName && headers.includes(columnMapping.fullName)
      ? columnMapping.fullName
      : resolveHeader(
          headers,
          ['fullname', 'full name', 'name', 'studentname', 'student name'],
          'fullName'
        );

  const finalMapping = {
    studentId: studentIdCol,
    email: emailCol,
    fullName: fullNameCol,
  };

  // Create the import record in PROCESSING state
  const importRecord = await AttendanceImport.create({
    activityId,
    uploadedBy: actorUserId,
    originalFilename,
    fileChecksum,
    totalRows: rows.length,
    status: 'PROCESSING',
    columnMapping: finalMapping,
  });

  // Pre-fetch existing attendance for deduplication against this activity
  const existingAttendance = await Attendance.find({
    activityId: activity._id,
  })
    .select('memberId')
    .lean();
  const existingMemberIds = new Set(existingAttendance.map((a) => a.memberId.toString()));

  const seenStudentIds = new Set();
  const rowDocs = [];
  const results = {
    valid: 0,
    duplicate: 0,
    unknownMember: 0,
    emailMismatch: 0,
    invalid: 0,
    alreadyImported: 0,
  };

  // Validate and build row documents
  for (const rowItem of rows) {
    const row = rowItem.data || {};
    const rawStudentId = row[studentIdCol] || row['studentId'] || row['Student ID'] || '';
    const rawEmail = row[emailCol] || row['email'] || row['Email'] || '';
    const rawName = row[fullNameCol] || row['fullName'] || row['Full Name'] || row['Name'] || '';

    const studentId = normalizeStudentId(rawStudentId);
    const email = normalizeEmail(rawEmail);

    if (!studentId && !email) {
      results.invalid++;
      rowDocs.push({
        importId: importRecord._id,
        rowNumber: rowItem.rowNumber,
        rawData: row,
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'INVALID',
        errors: [{ field: 'studentId', message: 'Student ID or Email is missing' }],
      });
      continue;
    }

    // Within-file duplicate check
    const dedupKey = studentId || email;
    if (seenStudentIds.has(dedupKey)) {
      results.duplicate++;
      rowDocs.push({
        importId: importRecord._id,
        rowNumber: rowItem.rowNumber,
        rawData: row,
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'DUPLICATE',
        errors: [{ field: 'studentId', message: 'Duplicate record in this file' }],
      });
      continue;
    }
    seenStudentIds.add(dedupKey);

    // Find member by student ID or email
    const query = [];
    if (studentId) query.push({ studentId });
    if (email) query.push({ email });

    const member = await Member.findOne({
      $or: query,
      status: 'ACTIVE',
    }).lean();

    if (!member) {
      results.unknownMember++;
      rowDocs.push({
        importId: importRecord._id,
        rowNumber: rowItem.rowNumber,
        rawData: row,
        normalizedData: { studentId, email, fullName: rawName },
        validationStatus: 'UNKNOWN_MEMBER',
        errors: [
          {
            field: 'studentId',
            message: `No active member found with ID: ${studentId || email}`,
          },
        ],
      });
      continue;
    }

    // Check if attendance already recorded for this activity
    if (existingMemberIds.has(member._id.toString())) {
      results.alreadyImported++;
      rowDocs.push({
        importId: importRecord._id,
        rowNumber: rowItem.rowNumber,
        rawData: row,
        normalizedData: { studentId, email, fullName: rawName },
        resolvedMemberId: member._id,
        validationStatus: 'ALREADY_IMPORTED',
        errors: [{ field: 'studentId', message: 'Attendance already recorded for this activity' }],
      });
      continue;
    }

    // Valid
    results.valid++;
    rowDocs.push({
      importId: importRecord._id,
      rowNumber: rowItem.rowNumber,
      rawData: row,
      normalizedData: { studentId: member.studentId, email: member.email, fullName: member.fullName },
      resolvedMemberId: member._id,
      validationStatus: 'VALID',
      errors: [],
    });
  }

  // Bulk insert row records
  if (rowDocs.length > 0) {
    await AttendanceImportRow.insertMany(rowDocs);
  }

  // Update import record to VALIDATED status with stats
  const finalStatus = results.valid > 0 ? 'VALIDATED' : rows.length === 0 ? 'UPLOADED' : 'VALIDATED';
  await AttendanceImport.findByIdAndUpdate(importRecord._id, {
    status: finalStatus,
    validRows: results.valid,
    duplicateRows: results.duplicate,
    unknownMemberRows: results.unknownMember,
    mismatchedEmailRows: results.emailMismatch,
    invalidRows: results.invalid + results.alreadyImported,
    validationSummary: results,
  });

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_IMPORT_UPLOADED',
    entityType: 'AttendanceImport',
    entityId: importRecord._id,
    details: { activityId, filename: originalFilename, totalRows: rows.length, validRows: results.valid },
    ipAddress,
  });

  return {
    importId: importRecord._id,
    _id: importRecord._id,
    id: importRecord._id,
    headers,
    totalRows: rows.length,
    validRows: results.valid,
    duplicateRows: results.duplicate,
    unknownMemberRows: results.unknownMember,
    status: finalStatus,
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
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const filter = {};
  if (activityId) filter.activityId = activityId;
  if (status) filter.status = status;

  const skip = (p - 1) * l;
  const countPromise = Object.keys(filter).length === 0
    ? AttendanceImport.estimatedDocumentCount()
    : AttendanceImport.countDocuments(filter);

  const [imports, total] = await Promise.all([
    AttendanceImport.find(filter)
      .select('-validationSummary')
      .populate('activityId', 'title activityCode activityDate')
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    countPromise,
  ]);

  return {
    imports,
    pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
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
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const filter = {};
  if (memberId) filter.memberId = new mongoose.Types.ObjectId(memberId);
  if (activityId) filter.activityId = new mongoose.Types.ObjectId(activityId);
  if (status) filter.status = status;

  const skip = (p - 1) * l;
  const countPromise = Object.keys(filter).length === 0
    ? Attendance.estimatedDocumentCount()
    : Attendance.countDocuments(filter);

  const [attendance, total] = await Promise.all([
    Attendance.find(filter)
      .populate('memberId', 'studentId fullName email department')
      .populate('activityId', 'title activityCode activityDate ccaHours')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    countPromise,
  ]);

  return {
    attendance,
    pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
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

/**
 * Manually record attendance for a member
 */
export const recordManualAttendance = async (
  { memberId, activityId, status = 'PRESENT', hoursAwarded = null, recordedAt = null, notes = '' },
  actorUserId,
  { ipAddress = '' } = {}
) => {
  // Validate member
  let member = null;
  if (mongoose.isValidObjectId(memberId)) {
    member = await Member.findById(memberId);
  }
  if (!member && typeof memberId === 'string') {
    member = await Member.findOne({ studentId: memberId.trim().toUpperCase() });
  }
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Validate activity
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new AppError('Activity not found', 404);
  }
  if (activity.status === 'CANCELLED') {
    throw new AppError('Cannot record attendance for a cancelled activity', 400);
  }

  // Determine hours awarded: custom hours or activity default
  const finalHours =
    hoursAwarded !== null && hoursAwarded !== undefined && !isNaN(Number(hoursAwarded))
      ? Number(hoursAwarded)
      : status === 'PRESENT'
      ? activity.ccaHours || 0
      : 0;

  // Check if attendance already exists for this member & activity
  const existing = await Attendance.findOne({
    memberId: member._id,
    activityId: activity._id,
  });

  let attendanceRecord;
  if (existing) {
    // Update existing attendance
    existing.status = status;
    existing.hoursAwarded = finalHours;
    existing.recordedBy = actorUserId;
    if (recordedAt) existing.recordedAt = new Date(recordedAt);
    if (notes) existing.correctionReason = notes;
    await existing.save();
    attendanceRecord = existing;
  } else {
    // Create new attendance
    attendanceRecord = await Attendance.create({
      memberId: member._id,
      activityId: activity._id,
      status,
      hoursAwarded: finalHours,
      recordedBy: actorUserId,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      correctionReason: notes || null,
    });
  }

  await createAuditLog({
    actorUserId,
    action: existing ? 'ATTENDANCE_MANUALLY_UPDATED' : 'ATTENDANCE_MANUALLY_RECORDED',
    entityType: 'Attendance',
    entityId: attendanceRecord._id,
    details: {
      memberId: member._id,
      studentId: member.studentId,
      activityId: activity._id,
      activityCode: activity.activityCode,
      status,
      hoursAwarded: finalHours,
    },
    ipAddress,
  });

  const populated = await Attendance.findById(attendanceRecord._id)
    .populate('memberId', 'studentId fullName email department')
    .populate('activityId', 'title activityCode activityDate ccaHours status')
    .lean();

  return populated;
};

/**
 * Delete an attendance record
 */
export const deleteAttendance = async (attendanceId, actorUserId, { ipAddress = '' } = {}) => {
  const existing = await Attendance.findById(attendanceId);
  if (!existing) {
    throw new AppError('Attendance record not found', 404);
  }

  await Attendance.findByIdAndDelete(attendanceId);

  await createAuditLog({
    actorUserId,
    action: 'ATTENDANCE_RECORD_DELETED',
    entityType: 'Attendance',
    entityId: attendanceId,
    details: { memberId: existing.memberId, activityId: existing.activityId },
    ipAddress,
  });

  return { success: true };
};
