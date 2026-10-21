// src/validators/activity.validator.js
// Zod validation schemas for activity endpoints

import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z
    .string({ required_error: 'Activity title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z.string().trim().optional().default(''),
  category: z.enum(
    ['WORKSHOP', 'SEMINAR', 'LAB', 'HACKATHON', 'QUIZ', 'WEBINAR', 'OTHER'],
    { required_error: 'Category is required' }
  ),
  activityDate: z
    .string({ required_error: 'Activity date is required' })
    .datetime({ message: 'Invalid date format. Use ISO 8601.' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format')
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format')
    .optional(),
  location: z.string().trim().optional().default(''),
  ccaHours: z
    .number({ required_error: 'CCA hours are required' })
    .min(0, 'CCA hours cannot be negative')
    .max(24, 'CCA hours cannot exceed 24')
    .finite('CCA hours must be a finite number'),
  status: z
    .enum(['DRAFT', 'UPCOMING', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('UPCOMING'),
});

export const updateActivitySchema = createActivitySchema.partial().strict();

export const updateActivityStatusSchema = z.object({
  status: z.enum(['DRAFT', 'UPCOMING', 'COMPLETED', 'CANCELLED'], {
    required_error: 'Status is required',
  }),
  reason: z.string().trim().optional(),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  category: z
    .enum(['WORKSHOP', 'SEMINAR', 'LAB', 'HACKATHON', 'QUIZ', 'WEBINAR', 'OTHER', 'ALL'])
    .optional()
    .default('ALL'),
  status: z
    .enum(['DRAFT', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'ALL'])
    .optional()
    .default('ALL'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['activityDate', 'title', 'ccaHours', 'createdAt']).optional().default('activityDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
