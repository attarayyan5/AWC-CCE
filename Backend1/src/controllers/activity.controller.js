// src/controllers/activity.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as activityService from '../services/activity.service.js';

export const createActivity = catchAsync(async (req, res) => {
  const activity = await activityService.createActivity(req.body, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { statusCode: 201, message: 'Activity created successfully', data: { activity } });
});

export const getActivities = catchAsync(async (req, res) => {
  const result = await activityService.getActivities(req.query);
  sendSuccess(res, { data: { activities: result.activities }, pagination: result.pagination });
});

export const getActivityById = catchAsync(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.id);
  sendSuccess(res, { data: { activity } });
});

export const updateActivity = catchAsync(async (req, res) => {
  const activity = await activityService.updateActivity(req.params.id, req.body, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Activity updated successfully', data: { activity } });
});

export const updateActivityStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const activity = await activityService.updateActivityStatus(req.params.id, status, req.user.id, { reason, ipAddress: req.ip });
  sendSuccess(res, { message: `Activity status updated to ${status}`, data: { activity } });
});

export const getActivityAttendance = catchAsync(async (req, res) => {
  const result = await activityService.getActivityAttendance(req.params.id, req.query);
  sendSuccess(res, { data: result });
});
