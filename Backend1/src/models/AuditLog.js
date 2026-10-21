// src/models/AuditLog.js
// Administrative audit trail model

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system actions
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Member actions
        'MEMBER_CREATED',
        'MEMBER_UPDATED',
        'MEMBER_STATUS_CHANGED',
        'MEMBER_DELETED',
        // Activity actions
        'ACTIVITY_CREATED',
        'ACTIVITY_UPDATED',
        'ACTIVITY_STATUS_CHANGED',
        'ACTIVITY_CCA_HOURS_CHANGED',
        // Attendance actions
        'ATTENDANCE_IMPORT_UPLOADED',
        'ATTENDANCE_IMPORT_VALIDATED',
        'ATTENDANCE_IMPORT_CONFIRMED',
        'ATTENDANCE_IMPORT_CANCELLED',
        'ATTENDANCE_CORRECTED',
        // Document actions
        'DOCUMENT_UPLOADED',
        'DOCUMENT_DELETED',
        'DOCUMENT_VISIBILITY_CHANGED',
        // Auth actions
        'USER_CREATED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_LOGOUT_ALL',
        'USER_PASSWORD_CHANGED',
        'USER_PASSWORD_RESET',
        'USER_ROLE_CHANGED',
        'SESSION_REVOKED',
        // Report actions
        'REPORT_EXPORTED',
      ],
      index: true,
    },
    entityType: {
      type: String,
      enum: ['User', 'Member', 'Activity', 'Attendance', 'AttendanceImport', 'Document', 'RefreshSession', null],
      default: null,
    },
    entityId: {
      type: String, // String to support both ObjectId and custom IDs
      default: null,
    },
    // Safe details object - never include passwords, tokens, or hashes
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Request context
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
