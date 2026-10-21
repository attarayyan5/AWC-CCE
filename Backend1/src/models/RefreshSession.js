// src/models/RefreshSession.js
// Refresh token session model with rotation and revocation support

import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Store SHA-256 hash of refresh token, never the raw token
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Token family for reuse detection
    tokenFamilyId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for auto-cleanup
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    // For token family invalidation on reuse detection
    replacedBySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshSession',
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    // Device/client info for UX (optional, never expose sensitive data)
    userAgent: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

export default RefreshSession;
