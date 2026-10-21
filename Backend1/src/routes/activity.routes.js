// src/routes/activity.routes.js
import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate, requireAdmin, requireMember } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createActivitySchema, updateActivitySchema, updateActivityStatusSchema, activityQuerySchema } from '../validators/activity.validator.js';

const router = Router();

router.use(authenticate);

// All authenticated users can list and view activities
router.get('/', requireMember, validate(activityQuerySchema, 'query'), activityController.getActivities);
router.get('/:id', requireMember, activityController.getActivityById);
router.get('/:id/attendance', requireAdmin, activityController.getActivityAttendance);

// Admin-only
router.post('/', requireAdmin, validate(createActivitySchema), activityController.createActivity);
router.patch('/:id', requireAdmin, validate(updateActivitySchema), activityController.updateActivity);
router.patch('/:id/status', requireAdmin, validate(updateActivityStatusSchema), activityController.updateActivityStatus);

export default router;
