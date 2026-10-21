// src/utils/tokens.js
// JWT access token generation/verification and secure refresh token handling

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import AppError from './AppError.js';

/**
 * Generate a short-lived JWT access token
 */
export const generateAccessToken = (payload) => {
  const { userId, role, sessionId } = payload;

  return jwt.sign(
    {
      sub: userId,
      role,
      sessionId,
      type: 'access',
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }
  );
};

/**
 * Verify and decode a JWT access token
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    // Ensure token type
    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401);
    }

    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid access token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};

/**
 * Generate a cryptographically secure refresh token
 * Returns the raw token (to send to client) and its SHA-256 hash (to store in DB)
 */
export const generateRefreshToken = () => {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(rawToken);
  return { rawToken, tokenHash };
};

/**
 * Hash a refresh token for storage
 */
export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a password reset token
 */
export const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};
