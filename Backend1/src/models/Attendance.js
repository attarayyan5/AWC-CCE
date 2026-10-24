// src/models/Attendance.js
// Individual attendance record model

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
      index: true,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['PRESENT', 'ABSENT', 'CORRECTED'],
        message: 'Invalid attendance status',
      },
      default: 'PRESENT',
    },
    hoursAwarded: {
      type: Number,
      min: [0, 'Hours awarded cannot be negative'],
      default: 0,
    },
    sourceImportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceImport',
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    // Correction tracking
    correctedAt: {
      type: Date,
      default: null,
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    correctionReason: {
      type: String,
      trim: true,
      default: null,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    previousHours: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one attendance record per member per activity
attendanceSchema.index({ memberId: 1, activityId: 1 }, { unique: true });
// Additional indexes for fast queries and pagination
attendanceSchema.index({ recordedAt: -1 });
attendanceSchema.index({ status: 1, recordedAt: -1 });
attendanceSchema.index({ memberId: 1, recordedAt: -1 });
attendanceSchema.index({ activityId: 1, recordedAt: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
