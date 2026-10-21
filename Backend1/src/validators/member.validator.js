// src/validators/member.validator.js
// Zod validation schemas for member endpoints

import { z } from 'zod';

export const createMemberSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  department: z
    .string({ required_error: 'Department is required' })
    .min(1, 'Department is required')
    .trim(),
  academicYear: z
    .string({ required_error: 'Academic year is required' })
    .min(1, 'Academic year is required')
    .trim(),
  division: z.string().trim().optional().default(''),
  phoneNumber: z.string().trim().optional().default(''),
  // Password for creating user account (optional)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number'
    )
    .optional(),
});

export const updateMemberSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),
  department: z.string().min(1).trim().optional(),
  academicYear: z.string().min(1).trim().optional(),
  division: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
}).strict(); // Prevent extra fields

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be ACTIVE or INACTIVE',
  }),
  reason: z.string().trim().optional(),
});

export const memberQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  division: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
  sortBy: z.enum(['fullName', 'studentId', 'email', 'createdAt', 'academicYear']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
