// src/middleware/rateLimiter.js
// Rate limiters disabled per configuration

const noop = (req, res, next) => next();

/**
 * Auth endpoints rate limiter (Disabled)
 */
export const authLimiter = noop;

/**
 * General API endpoints rate limiter (Disabled)
 */
export const apiLimiter = noop;

/**
 * File upload endpoints rate limiter (Disabled)
 */
export const uploadLimiter = noop;

/**
 * Password reset rate limiter (Disabled)
 */
export const passwordResetLimiter = noop;

