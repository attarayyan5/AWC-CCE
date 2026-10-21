// src/models/AttendanceImportRow.js
// Per-row tracking for attendance imports

import mongoose from 'mongoose';

const attendanceImportRowSchema = new mongoose.Schema(
  {
    importId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceImport',
      required: true,
      index: true,
    },
    rowNumber: {
      type: Number,
      required: true,
    },
    // Minimized raw data - only store necessary fields, not full row
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    normalizedData: {
      studentId: String,
      email: String,
      fullName: String,
      timestamp: Date,
    },
    resolvedMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    validationStatus: {
      type: String,
      enum: {
        values: ['VALID', 'DUPLICATE', 'UNKNOWN_MEMBER', 'EMAIL_MISMATCH', 'INVALID', 'ALREADY_IMPORTED'],
        message: 'Invalid row validation status',
      },
      required: true,
      index: true,
    },
    errors: [
      {
        field: String,
        message: String,
      },
    ],
    // Reference to existing attendance record if duplicate
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
    },
    // Reference to created attendance record after confirmation
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

attendanceImportRowSchema.index({ importId: 1, rowNumber: 1 });
attendanceImportRowSchema.index({ importId: 1, validationStatus: 1 });

const AttendanceImportRow = mongoose.model('AttendanceImportRow', attendanceImportRowSchema);

export default AttendanceImportRow;
