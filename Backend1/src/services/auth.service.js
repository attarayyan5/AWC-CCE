// src/services/auth.service.js
// Authentication business logic

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Member from '../models/Member.js';
import RefreshSession from '../models/RefreshSession.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generatePasswordResetToken,
} from '../utils/tokens.js';
import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';
import { createAuditLog } from './auditLog.service.js';

/**
 * Compute refresh token expiry date
 */
const getRefreshTokenExpiry = () => {
  const days = config.refreshToken.expiresInDays;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/**
 * Set refresh token cookie on response
 */
const setRefreshCookie = (res, rawToken) => {
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/api/v1/auth',
    maxAge: config.refreshToken.expiresInDays * 24 * 60 * 60 * 1000,
  });
};

/**
 * Clear refresh token cookie
 */
const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/api/v1/auth',
  });
};

/**
 * Login with email and password
 */
export const login = async (email, password, { ipAddress = '', userAgent = '' } = {}) => {
  // Fetch user with passwordHash (normally excluded)
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokenFamilyId = uuidv4();
  const { rawToken: rawRefreshToken, tokenHash: refreshTokenHash } = generateRefreshToken();

  // Create refresh session
  const session = await RefreshSession.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    tokenFamilyId,
    expiresAt: getRefreshTokenExpiry(),
    userAgent,
    ipAddress,
  });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
    sessionId: session._id.toString(),
  });

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  await createAuditLog({
    actorUserId: user._id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email },
    ipAddress,
  });

  return { accessToken, rawRefreshToken, user };
};

/**
 * Refresh access token using rotating refresh token
 */
export const refreshAccessToken = async (rawRefreshToken, { ipAddress = '', userAgent = '' } = {}) => {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token not provided', 401);
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);

  // Find session by hash
  const session = await RefreshSession.findOne({ tokenHash });

  if (!session) {
    // Possible reuse of a revoked token - this is a security event
    // We cannot identify the family without the session, so just reject
    throw new AppError('Invalid refresh token. Please log in again.', 401);
  }

  // Check if already revoked (reuse detection)
  if (session.revokedAt) {
    // Token reuse detected - invalidate the entire family
    await RefreshSession.updateMany(
      { tokenFamilyId: session.tokenFamilyId },
      { revokedAt: new Date() }
    );
    throw new AppError('Refresh token reuse detected. All sessions have been revoked for security. Please log in again.', 401);
  }

  // Check expiry
  if (session.expiresAt < new Date()) {
    await RefreshSession.findByIdAndUpdate(session._id, { revokedAt: new Date() });
    throw new AppError('Refresh token expired. Please log in again.', 401);
  }

  // Fetch user
  const user = await User.findById(session.userId);
  if (!user || user.accountStatus !== 'ACTIVE') {
    await RefreshSession.findByIdAndUpdate(session._id, { revokedAt: new Date() });
    throw new AppError('User account not found or deactivated.', 401);
  }

  // Rotate: revoke old session
  await RefreshSession.findByIdAndUpdate(session._id, { revokedAt: new Date() });

  // Generate new tokens
  const { rawToken: newRawToken, tokenHash: newTokenHash } = generateRefreshToken();
  const newSession = await RefreshSession.create({
    userId: user._id,
    tokenHash: newTokenHash,
    tokenFamilyId: session.tokenFamilyId, // Keep same family
    expiresAt: getRefreshTokenExpiry(),
    userAgent,
    ipAddress,
  });

  // Update old session to reference new one
  await RefreshSession.findByIdAndUpdate(session._id, { replacedBySessionId: newSession._id });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
    sessionId: newSession._id.toString(),
  });

  return { accessToken, rawRefreshToken: newRawToken, user };
};

/**
 * Logout - revoke current session
 */
export const logout = async (rawRefreshToken, userId, { ipAddress = '' } = {}) => {
  if (rawRefreshToken) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await RefreshSession.findOneAndUpdate(
      { tokenHash, userId },
      { revokedAt: new Date() }
    );
  }

  await createAuditLog({
    actorUserId: userId,
    action: 'USER_LOGOUT',
    entityType: 'User',
    entityId: userId,
    details: {},
    ipAddress,
  });
};

/**
 * Logout all sessions for a user
 */
export const logoutAll = async (userId, { ipAddress = '' } = {}) => {
  await RefreshSession.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );

  await createAuditLog({
    actorUserId: userId,
    action: 'USER_LOGOUT_ALL',
    entityType: 'User',
    entityId: userId,
    details: { reason: 'User initiated logout from all devices' },
    ipAddress,
  });
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId).populate('memberId');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword, { ipAddress = '' } = {}) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const passwordMatch = await user.comparePassword(currentPassword);
  if (!passwordMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  await user.setPassword(newPassword);
  await user.save();

  // Revoke all existing sessions to force re-login on other devices
  await RefreshSession.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );

  await createAuditLog({
    actorUserId: userId,
    action: 'USER_PASSWORD_CHANGED',
    entityType: 'User',
    entityId: userId,
    details: {},
    ipAddress,
  });
};

/**
 * Initiate password reset (forgot password)
 */
export const forgotPassword = async (email, { ipAddress = '' } = {}) => {
  const user = await User.findOne({ email });
  // Always respond success to prevent email enumeration
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: tokenHash,
    passwordResetExpires: expires,
  });

  // In production, send email here. For now, return the token (dev only).
  await createAuditLog({
    actorUserId: user._id,
    action: 'USER_PASSWORD_RESET',
    entityType: 'User',
    entityId: user._id,
    details: { initiated: true },
    ipAddress,
  });

  return {
    message: 'Password reset email sent. Check your inbox.',
    // Only include rawToken in dev for testing - remove before production
    ...(config.env === 'development' && { devToken: rawToken }),
  };
};

/**
 * Complete password reset
 */
export const resetPassword = async (rawToken, newPassword, { ipAddress = '' } = {}) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid or expired password reset token', 400);
  }

  await user.setPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all sessions
  await RefreshSession.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  await createAuditLog({
    actorUserId: user._id,
    action: 'USER_PASSWORD_RESET',
    entityType: 'User',
    entityId: user._id,
    details: { completed: true },
    ipAddress,
  });

  return { message: 'Password reset successful. Please log in with your new password.' };
};

export { setRefreshCookie, clearRefreshCookie };
