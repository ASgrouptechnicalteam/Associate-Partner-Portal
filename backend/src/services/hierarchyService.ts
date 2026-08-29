import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export class HierarchyService {
  /**
   * Retrieves all descendants of a given user ID dynamically using a recursive query approach in memory or repeated queries.
   */
  static async getAllDescendants(userId: string): Promise<User[]> {
    const allUsers = await prisma.user.findMany();
    const descendants: User[] = [];
    
    // Map for quick children lookup
    const childrenMap = new Map<string, User[]>();
    for (const user of allUsers) {
      if (user.parentId) {
        if (!childrenMap.has(user.parentId)) {
          childrenMap.set(user.parentId, []);
        }
        childrenMap.get(user.parentId)!.push(user);
      }
    }

    const queue: string[] = [userId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = childrenMap.get(currentId) || [];
      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  static async getHierarchyStats(userId: string): Promise<{ directMembersCount: number, totalDescendantsCount: number }> {
    const allUsers = await prisma.user.findMany({
      select: { id: true, parentId: true }
    });
    
    let directMembersCount = 0;
    const childrenMap = new Map<string, string[]>();
    
    for (const user of allUsers) {
      if (user.parentId) {
        if (user.parentId === userId) {
          directMembersCount++;
        }
        if (!childrenMap.has(user.parentId)) {
          childrenMap.set(user.parentId, []);
        }
        childrenMap.get(user.parentId)!.push(user.id);
      }
    }

    let totalDescendantsCount = 0;
    const queue: string[] = [userId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = childrenMap.get(currentId) || [];
      for (const child of children) {
        totalDescendantsCount++;
        queue.push(child);
      }
    }

    return { directMembersCount, totalDescendantsCount };
  }

  static async buildTree(userId: string | null = null, filterTeamId: string | null = null): Promise<any[]> {
    const whereClause: any = {};
    if (filterTeamId) {
      whereClause.teamId = filterTeamId;
    }

    const allUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        userIdentifier: true,
        name: true,
        email: true,
        designation: true,
        commissionPercentage: true,
        status: true,
        dateOfJoining: true,
        teamId: true,
        parentId: true,
        profileImageUrl: true,
        role: {
          select: { name: true }
        }
      }
    });

    const userMap = new Map<string, any>();
    const roots: any[] = [];

    // Initialize map
    for (const user of allUsers) {
      userMap.set(user.id, { 
        ...user, 
        children: [],
        directMembersCount: 0,
        totalDescendantsCount: 0 
      });
    }

    // Build children relationships
    for (const user of allUsers) {
      const node = userMap.get(user.id);
      if (user.parentId && userMap.has(user.parentId)) {
        userMap.get(user.parentId).children.push(node);
        userMap.get(user.parentId).directMembersCount++;
      } else {
        roots.push(node);
      }
    }

    // Calculate total descendants (bottom-up using DFS)
    const computeDescendants = (node: any): number => {
      let count = node.children.length;
      for (const child of node.children) {
        count += computeDescendants(child);
      }
      node.totalDescendantsCount = count;
      return count;
    };

    for (const root of roots) {
      computeDescendants(root);
    }

    if (userId) {
      return userMap.has(userId) ? [userMap.get(userId)] : [];
    }

    return roots;
  }
}
