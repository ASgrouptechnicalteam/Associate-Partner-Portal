import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

const safeUserSelect = {
  id: true,
  associateId: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  profileImageUrl: true,
  secondaryPhone: true,
  whatsappNumber: true,
  currentAddress: true,
  permanentAddress: true,
  bloodGroup: true,
  socialMedia: true,
  panNumber: true,
  aadhaarNumber: true,
  bankName: true,
  accountNumber: true,
  ifscCode: true,
  branchName: true,
  emergencyContactName: true,
  emergencyContactRelation: true,
  emergencyContactPhone: true,
  jobTitle: true,
  department: true,
  workLocation: true,
  dateOfJoining: true,
  commissionPercentage: true,
  role: {
    select: {
      name: true,
    }
  }
};

async function generateAssociateId(roleName: string): Promise<string> {
  let prefix = 'ASSOC-RS';
  if (roleName === 'ASSOCIATE_MANAGER') {
    prefix = 'ASSOC-MN';
  } else if (roleName === 'MD') {
    prefix = 'ASSOC-MD';
  }

  let id = '';
  let isUnique = false;
  while (!isUnique) {
    const num = crypto.randomInt(1000, 10000).toString();
    id = `${prefix}-${num}`;
    const exists = await prisma.user.findUnique({ where: { associateId: id } });
    if (!exists) isUnique = true;
  }
  return id;
}

function generateTemporaryPassword(): string {
  // Generate a random string of length 10
  return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8) + 'X1!';
}

export const userService = {
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { associateId: { contains: params.search } },
        { phone: { contains: params.search } },
      ];
    }

    if (params.role) {
      where.role = {
        name: params.role,
      };
    }

    if (params.status) {
      where.status = params.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      role: user.role.name
    }));

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    
    if (!user) return null;

    return {
      ...user,
      role: user.role.name
    };
  },

  async createUser(data: any, authenticatedUserId: string, authenticatedUserRole: string) {
    const roleRecord = await prisma.role.findUnique({
      where: { name: 'ASSOCIATE' } // Force role to be ASSOCIATE always for newly created
    });

    if (!roleRecord) {
      throw new Error('ASSOCIATE Role not found');
    }

    const associateId = await generateAssociateId(roleRecord.name);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await prisma.user.create({
      data: {
        associateId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        roleId: roleRecord.id,
        status: authenticatedUserRole === 'MD' ? 'ACTIVE' : 'PENDING_APPROVAL',
        mustChangePassword: true,
        createdBy: authenticatedUserId,

        secondaryPhone: data.secondaryPhone,
        whatsappNumber: data.whatsappNumber,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        bloodGroup: data.bloodGroup,
        socialMedia: data.socialMedia,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branchName: data.branchName,
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelation: data.emergencyContactRelation,
        emergencyContactPhone: data.emergencyContactPhone,
        jobTitle: data.jobTitle,
        department: data.department,
        workLocation: data.workLocation,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
        commissionPercentage: data.commissionPercentage,
      },
      select: safeUserSelect,
    });

    return {
      user: {
        ...user,
        role: user.role.name
      },
      temporaryPassword // Return it so controller can output it once
    };
  },

  async updateUser(id: string, data: any) {
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profileImageUrl: data.profileImageUrl,
      secondaryPhone: data.secondaryPhone,
      whatsappNumber: data.whatsappNumber,
      currentAddress: data.currentAddress,
      permanentAddress: data.permanentAddress,
      bloodGroup: data.bloodGroup,
      socialMedia: data.socialMedia,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      branchName: data.branchName,
      emergencyContactName: data.emergencyContactName,
      emergencyContactRelation: data.emergencyContactRelation,
      emergencyContactPhone: data.emergencyContactPhone,
      jobTitle: data.jobTitle,
      department: data.department,
      workLocation: data.workLocation,
      commissionPercentage: data.commissionPercentage,
    };
    
    if (data.dateOfJoining) {
      updateData.dateOfJoining = new Date(data.dateOfJoining);
    }

    // Role updating is strictly guarded elsewhere, but here we just process what comes in if allowed
    let oldRoleName = null;
    let newRoleName = null;
    if (data.role) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: data.role }
      });
      if (!roleRecord) throw new Error('Role not found');
      updateData.roleId = roleRecord.id;
      newRoleName = roleRecord.name;

      const oldUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
      if (oldUser) {
        oldRoleName = oldUser.role.name;
      }
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: safeUserSelect,
    });

    if (oldRoleName && newRoleName && oldRoleName !== newRoleName) {
      await NotificationService.createNotification({
        userId: id,
        category: 'System',
        title: 'Role Updated',
        message: `Your role has been updated from ${oldRoleName} to ${newRoleName}.`,
        entityType: 'User',
        entityId: id,
        eventKey: `ROLE_UPDATED_${id}_${new Date().getTime()}`
      });
    }

    return {
      ...user,
      role: user.role.name
    };
  },

  async updateStatus(id: string, status: string, authenticatedUserId: string) {
    if (id === authenticatedUserId && (status === 'DEACTIVATED' || status === 'SUSPENDED' || status === 'REJECTED')) {
      throw new Error('Cannot deactivate or reject your own account');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: safeUserSelect,
    });

    return {
      ...user,
      role: user.role.name
    };
  },

  async approveUser(id: string, status: string, rejectionReason: string | undefined, authenticatedUserId: string) {
    const updateData: any = {
      status,
      approvedBy: authenticatedUserId,
      approvedAt: new Date(),
    };

    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: safeUserSelect,
    });

    await NotificationService.createNotification({
      userId: id,
      category: 'System',
      title: `Account ${status}`,
      message: `Your account has been ${status.toLowerCase()}.${status === 'REJECTED' && rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      entityType: 'User',
      entityId: id,
      eventKey: `ACCOUNT_${status}_${id}`
    });

    return {
      ...user,
      role: user.role.name
    };
  },

  async resetPassword(id: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });
    return true;
  },

  async checkDuplicate(email?: string, associateId?: string, excludeId?: string) {
    const where: any = {
      OR: []
    };
    if (email) where.OR.push({ email });
    if (associateId) where.OR.push({ associateId });
    
    if (where.OR.length === 0) return false;
    
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.user.count({ where });
    return count > 0;
  }
};
