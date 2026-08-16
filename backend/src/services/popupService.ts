import { PrismaClient, PromotionalPopup, Prisma } from '@prisma/client';
import { AuditService } from './auditService';

const prisma = new PrismaClient();

export class PopupService {
  static async getAll(includeInactive: boolean = false): Promise<PromotionalPopup[]> {
    const where = includeInactive ? {} : { status: 'ACTIVE' };
    return prisma.promotionalPopup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async getById(id: string): Promise<PromotionalPopup | null> {
    return prisma.promotionalPopup.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async create(data: Omit<Prisma.PromotionalPopupCreateInput, 'id' | 'createdAt' | 'updatedAt'>, actorId: string): Promise<PromotionalPopup> {
    const item = await prisma.promotionalPopup.create({
      data
    });
    
    await AuditService.log(actorId, 'CREATE_POPUP', 'PromotionalPopup', item.id, null, item);
    return item;
  }

  static async update(id: string, data: Partial<Omit<Prisma.PromotionalPopupUpdateInput, 'id' | 'createdAt' | 'updatedAt'>>, actorId: string): Promise<PromotionalPopup> {
    const before = await prisma.promotionalPopup.findUnique({ where: { id } });
    if (!before) throw new Error('Popup not found');

    const item = await prisma.promotionalPopup.update({
      where: { id },
      data
    });
    
    await AuditService.log(actorId, 'UPDATE_POPUP', 'PromotionalPopup', item.id, before, item);
    return item;
  }

  static async delete(id: string, actorId: string): Promise<void> {
    const before = await prisma.promotionalPopup.findUnique({ where: { id } });
    if (!before) throw new Error('Popup not found');

    await prisma.promotionalPopup.delete({
      where: { id }
    });
    
    await AuditService.log(actorId, 'DELETE_POPUP', 'PromotionalPopup', id, before, null);
  }
}
