// src/routes/document.routes.js
import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import { authenticate, requireAdmin, requireMember } from '../middleware/auth.js';
import { documentUpload, handleMulterError } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', requireMember, documentController.getDocuments);
router.get('/:id', requireMember, documentController.getDocumentById);
router.post('/', requireAdmin, uploadLimiter, handleMulterError(documentUpload), documentController.uploadDocument);
router.delete('/:id', requireAdmin, documentController.deleteDocument);

export default router;
