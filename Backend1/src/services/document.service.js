// src/services/document.service.js
// Document management with ImageKit integration

import imagekit from '../config/imagekit.js';
import Document from '../models/Document.js';
import AppError from '../utils/AppError.js';
import { createAuditLog } from './auditLog.service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Upload a document to ImageKit and store metadata in MongoDB
 */
export const uploadDocument = async (
  file,
  { category, visibility, title, description, activityId, memberId },
  actorUserId,
  { ipAddress = '' } = {}
) => {
  if (!imagekit) {
    throw new AppError('Document storage service is not configured.', 503);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const safeFilename = `${uuidv4()}${ext}`;
  const folder = `/aws-club/${category.toLowerCase()}`;

  // Upload to ImageKit
  let uploadResult;
  try {
    uploadResult = await imagekit.upload({
      file: file.buffer,
      fileName: safeFilename,
      folder,
      useUniqueFileName: false, // We generate our own UUID
      tags: [category, visibility],
    });
  } catch (err) {
    throw new AppError(`File upload failed: ${err.message}`, 500);
  }

  // Store metadata in MongoDB
  const document = await Document.create({
    originalFilename: file.originalname,
    storageFilename: safeFilename,
    imageKitFileId: uploadResult.fileId,
    fileUrl: uploadResult.url,
    mimeType: file.mimetype,
    fileSize: file.size,
    category: category || 'OTHER',
    visibility: visibility || 'CLUB_MEMBERS',
    title: title || file.originalname,
    description: description || '',
    activityId: activityId || null,
    memberId: memberId || null,
    uploadedBy: actorUserId,
  });

  await createAuditLog({
    actorUserId,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'Document',
    entityId: document._id,
    details: {
      originalFilename: file.originalname,
      category,
      visibility,
      fileSize: file.size,
    },
    ipAddress,
  });

  return document;
};

/**
 * Get documents with visibility-based access control
 */
export const getDocuments = async ({
  requestingUser,
  page = 1,
  limit = 20,
  category = null,
  activityId = null,
  memberId = null,
} = {}) => {
  const filter = {};

  // Apply visibility filter based on user role
  if (requestingUser.role === 'MEMBER') {
    filter.visibility = { $in: ['CLUB_MEMBERS', 'PUBLIC'] };
  }
  // Admins see all

  if (category) filter.category = category;
  if (activityId) filter.activityId = activityId;
  if (memberId) filter.memberId = memberId;

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);

  return {
    documents,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get a single document with access control
 */
export const getDocumentById = async (documentId, requestingUser) => {
  const document = await Document.findById(documentId)
    .populate('uploadedBy', 'email')
    .lean();

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Access control
  if (requestingUser.role === 'MEMBER' && document.visibility === 'ADMIN_ONLY') {
    throw new AppError('Access denied. This document is restricted to administrators.', 403);
  }

  return document;
};

/**
 * Delete a document from ImageKit and MongoDB
 */
export const deleteDocument = async (documentId, actorUserId, { ipAddress = '' } = {}) => {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Delete from ImageKit
  if (imagekit && document.imageKitFileId) {
    try {
      await imagekit.deleteFile(document.imageKitFileId);
    } catch (err) {
      // Log but don't fail - DB cleanup is more important
      console.error('Failed to delete from ImageKit:', err.message);
    }
  }

  await Document.findByIdAndDelete(documentId);

  await createAuditLog({
    actorUserId,
    action: 'DOCUMENT_DELETED',
    entityType: 'Document',
    entityId: documentId,
    details: {
      originalFilename: document.originalFilename,
      category: document.category,
    },
    ipAddress,
  });

  return { deleted: true };
};
