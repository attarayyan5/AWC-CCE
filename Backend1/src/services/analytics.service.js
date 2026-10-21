// src/services/analytics.service.js
// MongoDB aggregation pipelines for admin analytics dashboard

import Member from '../models/Member.js';
import Activity from '../models/Activity.js';
import Attendance from '../models/Attendance.js';
import AttendanceImport from '../models/AttendanceImport.js';
import mongoose from 'mongoose';

/**
 * Overview statistics for admin dashboard
 */
export const getOverview = async ({ startDate = null, endDate = null } = {}) => {
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const [
    totalMembers,
    activeMembers,
    totalActivities,
    upcomingActivities,
    completedActivities,
    pendingImports,
    hoursAgg,
  ] = await Promise.all([
    Member.countDocuments({}),
    Member.countDocuments({ status: 'ACTIVE' }),
    Activity.countDocuments({}),
    Activity.countDocuments({ status: 'UPCOMING' }),
    Activity.countDocuments({ status: 'COMPLETED' }),
    AttendanceImport.countDocuments({ status: { $in: ['UPLOADED', 'PROCESSING', 'VALIDATED'] } }),
    // Total CCA hours across all PRESENT attendance
    Attendance.aggregate([
      { $match: { status: 'PRESENT' } },
      { $group: { _id: null, totalHours: { $sum: '$hoursAwarded' } } },
    ]),
  ]);

  const totalCcaHours = hoursAgg[0]?.totalHours || 0;
  const avgHoursPerMember = activeMembers > 0 ? Math.round((totalCcaHours / activeMembers) * 10) / 10 : 0;

  return {
    totalMembers,
    activeMembers,
    totalActivities,
    upcomingActivities,
    completedActivities,
    pendingImports,
    totalCcaHours,
    avgHoursPerMember,
  };
};

/**
 * Top members by CCA hours
 */
export const getTopMembersByHours = async ({ limit = 10, department = null, academicYear = null } = {}) => {
  const memberFilter = { status: 'ACTIVE' };
  if (department) memberFilter.department = department;
  if (academicYear) memberFilter.academicYear = academicYear;

  // Get qualifying member IDs
  const memberIds = await Member.find(memberFilter).distinct('_id');

  const results = await Attendance.aggregate([
    {
      $match: {
        status: 'PRESENT',
        memberId: { $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $group: {
        _id: '$memberId',
        totalHours: { $sum: '$hoursAwarded' },
        totalActivities: { $sum: 1 },
      },
    },
    { $sort: { totalHours: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'members',
        localField: '_id',
        foreignField: '_id',
        as: 'member',
      },
    },
    { $unwind: '$member' },
    {
      $project: {
        memberId: '$_id',
        totalHours: 1,
        totalActivities: 1,
        studentId: '$member.studentId',
        fullName: '$member.fullName',
        department: '$member.department',
        academicYear: '$member.academicYear',
      },
    },
  ]);

  return results;
};

/**
 * Activity participation stats (attendance count per activity)
 */
export const getActivityParticipation = async ({ limit = 10, status = null } = {}) => {
  const activityFilter = {};
  if (status) activityFilter.status = status;

  const activities = await Activity.find(activityFilter).distinct('_id');

  const results = await Attendance.aggregate([
    {
      $match: {
        status: 'PRESENT',
        activityId: { $in: activities.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $group: {
        _id: '$activityId',
        attendeeCount: { $sum: 1 },
        totalHoursAwarded: { $sum: '$hoursAwarded' },
      },
    },
    { $sort: { attendeeCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'activities',
        localField: '_id',
        foreignField: '_id',
        as: 'activity',
      },
    },
    { $unwind: '$activity' },
    {
      $project: {
        activityId: '$_id',
        attendeeCount: 1,
        totalHoursAwarded: 1,
        title: '$activity.title',
        activityCode: '$activity.activityCode',
        activityDate: '$activity.activityDate',
        category: '$activity.category',
        ccaHours: '$activity.ccaHours',
      },
    },
  ]);

  return results;
};

/**
 * Monthly attendance trends
 */
export const getMonthlyTrends = async ({ year = null } = {}) => {
  const targetYear = year || new Date().getFullYear();

  const results = await Attendance.aggregate([
    {
      $match: {
        status: 'PRESENT',
        recordedAt: {
          $gte: new Date(`${targetYear}-01-01`),
          $lte: new Date(`${targetYear}-12-31T23:59:59`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$recordedAt' } },
        attendanceCount: { $sum: 1 },
        totalHours: { $sum: '$hoursAwarded' },
        uniqueMembers: { $addToSet: '$memberId' },
      },
    },
    {
      $project: {
        month: '$_id.month',
        attendanceCount: 1,
        totalHours: 1,
        uniqueMemberCount: { $size: '$uniqueMembers' },
      },
    },
    { $sort: { month: 1 } },
  ]);

  // Fill in missing months with zeros
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const byMonth = {};
  results.forEach((r) => {
    byMonth[r.month] = r;
  });

  return monthNames.map((name, index) => ({
    month: name,
    monthNumber: index + 1,
    attendanceCount: byMonth[index + 1]?.attendanceCount || 0,
    totalHours: byMonth[index + 1]?.totalHours || 0,
    uniqueMemberCount: byMonth[index + 1]?.uniqueMemberCount || 0,
  }));
};

/**
 * Department-wise participation summary
 */
export const getDepartmentStats = async () => {
  const results = await Member.aggregate([
    {
      $lookup: {
        from: 'attendances',
        localField: '_id',
        foreignField: 'memberId',
        as: 'attendance',
      },
    },
    {
      $project: {
        department: 1,
        status: 1,
        totalHours: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$attendance',
                  as: 'a',
                  cond: { $eq: ['$$a.status', 'PRESENT'] },
                },
              },
              as: 'a',
              in: '$$a.hoursAwarded',
            },
          },
        },
        totalAttendance: {
          $size: {
            $filter: {
              input: '$attendance',
              as: 'a',
              cond: { $eq: ['$$a.status', 'PRESENT'] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: '$department',
        memberCount: { $sum: 1 },
        activeCount: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
        totalHours: { $sum: '$totalHours' },
        totalAttendance: { $sum: '$totalAttendance' },
      },
    },
    { $sort: { totalHours: -1 } },
    {
      $project: {
        department: '$_id',
        memberCount: 1,
        activeCount: 1,
        totalHours: 1,
        totalAttendance: 1,
        avgHoursPerMember: {
          $cond: [
            { $gt: ['$activeCount', 0] },
            { $round: [{ $divide: ['$totalHours', '$activeCount'] }, 1] },
            0,
          ],
        },
      },
    },
  ]);

  return results;
};

/**
 * CCA hours distribution (histogram buckets)
 */
export const getHoursDistribution = async () => {
  const results = await Attendance.aggregate([
    { $match: { status: 'PRESENT' } },
    {
      $group: {
        _id: '$memberId',
        totalHours: { $sum: '$hoursAwarded' },
      },
    },
    {
      $bucket: {
        groupBy: '$totalHours',
        boundaries: [0, 5, 10, 15, 20, 25, 30, 50, 100],
        default: '100+',
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  return results;
};
