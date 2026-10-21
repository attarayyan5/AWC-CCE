// src/middleware/rateLimiter.js
// Rate limiting middleware for different endpoint types

import rateLimit from 'express-rate-limit';

/**
 * Auth endpoints: 5 requests per 15 minutes
 * Prevents brute-force attacks on login
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * General API endpoints: 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload endpoints: 10 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many file uploads. Please wait before uploading again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset: 3 requests per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
