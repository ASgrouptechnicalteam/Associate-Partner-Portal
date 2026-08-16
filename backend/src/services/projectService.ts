import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectService {
  static async createProject(data: any, createdBy: string) {
    return prisma.project.create({
      data: {
        ...data,
        createdBy,
        status: 'DRAFT',
        verificationStatus: 'UNVERIFIED'
      }
    });
  }

  static async updateProject(projectId: string, data: any) {
    return prisma.project.update({
      where: { id: projectId },
      data
    });
  }

  static async submitProject(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'DRAFT' && project.status !== 'REJECTED') {
      throw new Error('Only DRAFT or REJECTED projects can be submitted');
    }
    
    return prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PENDING_APPROVAL'
      }
    });
  }

  static async approveProject(projectId: string, approvedBy: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'PENDING_APPROVAL') {
      throw new Error('Only PENDING_APPROVAL projects can be approved');
    }

    return prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: null
      }
    });
  }

  static async rejectProject(projectId: string, rejectionReason: string, rejectedBy: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'PENDING_APPROVAL') {
      throw new Error('Only PENDING_APPROVAL projects can be rejected');
    }

    return prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        rejectionReason,
        // Optional: you can store rejectedBy in approvedBy or a separate field, but for now we only have approvedBy in schema.
      }
    });
  }

  static async archiveProject(projectId: string) {
    return prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ARCHIVED'
      }
    });
  }

  static async getProjectsForAssociates() {
    return prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED'
      },
      include: { media: true, inventory: true }
    });
  }

  static async getAllProjectsForManagement() {
    return prisma.project.findMany({
      include: { media: true, inventory: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getProjectById(projectId: string, isManager: boolean) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { media: true, inventory: true }
    });

    if (!project) return null;

    if (!isManager) {
      if (project.status !== 'ACTIVE' || project.verificationStatus !== 'VERIFIED') {
        return null; // IDOR Protection
      }
    }
    return project;
  }
}
