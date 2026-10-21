// src/models/Document.js
// Document/file metadata model for ImageKit-stored files

import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storageFilename: {
      type: String,
      required: true,
    },
    imageKitFileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: {
        values: ['BANNER', 'MATERIAL', 'CERTIFICATE', 'PROFILE_IMAGE', 'ANNOUNCEMENT', 'OTHER'],
        message: 'Invalid document category',
      },
      default: 'OTHER',
      index: true,
    },
    visibility: {
      type: String,
      enum: {
        values: ['ADMIN_ONLY', 'CLUB_MEMBERS', 'PUBLIC'],
        message: 'Invalid visibility setting',
      },
      default: 'CLUB_MEMBERS',
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional associations
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
