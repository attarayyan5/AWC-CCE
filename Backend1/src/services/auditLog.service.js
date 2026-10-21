// src/services/auditLog.service.js
// Creates audit log entries for important administrative actions

import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Create an audit log entry.
 * Never include passwords, tokens, hashes, or sensitive data in details.
 */
export const createAuditLog = async ({
  actorUserId = null,
  action,
  entityType = null,
  entityId = null,
  details = {},
  ipAddress = '',
}) => {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details,
      ipAddress,
    });
  } catch (error) {
    // Audit logging must not break business operations
    logger.error('Failed to create audit log entry:', { action, error: error.message });
  }
};

/**
 * Get audit logs with pagination and filtering.
 */
export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  action = null,
  actorUserId = null,
  entityType = null,
  startDate = null,
  endDate = null,
} = {}) => {
  const filter = {};

  if (action) filter.action = action;
  if (actorUserId) filter.actorUserId = actorUserId;
  if (entityType) filter.entityType = entityType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorUserId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
