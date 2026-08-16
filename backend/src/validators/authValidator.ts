import { z } from 'zod';

export const loginSchema = z.object({
  associateId: z.string().min(1, 'Associate ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});
