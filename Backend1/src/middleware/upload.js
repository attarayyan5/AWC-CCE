// src/middleware/upload.js
// Multer configuration for file uploads

import multer from 'multer';
import AppError from '../utils/AppError.js';

const ALLOWED_ATTENDANCE_MIMETYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/plain', // some CSV uploads come as text/plain
];

const ALLOWED_DOCUMENT_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_ATTENDANCE_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.xlsx', '.xls', '.ppt', '.pptx', '.doc', '.docx'];

// Memory storage - files not saved to disk
const memoryStorage = multer.memoryStorage();

const attendanceMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();

    if (!ALLOWED_ATTENDANCE_EXTENSIONS.includes(ext)) {
      return cb(
        new AppError(`Invalid file type. Allowed: ${ALLOWED_ATTENDANCE_EXTENSIONS.join(', ')}`, 400),
        false
      );
    }

    cb(null, true);
  },
}).fields([
  { name: 'attendanceFile', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

/**
 * Attendance file upload (Excel/CSV) - accepts either 'attendanceFile' or 'file'
 */
export const attendanceUpload = (req, res, next) => {
  attendanceMulter(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['attendanceFile']?.[0] || req.files['file']?.[0];
    }
    next();
  });
};

/**
 * Document/image upload for ImageKit
 */
export const documentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      return cb(
        new AppError(`Invalid file type. Allowed: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`, 400),
        false
      );
    }

    cb(null, true);
  },
}).single('file');

/**
 * Multer error handling wrapper
 */
export const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size allowed is 10MB for attendance files.', 400));
        }
        return next(new AppError(`File upload error: ${err.message}`, 400));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
};
