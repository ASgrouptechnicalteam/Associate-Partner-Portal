import { z } from 'zod';

const profileFields = {
  // 1. Personal
  secondaryPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  bloodGroup: z.string().optional(),
  socialMedia: z.any().optional(),

  // 2. Identification
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),

  // 3. Banking
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  branchName: z.string().optional(),

  // 4. Emergency
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  // 5. Official
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  workLocation: z.string().optional(),
  dateOfJoining: z.string().optional(), // Using string for date parsing
  commissionPercentage: z.number().optional(),
  designation: z.string().optional(),
  teamId: z.string().optional(),
};

const hierarchyFields = {
  referralUserId: z.string().nullable().optional(),
};

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  ...profileFields,
  ...hierarchyFields,
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
  role: z.enum(['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE']).optional(),
  ...profileFields,
  ...hierarchyFields,
  headedTeamId: z.string().nullable().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DEACTIVATED']),
});

export const approveUserSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
