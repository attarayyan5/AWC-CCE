// src/routes/report.routes.js
import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate, requireMember } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireMember);

router.get('/members', reportController.getMemberReport);
router.get('/activities', reportController.getActivityReport);
router.get('/export', reportController.exportReport);

export default router;
