// src/services/activity.service.js
// CCA Activity management business logic

import Activity from '../models/Activity.js';
import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';
import { generateActivityCode } from '../utils/studentId.js';
import AppError from '../utils/AppError.js';
import { createAuditLog } from './auditLog.service.js';
import mongoose from 'mongoose';

/**
 * Create a new CCA activity
 */
export const createActivity = async (activityData, actorUserId, { ipAddress = '' } = {}) => {
  const activityCode = await generateActivityCode();

  const activity = await Activity.create({
    ...activityData,
    activityCode,
    activityDate: new Date(activityData.activityDate),
    createdBy: actorUserId,
  });

  await createAuditLog({
    actorUserId,
    action: 'ACTIVITY_CREATED',
    entityType: 'Activity',
    entityId: activity._id,
    details: { activityCode, title: activity.title, ccaHours: activity.ccaHours },
    ipAddress,
  });

  return activity;
};

/**
 * Get paginated list of activities with filtering
 */
export const getActivities = async ({
  page = 1,
  limit = 20,
  search = '',
  category = 'ALL',
  status = 'ALL',
  startDate = null,
  endDate = null,
  sortBy = 'activityDate',
  sortOrder = 'desc',
} = {}) => {
  const filter = {};

  if (status !== 'ALL') filter.status = status;
  if (category !== 'ALL') filter.category = category;

  if (startDate || endDate) {
    filter.activityDate = {};
    if (startDate) filter.activityDate.$gte = new Date(startDate);
    if (endDate) filter.activityDate.$lte = new Date(endDate);
  }

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: searchRegex },
      { activityCode: searchRegex },
      { description: searchRegex },
    ];
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate('createdBy', 'email')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Get a single activity by ID or activityCode
 */
export const getActivityById = async (id) => {
  let activity;

  if (mongoose.Types.ObjectId.isValid(id)) {
    activity = await Activity.findById(id).populate('createdBy', 'email').lean();
  }

  if (!activity) {
    activity = await Activity.findOne({ activityCode: id.toUpperCase() })
      .populate('createdBy', 'email')
      .lean();
  }

  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  return activity;
};

/**
 * Update an activity (allowlisted fields, with hour-change auditing)
 */
export const updateActivity = async (id, updateData, actorUserId, { ipAddress = '' } = {}) => {
  const allowedFields = [
    'title', 'description', 'category', 'activityDate', 'startTime',
    'endTime', 'location', 'ccaHours', 'status',
  ];

  const safeUpdate = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      safeUpdate[field] = updateData[field];
    }
  }

  if (safeUpdate.activityDate) {
    safeUpdate.activityDate = new Date(safeUpdate.activityDate);
  }

  const existing = await Activity.findById(id);
  if (!existing) {
    throw new AppError('Activity not found', 404);
  }

  const hoursChanged = safeUpdate.ccaHours !== undefined && safeUpdate.ccaHours !== existing.ccaHours;
  const previousHours = existing.ccaHours;

const activity = await Activity.findByIdAndUpdate(id, safeUpdate, {
  returnDocument: 'after',
  runValidators: true,
});
  const action = hoursChanged ? 'ACTIVITY_CCA_HOURS_CHANGED' : 'ACTIVITY_UPDATED';
  await createAuditLog({
    actorUserId,
    action,
    entityType: 'Activity',
    entityId: activity._id,
    details: {
      updatedFields: Object.keys(safeUpdate),
      ...(hoursChanged && { previousHours, newHours: safeUpdate.ccaHours }),
    },
    ipAddress,
  });

  return activity;
};

/**
 * Update activity status
 */
export const updateActivityStatus = async (
  id,
  status,
  actorUserId,
  { reason = '', ipAddress = '' } = {}
) => {
  const activity = await Activity.findById(id);

  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  // Store the previous status before updating
  const previousStatus = activity.status;

  // Prevent completed activities from reverting to upcoming
  if (previousStatus === 'COMPLETED' && status === 'UPCOMING') {
    throw new AppError(
      'Cannot revert a COMPLETED activity to UPCOMING status',
      400
    );
  }

  activity.status = status;
  await activity.save();

  await createAuditLog({
    actorUserId,
    action: 'ACTIVITY_STATUS_CHANGED',
    entityType: 'Activity',
    entityId: activity._id,
    details: {
      activityCode: activity.activityCode,
      previousStatus,
      newStatus: status,
      reason,
    },
    ipAddress,
  });

  return activity;
};

/**
 * Get attendance list for an activity
 */
export const getActivityAttendance = async (activityId, { page = 1, limit = 50 } = {}) => {
  const activity = await Activity.findById(activityId).lean();
  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  const skip = (page - 1) * limit;
  const [attendance, total] = await Promise.all([
    Attendance.find({ activityId: new mongoose.Types.ObjectId(activityId) })
      .populate('memberId', 'studentId fullName email department academicYear')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments({ activityId: new mongoose.Types.ObjectId(activityId) }),
  ]);

  return {
    activity,
    attendance,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
