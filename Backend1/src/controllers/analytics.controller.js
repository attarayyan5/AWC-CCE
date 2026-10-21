// src/controllers/analytics.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as analyticsService from '../services/analytics.service.js';

export const getOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getOverview(req.query);
  sendSuccess(res, { data });
});

export const getTopMembers = catchAsync(async (req, res) => {
  const data = await analyticsService.getTopMembersByHours(req.query);
  sendSuccess(res, { data: { topMembers: data } });
});

export const getActivityParticipation = catchAsync(async (req, res) => {
  const data = await analyticsService.getActivityParticipation(req.query);
  sendSuccess(res, { data: { participation: data } });
});

export const getMonthlyTrends = catchAsync(async (req, res) => {
  const data = await analyticsService.getMonthlyTrends(req.query);
  sendSuccess(res, { data: { trends: data } });
});

export const getDepartmentStats = catchAsync(async (req, res) => {
  const data = await analyticsService.getDepartmentStats();
  sendSuccess(res, { data: { departments: data } });
});

export const getHoursDistribution = catchAsync(async (req, res) => {
  const data = await analyticsService.getHoursDistribution();
  sendSuccess(res, { data: { distribution: data } });
});
