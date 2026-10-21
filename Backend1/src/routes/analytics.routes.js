// src/routes/analytics.routes.js
import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', analyticsController.getOverview);
router.get('/members', analyticsController.getTopMembers);
router.get('/activities', analyticsController.getActivityParticipation);
router.get('/participation', analyticsController.getMonthlyTrends);
router.get('/departments', analyticsController.getDepartmentStats);
router.get('/distribution', analyticsController.getHoursDistribution);

export default router;
