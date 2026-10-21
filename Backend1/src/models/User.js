// src/models/User.js
// User authentication model

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never returned in ordinary queries
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MEMBER'],
        message: 'Role must be ADMIN or MEMBER',
      },
      required: true,
      default: 'MEMBER',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Account status must be ACTIVE or INACTIVE',
      },
      default: 'ACTIVE',
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    // Password reset fields - not returned by default
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Never expose sensitive fields in JSON output
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

/**
 * Compare a plaintext password against the stored hash.
 * Must call this on a document fetched with +passwordHash selected.
 */
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

/**
 * Hash a password and set passwordHash field.
 */
userSchema.methods.setPassword = async function (plaintext) {
  this.passwordHash = await bcrypt.hash(plaintext, config.security.saltRounds);
  this.passwordChangedAt = new Date();
};

/**
 * Check if token was issued before last password change.
 */
userSchema.methods.passwordChangedAfter = function (tokenIssuedAt) {
  if (this.passwordChangedAt) {
    return tokenIssuedAt < this.passwordChangedAt.getTime() / 1000;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;
