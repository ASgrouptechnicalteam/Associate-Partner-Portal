import { PrismaClient, User } from '@prisma/client';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const loginUser = async (associateId: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { associateId },
    include: { role: true },
  });

  if (!user) {
    return { success: false, message: 'Invalid credentials', status: 401 };
  }

  if (user.status === 'PENDING_APPROVAL') {
    return { success: false, message: 'Account is pending approval from MD', status: 403 };
  }
  
  if (user.status !== 'ACTIVE') {
    return { success: false, message: `Account is ${user.status}`, status: 403 };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid credentials', status: 401 };
  }

  // Session ID generation for MD and MGR
  let sessionId = undefined;
  if (user.role.name === 'MD' || user.role.name === 'ASSOCIATE_MANAGER') {
    sessionId = crypto.randomBytes(16).toString('hex');
  }

  // Update last login and session ID
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      lastLoginAt: new Date(),
      activeSessionId: sessionId || user.activeSessionId 
    },
  });

  // Generate Token
  const token = generateToken({ 
    userId: user.id, 
    role: user.role.name, 
    sessionId 
  });

  // Safe user response
  const safeUser = {
    id: user.id,
    associateId: user.associateId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: new Date(),
    profileImageUrl: user.profileImageUrl,
    secondaryPhone: user.secondaryPhone,
    whatsappNumber: user.whatsappNumber,
    currentAddress: user.currentAddress,
    permanentAddress: user.permanentAddress,
    bloodGroup: user.bloodGroup,
    socialMedia: user.socialMedia,
    panNumber: user.panNumber,
    aadhaarNumber: user.aadhaarNumber,
    bankName: user.bankName,
    accountNumber: user.accountNumber,
    ifscCode: user.ifscCode,
    branchName: user.branchName,
    emergencyContactName: user.emergencyContactName,
    emergencyContactRelation: user.emergencyContactRelation,
    emergencyContactPhone: user.emergencyContactPhone,
    jobTitle: user.jobTitle,
    department: user.department,
    workLocation: user.workLocation,
    dateOfJoining: user.dateOfJoining,
    commissionPercentage: user.commissionPercentage,
  };

  return { success: true, token, user: safeUser, status: 200 };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    return { success: false, message: 'User not found', status: 404 };
  }

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      associateId: user.associateId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      profileImageUrl: user.profileImageUrl,
      secondaryPhone: user.secondaryPhone,
      whatsappNumber: user.whatsappNumber,
      currentAddress: user.currentAddress,
      permanentAddress: user.permanentAddress,
      bloodGroup: user.bloodGroup,
      socialMedia: user.socialMedia,
      panNumber: user.panNumber,
      aadhaarNumber: user.aadhaarNumber,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      ifscCode: user.ifscCode,
      branchName: user.branchName,
      emergencyContactName: user.emergencyContactName,
      emergencyContactRelation: user.emergencyContactRelation,
      emergencyContactPhone: user.emergencyContactPhone,
      jobTitle: user.jobTitle,
      department: user.department,
      workLocation: user.workLocation,
      dateOfJoining: user.dateOfJoining,
      commissionPercentage: user.commissionPercentage,
    },
  };
};

export const changeInitialPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, message: 'User not found', status: 404 };
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid current password', status: 401 };
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { 
      passwordHash: hashedPassword,
      mustChangePassword: false 
    },
  });

  return { success: true, status: 200 };
};
