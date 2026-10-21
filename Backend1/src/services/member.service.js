// src/services/member.service.js
// Member management business logic

import Member from '../models/Member.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Activity from '../models/Activity.js';
import { generateStudentId } from '../utils/studentId.js';
import AppError from '../utils/AppError.js';
import { createAuditLog } from './auditLog.service.js';
import { config } from '../config/index.js';
import mongoose from 'mongoose';

/**
 * Create a new member with auto-generated student ID and optional user account
 */
export const createMember = async (memberData, actorUserId, { ipAddress = '' } = {}) => {
  const { fullName, email, department, academicYear, division, phoneNumber, password } = memberData;

  // Check for existing email
  const existingMember = await Member.findOne({ email });
  if (existingMember) {
    throw new AppError('A member with this email already exists', 409);
  }

  // Generate unique student ID atomically
  const studentId = await generateStudentId();

  // Create member record
  const member = await Member.create({
    studentId,
    fullName,
    email,
    department,
    academicYear,
    division: division || '',
    phoneNumber: phoneNumber || '',
    status: 'ACTIVE',
    joinedAt: new Date(),
  });

  // If password provided, create user account and link
  let user = null;
  if (password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('A user account with this email already exists', 409);
    }

    user = new User({
      email,
      role: 'MEMBER',
      accountStatus: 'ACTIVE',
      memberId: member._id,
    });
    await user.setPassword(password);
    await user.save();

    // Link user to member
    await Member.findByIdAndUpdate(member._id, { userId: user._id });
  }

  await createAuditLog({
    actorUserId,
    action: 'MEMBER_CREATED',
    entityType: 'Member',
    entityId: member._id,
    details: { studentId, email, fullName, department },
    ipAddress,
  });

  return member;
};

/**
 * Get paginated list of members with search and filtering
 */
export const getMembers = async ({
  page = 1,
  limit = 20,
  search = '',
  department = '',
  academicYear = '',
  division = '',
  status = 'ALL',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) => {
  const filter = {};

  // Status filter
  if (status !== 'ALL') {
    filter.status = status;
  }

  // Exact filters
  if (department) filter.department = department;
  if (academicYear) filter.academicYear = academicYear;
  if (division) filter.division = division;

  // Search by name, email, or student ID
  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { studentId: searchRegex },
    ];
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection };
  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    Member.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Member.countDocuments(filter),
  ]);

  return {
    members,
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
 * Get a single member by ID (ObjectId or studentId)
 */
export const getMemberById = async (id, requestingUser) => {
  let member;

  // Try by ObjectId first, then by studentId
  if (mongoose.Types.ObjectId.isValid(id)) {
    member = await Member.findById(id).lean();
  }

  if (!member) {
    member = await Member.findOne({ studentId: id.toUpperCase() }).lean();
  }

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Resource-level authorization: members can only see their own profile
  if (requestingUser.role === 'MEMBER') {
    if (!requestingUser.memberId || requestingUser.memberId !== member._id.toString()) {
      throw new AppError('Access denied. You can only view your own profile.', 403);
    }
  }

  return member;
};

/**
 * Update member information (allowlisted fields only)
 */
export const updateMember = async (id, updateData, actorUserId, { ipAddress = '' } = {}) => {
  // Allowlist: only these fields can be updated
  const allowedFields = ['fullName', 'department', 'academicYear', 'division', 'phoneNumber'];
  const safeUpdate = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      safeUpdate[field] = updateData[field];
    }
  }

  if (Object.keys(safeUpdate).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  let member;
  if (mongoose.Types.ObjectId.isValid(id)) {
    member = await Member.findByIdAndUpdate(id, safeUpdate, { new: true, runValidators: true });
  }

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  await createAuditLog({
    actorUserId,
    action: 'MEMBER_UPDATED',
    entityType: 'Member',
    entityId: member._id,
    details: { updatedFields: Object.keys(safeUpdate) },
    ipAddress,
  });

  return member;
};

/**
 * Update member status (activate/deactivate)
 * Prefers soft deactivation over deletion
 */
export const updateMemberStatus = async (id, status, actorUserId, { reason = '', ipAddress = '' } = {}) => {
  const member = await Member.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Also update linked user account status
  if (member.userId) {
    await User.findByIdAndUpdate(member.userId, {
      accountStatus: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    });
  }

  await createAuditLog({
    actorUserId,
    action: 'MEMBER_STATUS_CHANGED',
    entityType: 'Member',
    entityId: member._id,
    details: { studentId: member.studentId, newStatus: status, reason },
    ipAddress,
  });

  return member;
};

/**
 * Get member CCA hours report (aggregated from attendance)
 */
export const getMemberReport = async (memberId, requestingUser) => {
  // Validate requesting user has access
  if (requestingUser.role === 'MEMBER') {
    if (!requestingUser.memberId || requestingUser.memberId !== memberId.toString()) {
      throw new AppError('Access denied. You can only view your own report.', 403);
    }
  }

  const member = await Member.findById(memberId).lean();
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Aggregate total hours from confirmed attendance
  const hoursAgg = await Attendance.aggregate([
    {
      $match: {
        memberId: new mongoose.Types.ObjectId(memberId),
        status: 'PRESENT',
      },
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$hoursAwarded' },
        totalActivities: { $sum: 1 },
      },
    },
  ]);

  const totals = hoursAgg[0] || { totalHours: 0, totalActivities: 0 };

  // Get attendance history with activity details
  const attendanceHistory = await Attendance.find({
    memberId: new mongoose.Types.ObjectId(memberId),
  })
    .populate('activityId', 'title activityCode activityDate category ccaHours status')
    .sort({ createdAt: -1 })
    .lean();

  return {
    member,
    totalHours: totals.totalHours,
    totalActivities: totals.totalActivities,
    attendanceHistory,
  };
};

/**
 * Get distinct departments for filter dropdowns
 */
export const getDistinctDepartments = async () => {
  return Member.distinct('department');
};

/**
 * Get distinct academic years for filter dropdowns
 */
export const getDistinctAcademicYears = async () => {
  return Member.distinct('academicYear');
};
