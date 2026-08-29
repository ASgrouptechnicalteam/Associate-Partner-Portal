import { PrismaClient, Prisma } from '@prisma/client';
import { AuditService } from './auditService';
import { HierarchyService } from './hierarchyService';

const prisma = new PrismaClient();

export class TeamService {
  /**
   * Retrieves the full downline of a given user.
   */
  static async getFullDownline(userId: string): Promise<string[]> {
    const descendants = await HierarchyService.getAllDescendants(userId);
    return descendants.map(u => u.id);
  }

  /**
   * Checks if an associate is in another associate's downline.
   */
  static async isAssociateInDownline(parentId: string, targetId: string): Promise<boolean> {
    if (parentId === targetId) return true; // Can see self
    const downline = await this.getFullDownline(parentId);
    return downline.includes(targetId);
  }

  /**
   * Assigns a child to a parent.
   */
  static async assignAssociateToParent(parentUserId: string, childUserId: string) {
    if (parentUserId === childUserId) {
      throw new Error("Cannot assign an associate to themselves.");
    }

    // Check for cycles: we cannot make A a child of B if B is already in A's downline.
    const childDownline = await this.getFullDownline(childUserId);
    if (childDownline.includes(parentUserId)) {
      throw new Error("Hierarchy cycle detected. The proposed parent is already in the child's downline.");
    }

    return prisma.user.update({
      where: { id: childUserId },
      data: { parentId: parentUserId }
    });
  }

  static async assignAssociateToParentTx(tx: Prisma.TransactionClient, parentUserId: string, childUserId: string) {
    if (parentUserId === childUserId) {
      throw new Error("Cannot assign an associate to themselves.");
    }
    const childDownline = await this.getFullDownline(childUserId); // Assuming getFullDownline doesn't need tx context for safety
    if (childDownline.includes(parentUserId)) {
      throw new Error("Hierarchy cycle detected. The proposed parent is already in the child's downline.");
    }
    return tx.user.update({
      where: { id: childUserId },
      data: { parentId: parentUserId }
    });
  }

  /**
   * Removes an associate's parent assignment.
   */
  static async removeAssociateFromParent(childUserId: string) {
    return prisma.user.update({
      where: { id: childUserId },
      data: { parentId: null }
    });
  }

  static async removeAssociateFromParentTx(tx: Prisma.TransactionClient, childUserId: string) {
    return tx.user.update({
      where: { id: childUserId },
      data: { parentId: null }
    });
  }

  /**
   * Gets hierarchical stats for a user
   */
  static async getTeamStatistics(userId: string) {
    return HierarchyService.getHierarchyStats(userId);
  }
}
