// src/models/Activity.js
// CCA Activity model

import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    activityCode: {
      type: String,
      required: [true, 'Activity code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: {
        values: ['WORKSHOP', 'SEMINAR', 'LAB', 'HACKATHON', 'QUIZ', 'WEBINAR', 'OTHER'],
        message: 'Invalid activity category',
      },
      required: [true, 'Category is required'],
    },
    activityDate: {
      type: Date,
      required: [true, 'Activity date is required'],
      index: true,
    },
    startTime: {
      type: String, // HH:MM format
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    ccaHours: {
      type: Number,
      required: [true, 'CCA hours are required'],
      min: [0, 'CCA hours cannot be negative'],
      max: [24, 'CCA hours cannot exceed 24'],
      validate: {
        validator: (v) => Number.isFinite(v) && v >= 0,
        message: 'CCA hours must be a valid non-negative number',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'UPCOMING', 'COMPLETED', 'CANCELLED'],
        message: 'Invalid activity status',
      },
      default: 'UPCOMING',
      index: true,
    },
    bannerDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ title: 'text', description: 'text' });
activitySchema.index({ activityDate: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
