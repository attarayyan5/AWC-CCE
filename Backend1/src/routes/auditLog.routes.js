// src/routes/auditLog.routes.js
import { Router } from 'express';
import { getLogs } from '../controllers/auditLog.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', getLogs);

export default router;
