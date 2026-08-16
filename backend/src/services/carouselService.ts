import { PrismaClient, CarouselItem, Prisma } from '@prisma/client';
import { AuditService } from './auditService';

const prisma = new PrismaClient();

export class CarouselService {
  static async getAll(includeInactive: boolean = false): Promise<CarouselItem[]> {
    const where = includeInactive ? {} : { status: 'ACTIVE' };
    return prisma.carouselItem.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async getById(id: string): Promise<CarouselItem | null> {
    return prisma.carouselItem.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async create(data: Omit<Prisma.CarouselItemCreateInput, 'id' | 'createdAt' | 'updatedAt'>, actorId: string): Promise<CarouselItem> {
    const item = await prisma.carouselItem.create({
      data
    });
    
    await AuditService.log(actorId, 'CREATE_CAROUSEL_ITEM', 'CarouselItem', item.id, null, item);
    return item;
  }

  static async update(id: string, data: Partial<Omit<Prisma.CarouselItemUpdateInput, 'id' | 'createdAt' | 'updatedAt'>>, actorId: string): Promise<CarouselItem> {
    const before = await prisma.carouselItem.findUnique({ where: { id } });
    if (!before) throw new Error('Carousel item not found');

    const item = await prisma.carouselItem.update({
      where: { id },
      data
    });
    
    await AuditService.log(actorId, 'UPDATE_CAROUSEL_ITEM', 'CarouselItem', item.id, before, item);
    return item;
  }

  static async delete(id: string, actorId: string): Promise<void> {
    const before = await prisma.carouselItem.findUnique({ where: { id } });
    if (!before) throw new Error('Carousel item not found');

    await prisma.carouselItem.delete({
      where: { id }
    });
    
    await AuditService.log(actorId, 'DELETE_CAROUSEL_ITEM', 'CarouselItem', id, before, null);
  }

  static async reorder(items: { id: string; displayOrder: number }[], actorId: string): Promise<void> {
    // Transaction to safely update all orders
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.carouselItem.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder }
        });
      }
    });

    await AuditService.log(actorId, 'REORDER_CAROUSEL_ITEMS', 'CarouselItem', 'bulk', null, { reorderedCount: items.length });
  }
}
