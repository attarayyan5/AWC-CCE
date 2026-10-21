// src/controllers/report.controller.js
import catchAsync from '../utils/catchAsync.js';
import * as reportService from '../services/report.service.js';
import { createAuditLog } from '../services/auditLog.service.js';
import AppError from '../utils/AppError.js';

export const getMemberReport = catchAsync(async (req, res) => {
  // Members can only export their own data
  const filters = { ...req.query };
  if (req.user.role === 'MEMBER') {
    filters.memberId = req.user.memberId;
    if (!filters.memberId) throw new AppError('No linked member profile found', 400);
  }

  const data = await reportService.generateMemberReport(filters);
  const format = req.query.format || 'json';

  if (format === 'csv') {
    const csv = reportService.exportToCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=member-report.csv');
    return res.send(csv);
  }

  if (format === 'excel') {
    const buffer = await reportService.exportToExcel(data, 'Member CCA Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=member-report.xlsx');
    return res.send(Buffer.from(buffer));
  }

  await createAuditLog({ actorUserId: req.user.id, action: 'REPORT_EXPORTED', entityType: 'Member', details: { format, filters }, ipAddress: req.ip });
  res.json({ success: true, data: { report: data } });
});

export const getActivityReport = catchAsync(async (req, res) => {
  if (req.user.role !== 'ADMIN') throw new AppError('Admin access required', 403);

  const data = await reportService.generateActivityReport(req.query);
  const format = req.query.format || 'json';

  if (format === 'csv') {
    const csv = reportService.exportToCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity-report.csv');
    return res.send(csv);
  }

  if (format === 'excel') {
    const buffer = await reportService.exportToExcel(data, 'Activity Attendance Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=activity-report.xlsx');
    return res.send(Buffer.from(buffer));
  }

  await createAuditLog({ actorUserId: req.user.id, action: 'REPORT_EXPORTED', entityType: 'Activity', details: { format }, ipAddress: req.ip });
  res.json({ success: true, data: { report: data } });
});

export const exportReport = catchAsync(async (req, res) => {
  const { type = 'members', format = 'excel' } = req.query;

  let data;
  let sheetName;

  if (type === 'members') {
    const filters = { ...req.query };
    if (req.user.role === 'MEMBER') {
      filters.memberId = req.user.memberId;
      if (!filters.memberId) throw new AppError('No linked member profile found', 400);
    }
    data = await reportService.generateMemberReport(filters);
    sheetName = 'Member CCA Report';
  } else if (type === 'activities') {
    if (req.user.role !== 'ADMIN') throw new AppError('Admin access required', 403);
    data = await reportService.generateActivityReport(req.query);
    sheetName = 'Activity Attendance Report';
  } else {
    throw new AppError('Invalid report type. Must be "members" or "activities"', 400);
  }

  if (format === 'csv') {
    const csv = reportService.exportToCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    return res.send(csv);
  }

  const buffer = await reportService.exportToExcel(data, sheetName);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);

  await createAuditLog({ actorUserId: req.user.id, action: 'REPORT_EXPORTED', details: { type, format }, ipAddress: req.ip });
  return res.send(Buffer.from(buffer));
});
