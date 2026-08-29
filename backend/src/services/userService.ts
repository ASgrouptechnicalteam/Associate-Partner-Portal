import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';
import { NotificationService } from './notificationService';
import { HierarchyService } from './hierarchyService';

const prisma = new PrismaClient();

const safeUserSelect = {
  id: true,
  userIdentifier: true,
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
  designation: true,
  teamId: true,
  parentId: true,
  parent: { select: { id: true, userIdentifier: true, name: true, profileImageUrl: true } },
  role: {
    select: {
      name: true,
    }
  }
};

async function generateUserId(): Promise<string> {
  const prefix = 'RS';
  
  // Find all current RS users
  const users = await prisma.user.findMany({
    where: { userIdentifier: { startsWith: 'RS-' } },
    select: { userIdentifier: true }
  });

  let maxNum = 0;
  for (const user of users) {
    if (user.userIdentifier) {
      const parts = user.userIdentifier.split('-');
      if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
        const num = parseInt(parts[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum === 0 ? 1 : maxNum + 1;
  // Pad to a minimum of 4 digits
  const paddedNum = nextNum.toString().padStart(4, '0');
  
  return `${prefix}-${paddedNum}`;
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
    authenticatedUserId: string;
    authenticatedUserRole: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.authenticatedUserRole !== 'MD' && params.authenticatedUserRole !== 'CHANNEL_PARTNER_MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: params.authenticatedUserId } });
      const descendants = await HierarchyService.getAllDescendants(params.authenticatedUserId);
      const allowedIds = descendants.map(d => d.id);
      
      allowedIds.push(params.authenticatedUserId); // User can see themselves
      if (currentUser?.parentId) {
        allowedIds.push(currentUser.parentId); // Immediate superior
      }
      
      if (currentUser?.teamId) {
        // Find everyone in the same main team
        const teamMembers = await prisma.user.findMany({ where: { teamId: currentUser.teamId }, select: { id: true } });
        teamMembers.forEach(m => allowedIds.push(m.id));
      }
      
      where.id = { in: Array.from(new Set(allowedIds)) };
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { userIdentifier: { contains: params.search } },
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
        select: {
          ...safeUserSelect,
          team: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Attach hierarchy stats for each user
    const formattedUsers = await Promise.all(users.map(async (user) => {
      const stats = await HierarchyService.getHierarchyStats(user.id);
      return {
        ...user,
        role: user.role.name,
        directMembersCount: stats.directMembersCount,
        totalDescendantsCount: stats.totalDescendantsCount,
      };
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

  async getUserById(id: string, authenticatedUserId?: string, authenticatedUserRole?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        team: { select: { id: true, name: true } }
      },
    });
    
    if (!user) return null;

    if (authenticatedUserId && authenticatedUserRole && authenticatedUserRole !== 'MD') {
      if (id !== authenticatedUserId) {
        const downline = await HierarchyService.getAllDescendants(authenticatedUserId);
        const allowedIds = downline.map(d => d.id);
        
        // Also allow viewing immediate parent
        const currentUser = await prisma.user.findUnique({ where: { id: authenticatedUserId } });
        if (currentUser?.parentId) allowedIds.push(currentUser.parentId);
        
        // Also allow viewing team members
        if (currentUser?.teamId) {
          const teamMembers = await prisma.user.findMany({ where: { teamId: currentUser.teamId }, select: { id: true } });
          teamMembers.forEach(m => allowedIds.push(m.id));
        }

        if (!allowedIds.includes(id)) {
          throw new Error('Forbidden: You do not have permission to view this user.');
        }
      }
    }
    
    const stats = await HierarchyService.getHierarchyStats(user.id);

    return {
      ...user,
      role: user.role.name,
      directMembersCount: stats.directMembersCount,
      totalDescendantsCount: stats.totalDescendantsCount,
    };
  },

  async createUser(data: any, authenticatedUserId: string, authenticatedUserRole: string) {
    const roleRecord = await prisma.role.findUnique({
      where: { name: 'ASSOCIATE' }
    });

    if (!roleRecord) throw new Error('ASSOCIATE Role not found');

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    let parentId = null;
    let teamId = null;

    if (data.referralUserId) {
      const parentUser = await prisma.user.findUnique({ where: { userIdentifier: data.referralUserId } });
      if (!parentUser) throw new Error('Referral User ID not found');
      parentId = parentUser.id;
      teamId = parentUser.teamId;
    } else if (data.teamId) {
      teamId = data.teamId;
    }

    const designationToCommission: Record<string, number> = {
      'Marketing Manager': 10,
      'Senior Marketing Manager': 12,
      'Assistant General Manager': 14,
      'Senior Assistant General Manager': 16,
      'Deputy General Manager': 18,
      'Senior Deputy General Manager': 20,
      'General Manager': 22,
      'Senior General Manager': 24,
      'Chief General Manager': 26,
      'Senior Chief General Manager': 28,
      'Marketing Director': 30
    };

    let commissionPercentage = data.commissionPercentage;
    if (data.designation && designationToCommission[data.designation]) {
      commissionPercentage = designationToCommission[data.designation];
    }

    let user;
    let attempts = 0;
    const MAX_RETRIES = 5;

    while (attempts < MAX_RETRIES) {
      try {
        const userIdentifier = await generateUserId();

        user = await prisma.user.create({
          data: {
            userIdentifier,
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
            teamId,
            parentId,
            designation: data.designation,
            commissionPercentage,
            dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
          },
          include: {
            role: true,
            parent: { select: { userIdentifier: true } },
          }
        });
        
        break;
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('userIdentifier')) {
          attempts++;
          if (attempts >= MAX_RETRIES) {
            throw new Error('Failed to generate a unique User ID after maximum retries due to concurrency.');
          }
          continue;
        }
        throw error;
      }
    }

    if (!user) {
      throw new Error('Failed to create user unexpectedly.');
    }

    return {
      user: {
        ...user,
        role: user.role.name
      },
      temporaryPassword
    };
  },

  async updateUser(id: string, data: any, authenticatedUserId?: string, authenticatedUserRole?: string) {
    if (authenticatedUserId && authenticatedUserRole === 'CHANNEL_PARTNER_MANAGER' && authenticatedUserId !== id) {
      const downline = await HierarchyService.getAllDescendants(authenticatedUserId);
      const allowedIds = downline.map(d => d.id);
      if (!allowedIds.includes(id)) {
        throw new Error('Forbidden: Cannot update users outside permitted hierarchy.');
      }
    }

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
      designation: data.designation,
      teamId: data.teamId,
    };
    
    const designationToCommission: Record<string, number> = {
      'Marketing Manager': 10,
      'Senior Marketing Manager': 12,
      'Assistant General Manager': 14,
      'Senior Assistant General Manager': 16,
      'Deputy General Manager': 18,
      'Senior Deputy General Manager': 20,
      'General Manager': 22,
      'Senior General Manager': 24,
      'Chief General Manager': 26,
      'Senior Chief General Manager': 28,
      'Marketing Director': 30
    };

    const targetDesignation = data.designation !== undefined ? data.designation : (await prisma.user.findUnique({where: {id}}))?.designation;
    if (targetDesignation && designationToCommission[targetDesignation]) {
      updateData.commissionPercentage = designationToCommission[targetDesignation];
    }
    
    if (data.dateOfJoining) {
      updateData.dateOfJoining = new Date(data.dateOfJoining);
    }

    if (data.referralUserId !== undefined) {
      if (data.referralUserId === null) {
        updateData.parentId = null;
      } else {
        const parentUser = await prisma.user.findUnique({ where: { userIdentifier: data.referralUserId } });
        if (!parentUser) throw new Error('Referral User ID not found');
        if (parentUser.id === id) throw new Error('Cannot assign self as referral');
        
        // Target parent must be in CPM's downline or CPM themselves
        if (authenticatedUserId && authenticatedUserRole === 'CHANNEL_PARTNER_MANAGER' && parentUser.id !== authenticatedUserId) {
            const downline = await HierarchyService.getAllDescendants(authenticatedUserId);
            if (!downline.map(d => d.id).includes(parentUser.id)) {
                throw new Error('Forbidden: Cannot assign parent outside your hierarchy');
            }
        }

        // Cycle Prevention
        const descendants = await HierarchyService.getAllDescendants(id);
        if (descendants.some(d => d.id === parentUser.id)) {
          throw new Error('Hierarchy cycle detected: Cannot assign a descendant as a referral.');
        }

        updateData.parentId = parentUser.id;
        updateData.teamId = parentUser.teamId; // STRICTLY INHERIT TEAM FROM REFERRAL
      }
    }

    let oldRoleName = null;
    let newRoleName = null;
    if (data.role) {
      if (authenticatedUserRole !== 'MD' && (data.role === 'MD' || data.role === 'CHANNEL_PARTNER_MANAGER')) {
        throw new Error('Forbidden: Only MD can assign MD or CHANNEL_PARTNER_MANAGER roles.');
      }
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

    // Handle Team Head Assignment
    if (data.designation === 'Marketing Director' && data.headedTeamId !== undefined && (authenticatedUserRole === 'MD' || authenticatedUserRole === 'CHANNEL_PARTNER_MANAGER')) {
       if (data.headedTeamId === null) {
          // They are being removed from being a team head for the selected team
          await prisma.team.updateMany({
             where: { headUserId: id },
             data: { headUserId: null }
          });
       } else {
          // Clear any other team they might have been heading (a user heads only one main team usually)
          await prisma.team.updateMany({
             where: { headUserId: id },
             data: { headUserId: null }
          });
          
          await prisma.team.update({
             where: { id: data.headedTeamId },
             data: { headUserId: id }
          });
          
          // Special rule for team head: their parent is MD/root (null) and they belong to this team
          updateData.parentId = null;
          updateData.teamId = data.headedTeamId;
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
    if (id === authenticatedUserId && (status === 'DEACTIVATED' || status === 'SUSPENDED' || status === 'REJECTED' || status === 'DELETED')) {
      throw new Error('Cannot deactivate or reject your own account');
    }

    const targetUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!targetUser) throw new Error('User not found');
    
    if ((status === 'DEACTIVATED' || status === 'DELETED') && 
        (targetUser.role.name === 'MD' || targetUser.role.name === 'CHANNEL_PARTNER_MANAGER')) {
      throw new Error('Forbidden: Cannot deactivate or delete an MD or CPM account');
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

  async checkDuplicate(email?: string, userId?: string, excludeId?: string) {
    const where: any = {
      OR: []
    };
    if (email) where.OR.push({ email });
    if (userId) where.OR.push({ userId });
    
    if (where.OR.length === 0) return false;
    
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.user.count({ where });
    return count > 0;
  },

  async deleteUser(id: string, authenticatedUserId: string, authenticatedUserRole: string) {
    if (authenticatedUserRole !== 'MD' && authenticatedUserRole !== 'CHANNEL_PARTNER_MANAGER') {
      throw new Error('Forbidden: Only management roles can delete users');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        children: true,
        bookings: true,
        commissionTransactions: true,
        siteVisits: true,
        demoBookings: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role.name === 'MD' || user.role.name === 'CHANNEL_PARTNER_MANAGER') {
      throw new Error('Forbidden: Cannot delete an MD or CPM account');
    }

    // Dependency check 1: Active descendants
    if (user.children && user.children.length > 0) {
      throw new Error('Cannot delete user with active team descendants. Reassign them first.');
    }

    // Dependency check 2: Business History (Bookings, Commissions, Visits)
    const hasBusinessHistory = 
      (user.bookings && user.bookings.length > 0) ||
      (user.commissionTransactions && user.commissionTransactions.length > 0) ||
      (user.siteVisits && user.siteVisits.length > 0) ||
      (user.demoBookings && user.demoBookings.length > 0);

    if (hasBusinessHistory) {
      // Soft delete: update status to DELETED to preserve referential integrity
      const softDeletedUser = await prisma.user.update({
        where: { id },
        data: { status: 'DELETED', activeSessionId: null },
        select: safeUserSelect
      });
      return { type: 'soft', user: { ...softDeletedUser, role: softDeletedUser.role.name } };
    } else {
      // Hard delete: No critical dependencies
      // Clean up minor non-critical relations first if needed, though Cascade should handle or we manually delete them.
      // Notifications, ReviewRequests etc might block it, let's delete them first to be safe, or just rely on the DB.
      // Actually, Prisma schema doesn't have onDelete: Cascade for most relations.
      await prisma.notification.deleteMany({ where: { userId: id } });
      await prisma.teamRequest.deleteMany({ where: { OR: [{ requesterId: id }, { targetUserId: id }, { proposedParentId: id }] } });
      await prisma.commissionPolicy.deleteMany({ where: { userId: id } });
      
      await prisma.user.delete({
        where: { id }
      });
      return { type: 'hard' };
    }
  }
};
