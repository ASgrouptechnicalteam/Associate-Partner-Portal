import { PrismaClient, Prisma } from '@prisma/client';
import { AuditService } from './auditService';

const prisma = new PrismaClient();

export class TeamService {
  /**
   * Retrieves the full downline of a given user.
   * Uses breadth-first search to avoid deep recursion limits, although hierarchy depth should be small.
   */
  static async getFullDownline(userId: string): Promise<string[]> {
    const downlineIds = new Set<string>();
    let currentLevelIds = [userId];

    while (currentLevelIds.length > 0) {
      const relationships = await prisma.teamRelationship.findMany({
        where: {
          parentAssociateId: { in: currentLevelIds },
          status: 'ACTIVE'
        },
        select: { childAssociateId: true }
      });

      const nextLevelIds: string[] = [];
      for (const rel of relationships) {
        if (!downlineIds.has(rel.childAssociateId)) {
          downlineIds.add(rel.childAssociateId);
          nextLevelIds.push(rel.childAssociateId);
        }
      }
      currentLevelIds = nextLevelIds;
    }

    return Array.from(downlineIds);
  }

  /**
   * Checks if an associate is in another associate's downline.
   */
  static async isAssociateInDownline(parentId: string, targetId: string): Promise<boolean> {
    if (parentId === targetId) return true; // Can see self
    const downline = await getFullDownline(parentId);
    return downline.includes(targetId);
  }

  /**
   * Assigns a child to a parent.
   */
  static async assignAssociateToParent(parentAssociateId: string, childAssociateId: string) {
    if (parentAssociateId === childAssociateId) {
      throw new Error("Cannot assign an associate to themselves.");
    }

    // Check for cycles: we cannot make A a child of B if B is already in A's downline.
    const childDownline = await this.getFullDownline(childAssociateId);
    if (childDownline.includes(parentAssociateId)) {
      throw new Error("Hierarchy cycle detected. The proposed parent is already in the child's downline.");
    }

    // Upsert the relationship: a child can only have ONE parent.
    // In our schema, childAssociateId is @unique.
    // Accept an optional Prisma transaction client.
    return prisma.teamRelationship.upsert({
      where: { childAssociateId },
      update: {
        parentAssociateId,
        status: 'ACTIVE'
      },
      create: {
        parentAssociateId,
        childAssociateId,
        status: 'ACTIVE'
      }
    });
  }

  static async assignAssociateToParentTx(tx: Prisma.TransactionClient, parentAssociateId: string, childAssociateId: string) {
    if (parentAssociateId === childAssociateId) {
      throw new Error("Cannot assign an associate to themselves.");
    }
    const childDownline = await this.getFullDownline(childAssociateId);
    if (childDownline.includes(parentAssociateId)) {
      throw new Error("Hierarchy cycle detected. The proposed parent is already in the child's downline.");
    }
    return tx.teamRelationship.upsert({
      where: { childAssociateId },
      update: {
        parentAssociateId,
        status: 'ACTIVE'
      },
      create: {
        parentAssociateId,
        childAssociateId,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Removes an associate's parent assignment (sets them to root level / no parent).
   */
  static async removeAssociateFromParent(childAssociateId: string) {
    return prisma.teamRelationship.delete({
      where: { childAssociateId }
    });
  }

  static async removeAssociateFromParentTx(tx: Prisma.TransactionClient, childAssociateId: string) {
    return tx.teamRelationship.delete({
      where: { childAssociateId }
    });
  }

  /**
   * Calculate Team Statistics
   */
  static async getTeamStatistics(userId: string) {
    const downlineIds = await this.getFullDownline(userId);
    const directRelationships = await prisma.teamRelationship.findMany({
      where: { parentAssociateId: userId, status: 'ACTIVE' }
    });

    const directMembers = directRelationships.length;
    const totalMembers = downlineIds.length;

    let totalBookings = 0;
    let totalCommission = new Prisma.Decimal(0);

    if (downlineIds.length > 0) {
      totalBookings = await prisma.booking.count({
        where: { associateId: { in: downlineIds } }
      });

      const transactions = await prisma.commissionTransaction.findMany({
        where: { associateId: { in: downlineIds } }
      });

      for (const t of transactions) {
        totalCommission = totalCommission.add(t.amountCalculated);
      }
    }

    return {
      directMembers,
      totalMembers,
      totalBookings,
      totalCommission: totalCommission.toNumber()
    };
  }
}

// Keep a module-level alias for internal use
const getFullDownline = TeamService.getFullDownline;
