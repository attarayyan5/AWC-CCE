// src/controllers/auditLog.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getAuditLogs } from '../services/auditLog.service.js';

export const getLogs = catchAsync(async (req, res) => {
  const result = await getAuditLogs(req.query);
  sendSuccess(res, { data: { logs: result.logs }, pagination: result.pagination });
});
