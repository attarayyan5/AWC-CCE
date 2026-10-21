// src/controllers/attendance.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as attendanceService from '../services/attendance.service.js';
import AppError from '../utils/AppError.js';

export const uploadImport = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const { activityId } = req.body;
  if (!activityId) throw new AppError('Activity ID is required', 400);

  const columnMapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : {};
  const result = await attendanceService.uploadAttendanceFile(req.file, activityId, columnMapping, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { statusCode: 201, message: 'File uploaded. Ready for validation.', data: result });
});

export const validateImport = catchAsync(async (req, res) => {
  const { columnMapping } = req.body;
  if (!columnMapping) throw new AppError('Column mapping is required', 400);
  const result = await attendanceService.validateImport(req.params.id, columnMapping, req.user.id);
  sendSuccess(res, { message: 'Validation complete', data: result });
});

export const confirmImport = catchAsync(async (req, res) => {
  const result = await attendanceService.confirmImport(req.params.id, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Attendance import confirmed', data: result });
});

export const cancelImport = catchAsync(async (req, res) => {
  const result = await attendanceService.cancelImport(req.params.id, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Import cancelled', data: result });
});

export const getImports = catchAsync(async (req, res) => {
  const result = await attendanceService.getImports(req.query);
  sendSuccess(res, { data: { imports: result.imports }, pagination: result.pagination });
});

export const getImportById = catchAsync(async (req, res) => {
  const importData = await attendanceService.getImportById(req.params.id);
  sendSuccess(res, { data: { import: importData } });
});

export const getAttendance = catchAsync(async (req, res) => {
  // Members can only see their own attendance
  const filter = { ...req.query };
  if (req.user.role === 'MEMBER') {
    filter.memberId = req.user.memberId;
    if (!filter.memberId) throw new AppError('No linked member profile found', 400);
  }
  const result = await attendanceService.getAttendance(filter);
  sendSuccess(res, { data: { attendance: result.attendance }, pagination: result.pagination });
});

export const correctAttendance = catchAsync(async (req, res) => {
  const result = await attendanceService.correctAttendance(req.params.id, req.body, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Attendance corrected', data: { attendance: result } });
});
