import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Employee validation schemas
export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required').max(100, 'Name must be less than 100 characters'),
  specialNotes: z.string().optional(),
})

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required').max(100, 'Name must be less than 100 characters').optional(),
  specialNotes: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Work Record validation schemas
export const createWorkRecordSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().refine((val) => {
    // Accept both YYYY-MM-DD and full datetime formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return dateRegex.test(val) || datetimeRegex.test(val);
  }, 'Invalid date format. Use YYYY-MM-DD or ISO datetime'),
  kilograms: z.number().min(0, 'Kilograms must be positive').max(9999.999, 'Kilograms must be less than 10000'),
  notes: z.string().optional(),
})

export const updateWorkRecordSchema = z.object({
  date: z.string().refine((val) => {
    // Accept both YYYY-MM-DD and full datetime formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return dateRegex.test(val) || datetimeRegex.test(val);
  }, 'Invalid date format. Use YYYY-MM-DD or ISO datetime').optional(),
  kilograms: z.number().min(0, 'Kilograms must be positive').max(9999.999, 'Kilograms must be less than 10000').optional(),
  notes: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type CreateWorkRecordInput = z.infer<typeof createWorkRecordSchema>
export type UpdateWorkRecordInput = z.infer<typeof updateWorkRecordSchema>
