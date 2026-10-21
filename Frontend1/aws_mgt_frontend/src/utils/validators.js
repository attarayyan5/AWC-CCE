import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const memberSchema = z.object({
  fullName: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  department: z.string().min(1, 'Department is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  division: z.string().optional().default(''),
  phoneNumber: z.string().optional().default(''),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number').optional().or(z.literal('')),
});

export const activitySchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  activityDate: z.string().min(1, 'Date is required'),
  startTime: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
  location: z.string().optional().default(''),
  ccaHours: z.coerce.number().min(0, 'Must be ≥ 0').max(24, 'Max 24 hours'),
  status: z.string().optional().default('UPCOMING'),
});
