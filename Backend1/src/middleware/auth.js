// src/middleware/auth.js
// Authentication and authorization middleware

import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * authenticate - Requires a valid JWT access token.
 * Attaches req.user to the request.
 */
export const authenticate = catchAsync(async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Authentication token missing.', 401);
  }

  // Verify token signature and claims
  const decoded = verifyAccessToken(token);

  // Fetch user to verify still exists and is active
  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AppError('User account not found.', 401);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
  }

  // Check password hasn't been changed after token was issued
  if (user.passwordChangedAfter(decoded.iat)) {
    throw new AppError('Password was recently changed. Please log in again.', 401);
  }

  // Attach verified user context to request
  req.user = {
    id: user._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    memberId: user.memberId ? user.memberId.toString() : null,
    accountStatus: user.accountStatus,
    sessionId: decoded.sessionId,
  };

  next();
});

/**
 * optionalAuthenticate - Attaches req.user if a valid token is present,
 * but does not fail if no token is provided.
 */
export const optionalAuthenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);

    if (user && user.accountStatus === 'ACTIVE') {
      req.user = {
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        memberId: user.memberId ? user.memberId.toString() : null,
        accountStatus: user.accountStatus,
        sessionId: decoded.sessionId,
      };
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
});

/**
 * authorizeRoles - Restrict access to specified roles.
 * Must be used AFTER authenticate.
 * NEVER trust role from client - always use req.user from verified context.
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`, 403)
      );
    }

    next();
  };
};

/**
 * requireAdmin - Shorthand for admin-only routes.
 */
export const requireAdmin = authorizeRoles('ADMIN');

/**
 * requireMember - Accessible by both ADMIN and MEMBER.
 */
export const requireMember = authorizeRoles('MEMBER', 'ADMIN');

/**
 * requireSelfOrAdmin - Resource-level: allows access only if the
 * requesting user owns the resource OR is an admin.
 * Checks req.params.id against req.user.memberId or req.user.id
 */
export const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  const paramId = req.params.id;
  const isOwnMember = req.user.memberId && req.user.memberId === paramId;
  const isOwnUser = req.user.id === paramId;

  if (!isOwnMember && !isOwnUser) {
    return next(new AppError('Access denied. You can only access your own data.', 403));
  }

  next();
};
