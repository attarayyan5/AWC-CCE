// src/controllers/member.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as memberService from '../services/member.service.js';

export const createMember = catchAsync(async (req, res) => {
  const member = await memberService.createMember(req.body, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { statusCode: 201, message: 'Member registered successfully', data: { member } });
});

export const getMembers = catchAsync(async (req, res) => {
  const result = await memberService.getMembers(req.query);
  sendSuccess(res, { data: { members: result.members }, pagination: result.pagination });
});

export const getMemberById = catchAsync(async (req, res) => {
  const member = await memberService.getMemberById(req.params.id, req.user);
  sendSuccess(res, { data: { member } });
});

export const updateMember = catchAsync(async (req, res) => {
  const member = await memberService.updateMember(req.params.id, req.body, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Member updated successfully', data: { member } });
});

export const updateMemberStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const member = await memberService.updateMemberStatus(req.params.id, status, req.user.id, { reason, ipAddress: req.ip });
  sendSuccess(res, { message: `Member ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`, data: { member } });
});

export const getMemberReport = catchAsync(async (req, res) => {
  const report = await memberService.getMemberReport(req.params.id, req.user);
  sendSuccess(res, { data: report });
});

export const getDistinctFilters = catchAsync(async (req, res) => {
  const [departments, academicYears] = await Promise.all([
    memberService.getDistinctDepartments(),
    memberService.getDistinctAcademicYears(),
  ]);
  sendSuccess(res, { data: { departments, academicYears } });
});
