// src/models/AttendanceImport.js
// Tracks the state of each attendance file import

import mongoose from 'mongoose';

const attendanceImportSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileChecksum: {
      type: String, // SHA-256 of file content
      default: null,
    },
    // Row counts
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    unknownMemberRows: {
      type: Number,
      default: 0,
    },
    mismatchedEmailRows: {
      type: Number,
      default: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
    },
    committedRows: {
      type: Number,
      default: 0,
    },
    // Import state machine
    status: {
      type: String,
      enum: {
        values: ['UPLOADED', 'PROCESSING', 'VALIDATED', 'CONFIRMED', 'COMPLETED', 'FAILED', 'CANCELLED'],
        message: 'Invalid import status',
      },
      default: 'UPLOADED',
      index: true,
    },
    // Validation summary stored as JSON for flexible structure
    validationSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Column mapping applied during this import
    columnMapping: {
      studentId: { type: String },
      email: { type: String },
      fullName: { type: String },
      timestamp: { type: String },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup and sorted pagination
attendanceImportSchema.index({ createdAt: -1 });
attendanceImportSchema.index({ status: 1, createdAt: -1 });
attendanceImportSchema.index({ activityId: 1, createdAt: -1 });

const AttendanceImport = mongoose.model('AttendanceImport', attendanceImportSchema);

export default AttendanceImport;
