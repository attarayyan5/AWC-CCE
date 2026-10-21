// src/routes/member.routes.js
import { Router } from 'express';
import * as memberController from '../controllers/member.controller.js';
import { authenticate, requireAdmin, requireSelfOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMemberSchema, updateMemberSchema, updateMemberStatusSchema, memberQuerySchema } from '../validators/member.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/filters', memberController.getDistinctFilters);
router.get('/', requireAdmin, validate(memberQuerySchema, 'query'), memberController.getMembers);
router.post('/', requireAdmin, validate(createMemberSchema), memberController.createMember);
router.get('/:id', requireSelfOrAdmin, memberController.getMemberById);
router.patch('/:id', requireAdmin, validate(updateMemberSchema), memberController.updateMember);
router.patch('/:id/status', requireAdmin, validate(updateMemberStatusSchema), memberController.updateMemberStatus);
router.get('/:id/report', requireSelfOrAdmin, memberController.getMemberReport);

export default router;
