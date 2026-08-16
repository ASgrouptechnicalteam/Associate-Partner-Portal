import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchController = {
  async globalSearch(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(200).json({ 
          success: true, 
          results: { projects: [], associates: [], bookings: [] } 
        });
      }

      const searchQuery = q.trim();
      const role = req.user?.role;
      const userId = req.user?.id;

      // 1. Search Projects
      // MD/AM can search all projects. Associates can only search ACTIVE projects.
      const projectWhere: any = {
        OR: [
          { name: { contains: searchQuery } },
          { code: { contains: searchQuery } },
          { location: { contains: searchQuery } }
        ]
      };
      if (role === 'ASSOCIATE') {
        projectWhere.status = 'ACTIVE';
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
        select: { id: true, name: true, code: true, status: true, projectType: true, location: true },
        take: 5
      });

      // 2. Search Associates
      // MD/AM can search all associates. Associates can only search active downline or it's restricted.
      // For simplicity, let's allow basic info search if role is MD or AM.
      // If ASSOCIATE, they can only search their direct downline.
      let associates: any[] = [];
      if (role === 'MD' || role === 'ASSOCIATE_MANAGER') {
        associates = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { associateId: { contains: searchQuery } },
              { phone: { contains: searchQuery } }
            ]
          },
          select: { id: true, name: true, associateId: true, role: { select: { name: true } }, phone: true },
          take: 5
        });
      }

      // 3. Search Bookings
      // MD/AM can search all bookings. Associates can only search their own.
      const bookingWhere: any = {
        OR: [
          { customerName: { contains: searchQuery } },
          { customerPhone: { contains: searchQuery } },
          { project: { name: { contains: searchQuery } } }
        ]
      };
      if (role === 'ASSOCIATE') {
        bookingWhere.associateId = userId;
      }

      const bookings = await prisma.booking.findMany({
        where: bookingWhere,
        select: { 
          id: true, 
          customerName: true, 
          status: true,
          project: { select: { name: true } },
          associate: { select: { name: true, associateId: true } }
        },
        take: 5
      });

      return res.status(200).json({
        success: true,
        results: {
          projects,
          associates: associates.map(a => ({ ...a, role: a.role.name })),
          bookings
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({ success: false, message: 'Failed to perform search' });
    }
  }
};
