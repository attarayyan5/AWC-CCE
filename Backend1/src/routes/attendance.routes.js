// src/routes/attendance.routes.js
import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, requireAdmin, requireMember } from '../middleware/auth.js';
import { attendanceUpload, handleMulterError } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

// Import pipeline - admin only
router.post('/imports', requireAdmin, uploadLimiter, handleMulterError(attendanceUpload), attendanceController.uploadImport);
router.get('/imports', requireAdmin, attendanceController.getImports);
router.get('/imports/:id', requireAdmin, attendanceController.getImportById);
router.post('/imports/:id/validate', requireAdmin, attendanceController.validateImport);
router.post('/imports/:id/confirm', requireAdmin, attendanceController.confirmImport);
router.post('/imports/:id/cancel', requireAdmin, attendanceController.cancelImport);

// Attendance records - members see only own, admins see all
router.get('/', requireMember, attendanceController.getAttendance);
router.post('/', requireAdmin, attendanceController.recordManualAttendance);
router.patch('/:id', requireAdmin, attendanceController.correctAttendance);
router.delete('/:id', requireAdmin, attendanceController.deleteAttendance);

export default router;
