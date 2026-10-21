// src/controllers/auth.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const meta = { ipAddress: req.ip, userAgent: req.get('User-Agent') || '' };

  const { accessToken, rawRefreshToken, user } = await authService.login(email, password, meta);
  authService.setRefreshCookie(res, rawRefreshToken);

  sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful',
    data: {
      accessToken,
      user: { id: user._id, email: user.email, role: user.role, memberId: user.memberId },
    },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  const meta = { ipAddress: req.ip, userAgent: req.get('User-Agent') || '' };

  const result = await authService.refreshAccessToken(rawRefreshToken, meta);
  authService.setRefreshCookie(res, result.rawRefreshToken);

  sendSuccess(res, {
    message: 'Token refreshed',
    data: {
      accessToken: result.accessToken,
      user: { id: result.user._id, email: result.user.email, role: result.user.role, memberId: result.user.memberId },
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  await authService.logout(rawRefreshToken, req.user?.id, { ipAddress: req.ip });
  authService.clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAll(req.user.id, { ipAddress: req.ip });
  authService.clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out from all devices' });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  sendSuccess(res, { data: { user } });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword, { ipAddress: req.ip });
  authService.clearRefreshCookie(res);
  sendSuccess(res, { message: 'Password changed successfully. Please log in again.' });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email, { ipAddress: req.ip });
  sendSuccess(res, { message: result.message, data: result.devToken ? { devToken: result.devToken } : undefined });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword, { ipAddress: req.ip });
  sendSuccess(res, { message: result.message });
});
