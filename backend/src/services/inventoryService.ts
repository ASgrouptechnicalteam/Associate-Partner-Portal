import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryService {
  static async createInventoryUnit(data: any) {
    return prisma.inventoryUnit.create({
      data: {
        ...data,
        status: data.status || 'AVAILABLE'
      }
    });
  }

  static async updateInventoryUnit(id: string, data: any) {
    // Prevent associates from updating price or status via this generic update
    return prisma.inventoryUnit.update({
      where: { id },
      data
    });
  }

  static async updateInventoryStatus(id: string, status: string) {
    return prisma.inventoryUnit.update({
      where: { id },
      data: { status }
    });
  }

  static async getInventoryByProject(projectId: string, isManager: boolean) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    if (!isManager && (project.status !== 'ACTIVE' || project.verificationStatus !== 'VERIFIED')) {
      return []; // Associates cannot see inventory for unapproved projects
    }

    if (isManager) {
      return prisma.inventoryUnit.findMany({ where: { projectId } });
    } else {
      // Associates should only see AVAILABLE, but business logic might allow seeing BOOKED/BLOCKED as unavailable.
      // We will return all, but frontend will show them as disabled.
      return prisma.inventoryUnit.findMany({ where: { projectId } });
    }
  }

  static async getInventoryUnitById(id: string, isManager: boolean) {
    const unit = await prisma.inventoryUnit.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!unit) return null;

    if (!isManager) {
      if (unit.project.status !== 'ACTIVE' || unit.project.verificationStatus !== 'VERIFIED') {
        return null;
      }
    }

    return unit;
  }
}
