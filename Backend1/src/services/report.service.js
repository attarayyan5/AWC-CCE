// src/services/report.service.js
// Report generation with CSV and Excel exports

import ExcelJS from 'exceljs';
import Member from '../models/Member.js';
import Activity from '../models/Activity.js';
import Attendance from '../models/Attendance.js';
import AttendanceImportRow from '../models/AttendanceImportRow.js';
import { sanitizeForSpreadsheet } from '../utils/sanitize.js';
import AppError from '../utils/AppError.js';
import mongoose from 'mongoose';

/**
 * Apply formula injection prevention to all string values in an object
 */
const sanitizeRow = (row) => {
  const safe = {};
  for (const [key, value] of Object.entries(row)) {
    safe[key] = typeof value === 'string' ? sanitizeForSpreadsheet(value) : value;
  }
  return safe;
};

/**
 * Generate member CCA hours report
 */
export const generateMemberReport = async ({
  memberId = null,
  department = null,
  academicYear = null,
  startDate = null,
  endDate = null,
} = {}) => {
  // Build attendance filter
  const attendanceFilter = { status: 'PRESENT' };
  if (startDate || endDate) {
    attendanceFilter.recordedAt = {};
    if (startDate) attendanceFilter.recordedAt.$gte = new Date(startDate);
    if (endDate) attendanceFilter.recordedAt.$lte = new Date(endDate);
  }
  if (memberId) {
    attendanceFilter.memberId = new mongoose.Types.ObjectId(memberId);
  }

  // Member filter
  const memberFilter = {};
  if (department) memberFilter.department = department;
  if (academicYear) memberFilter.academicYear = academicYear;
  if (memberId) memberFilter._id = new mongoose.Types.ObjectId(memberId);

  const members = await Member.find(memberFilter).lean();
  const memberIds = members.map((m) => m._id);

  if (memberId && !memberIds.length) {
    throw new AppError('Member not found', 404);
  }

  // Aggregate CCA hours per member
  const hoursAgg = await Attendance.aggregate([
    {
      $match: {
        ...attendanceFilter,
        memberId: { $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $group: {
        _id: '$memberId',
        totalHours: { $sum: '$hoursAwarded' },
        activitiesAttended: { $sum: 1 },
      },
    },
  ]);

  const hoursMap = {};
  hoursAgg.forEach((h) => {
    hoursMap[h._id.toString()] = h;
  });

  return members.map((m) => {
    const hours = hoursMap[m._id.toString()] || { totalHours: 0, activitiesAttended: 0 };
    return sanitizeRow({
      studentId: m.studentId,
      fullName: m.fullName,
      email: m.email,
      department: m.department,
      academicYear: m.academicYear,
      division: m.division || '',
      status: m.status,
      totalCcaHours: hours.totalHours,
      activitiesAttended: hours.activitiesAttended,
      joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : '',
    });
  });
};

/**
 * Generate activity-wise attendance report
 */
export const generateActivityReport = async ({
  activityId = null,
  startDate = null,
  endDate = null,
  status = null,
} = {}) => {
  const attendanceFilter = {};
  if (activityId) attendanceFilter.activityId = new mongoose.Types.ObjectId(activityId);

  const attendance = await Attendance.find(attendanceFilter)
    .populate('memberId', 'studentId fullName email department academicYear')
    .populate('activityId', 'title activityCode activityDate category ccaHours status')
    .sort({ 'activityId.activityDate': -1, 'memberId.studentId': 1 })
    .lean();

  return attendance
    .filter((a) => {
      if (status && a.status !== status) return false;
      if (startDate && a.activityId?.activityDate < new Date(startDate)) return false;
      if (endDate && a.activityId?.activityDate > new Date(endDate)) return false;
      return true;
    })
    .map((a) =>
      sanitizeRow({
        activityCode: a.activityId?.activityCode || '',
        activityTitle: a.activityId?.title || '',
        activityDate: a.activityId?.activityDate
          ? new Date(a.activityId.activityDate).toISOString().split('T')[0]
          : '',
        category: a.activityId?.category || '',
        ccaHours: a.activityId?.ccaHours || 0,
        activityStatus: a.activityId?.status || '',
        studentId: a.memberId?.studentId || '',
        fullName: a.memberId?.fullName || '',
        email: a.memberId?.email || '',
        department: a.memberId?.department || '',
        academicYear: a.memberId?.academicYear || '',
        attendanceStatus: a.status,
        hoursAwarded: a.hoursAwarded,
        recordedAt: a.recordedAt ? new Date(a.recordedAt).toISOString() : '',
      })
    );
};

/**
 * Export data as Excel workbook buffer
 */
export const exportToExcel = async (data, sheetName = 'Report') => {
  if (!data || data.length === 0) {
    throw new AppError('No data to export', 400);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AWS Club Management System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  // Headers from first row keys
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map((key) => ({
    header: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim(),
    key,
    width: Math.max(15, key.length + 5),
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-fit columns
  worksheet.columns.forEach((col) => {
    let maxLength = col.header ? col.header.length : 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const cellLength = cell.value ? String(cell.value).length : 0;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    col.width = Math.min(50, maxLength + 2);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Export data as CSV string
 */
export const exportToCsv = (data) => {
  if (!data || data.length === 0) {
    throw new AppError('No data to export', 400);
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map((row) => {
    return headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\n');
};
