// src/controllers/document.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as documentService from '../services/document.service.js';
import AppError from '../utils/AppError.js';

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const { category = 'OTHER', visibility = 'CLUB_MEMBERS', title = '', description = '', activityId, memberId } = req.body;

  const doc = await documentService.uploadDocument(
    req.file,
    { category, visibility, title, description, activityId, memberId },
    req.user.id,
    { ipAddress: req.ip }
  );

  sendSuccess(res, { statusCode: 201, message: 'Document uploaded', data: { document: doc } });
});

export const getDocuments = catchAsync(async (req, res) => {
  const result = await documentService.getDocuments({ requestingUser: req.user, ...req.query });
  sendSuccess(res, { data: { documents: result.documents }, pagination: result.pagination });
});

export const getDocumentById = catchAsync(async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id, req.user);
  sendSuccess(res, { data: { document: doc } });
});

export const deleteDocument = catchAsync(async (req, res) => {
  await documentService.deleteDocument(req.params.id, req.user.id, { ipAddress: req.ip });
  sendSuccess(res, { message: 'Document deleted' });
});
