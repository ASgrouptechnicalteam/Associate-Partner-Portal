import { PrismaClient, Prisma } from '@prisma/client';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

// State machine — only these transitions are valid
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'PENDING':    ['MD_REVIEW'],
  'MD_REVIEW':  ['APPROVED', 'REJECTED'],
  'APPROVED':   ['PAID'],
  'PAID':       [],
  'REJECTED':   []
};

const VALID_TRAVEL_MODES = ['OWN_VEHICLE', 'TAXI', 'PUBLIC_TRANSPORT', 'AUTO', 'OTHER'];
const VALID_STATUSES = Object.keys(STATUS_TRANSITIONS);

export class TravelService {
  // ── Safe DTO: never expose sensitive user fields ─────────────────
  private static safeUserSelect = {
    id: true,
    associateId: true,
    name: true,
    email: true,
    role: { select: { name: true } }
  };

  // ── 1. Create ─────────────────────────────────────────────────────
  static async createTravelRequest(
    requesterId: string,
    data: {
      travelDate: string;
      fromLocation: string;
      toLocation: string;
      purpose: string;
      projectId?: string;
      customerName?: string;
      distanceKm: number;
      travelMode: string;
      amountRequested: number;
      notes?: string;
    },
    billUrl?: string,
    ipAddress?: string
  ) {
    if (!VALID_TRAVEL_MODES.includes(data.travelMode)) {
      throw new Error(`Invalid travel mode: ${data.travelMode}`);
    }
    if (data.distanceKm <= 0) {
      throw new Error('Distance must be greater than 0');
    }
    if (data.amountRequested <= 0) {
      throw new Error('Amount requested must be greater than 0');
    }

    // Validate projectId exists if provided
    if (data.projectId) {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project) throw new Error('Project not found');
    }

    const travel = await prisma.travelRequest.create({
      data: {
        requesterId,
        travelDate: new Date(data.travelDate),
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        purpose: data.purpose,
        projectId: data.projectId || null,
        customerName: data.customerName || null,
        distanceKm: new Prisma.Decimal(data.distanceKm),
        travelMode: data.travelMode,
        amountRequested: new Prisma.Decimal(data.amountRequested),
        billUrl: billUrl || null,
        notes: data.notes || null,
        status: 'PENDING'
      }
    });

    await AuditService.log(requesterId, 'CREATE_TRAVEL_REQUEST', 'TravelRequest', travel.id, null, travel, { ipAddress });
    return travel;
  }

  // ── 2. List (scoped by role) ──────────────────────────────────────
  static async listTravelRequests(
    userId: string,
    role: string,
    filters: { status?: string; projectId?: string } = {}
  ) {
    const where: any = { isDeleted: false };

    // Associates can only see their own requests
    if (role === 'ASSOCIATE' || role === 'ASSOCIATE_MANAGER') {
      where.requesterId = userId;
    }
    // MD sees all (with optional filters)

    if (filters.status && VALID_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    return prisma.travelRequest.findMany({
      where,
      include: {
        requester: { select: TravelService.safeUserSelect },
        project: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ── 3. Get by ID (with IDOR enforcement) ─────────────────────────
  static async getTravelRequestById(id: string, userId: string, role: string) {
    const travel = await prisma.travelRequest.findFirst({
      where: { id, isDeleted: false },
      include: {
        requester: { select: TravelService.safeUserSelect },
        project: { select: { id: true, name: true, code: true } }
      }
    });

    if (!travel) return null;

    // IDOR: Associates and AMs can only see their own
    if (role === 'ASSOCIATE' || role === 'ASSOCIATE_MANAGER') {
      if (travel.requesterId !== userId) {
        throw new Error('FORBIDDEN');
      }
    }

    return travel;
  }

  // ── 4. Submit (PENDING → MD_REVIEW) ──────────────────────────────
  static async submitRequest(id: string, userId: string, role: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const travel = await tx.travelRequest.findFirst({ where: { id, isDeleted: false } });
      if (!travel) throw new Error('Travel request not found');

      // Only the requester can submit (unless MD)
      if (role !== 'MD' && travel.requesterId !== userId) {
        throw new Error('FORBIDDEN');
      }

      const allowed = STATUS_TRANSITIONS[travel.status] || [];
      if (!allowed.includes('MD_REVIEW')) {
        throw new Error(`Cannot submit from status: ${travel.status}`);
      }

      const updated = await tx.travelRequest.update({
        where: { id },
        data: { status: 'MD_REVIEW' }
      });

      await AuditService.logWithTx(tx, userId, 'SUBMIT_TRAVEL_REQUEST', 'TravelRequest', id,
        { status: travel.status }, { status: 'MD_REVIEW' }, { ipAddress });

      return updated;
    });
  }

  // ── 5. Review (MD_REVIEW → APPROVED | REJECTED) ───────────────────
  static async reviewRequest(
    id: string,
    actorId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    ipAddress?: string
  ) {
    if (decision === 'REJECTED' && !rejectionReason?.trim()) {
      throw new Error('Rejection reason is required when rejecting a request');
    }

    return prisma.$transaction(async (tx) => {
      const travel = await tx.travelRequest.findFirst({ where: { id, isDeleted: false } });
      if (!travel) throw new Error('Travel request not found');

      const allowed = STATUS_TRANSITIONS[travel.status] || [];
      if (!allowed.includes(decision)) {
        throw new Error(`Invalid transition from ${travel.status} to ${decision}`);
      }

      // Prevent self-approval: MD cannot approve their own request
      if (travel.requesterId === actorId && decision === 'APPROVED') {
        throw new Error('Self-approval is not permitted');
      }

      const updated = await tx.travelRequest.update({
        where: { id },
        data: {
          status: decision,
          reviewedBy: actorId,
          reviewedAt: new Date(),
          rejectionReason: decision === 'REJECTED' ? rejectionReason : null
        }
      });

      const action = decision === 'APPROVED' ? 'APPROVE_TRAVEL_REQUEST' : 'REJECT_TRAVEL_REQUEST';
      await AuditService.logWithTx(tx, actorId, action, 'TravelRequest', id,
        { status: travel.status }, { status: decision, rejectionReason }, { ipAddress });

      await NotificationService.createNotification({
        userId: travel.requesterId,
        category: 'Travel',
        title: `Travel Request ${decision}`,
        message: `Your travel request for ${travel.purpose} on ${travel.travelDate.toLocaleDateString()} has been ${decision.toLowerCase()}.`,
        entityType: 'TravelRequest',
        entityId: travel.id,
        actionUrl: `/travel`,
        eventKey: `TRAVEL_${decision}_${travel.id}`
      }, tx as any);

      return updated;
    });
  }

  // ── 6. Mark Paid (APPROVED → PAID) ───────────────────────────────
  static async markPaid(
    id: string,
    actorId: string,
    amountPaid: number,
    paymentNotes?: string,
    ipAddress?: string
  ) {
    if (amountPaid <= 0) throw new Error('Amount paid must be greater than 0');

    return prisma.$transaction(async (tx) => {
      const travel = await tx.travelRequest.findFirst({ where: { id, isDeleted: false } });
      if (!travel) throw new Error('Travel request not found');

      const allowed = STATUS_TRANSITIONS[travel.status] || [];
      if (!allowed.includes('PAID')) {
        throw new Error(`Cannot mark PAID from status: ${travel.status}`);
      }

      const updated = await tx.travelRequest.update({
        where: { id },
        data: {
          status: 'PAID',
          paidBy: actorId,
          paidAt: new Date(),
          amountPaid: new Prisma.Decimal(amountPaid),
          paymentNotes: paymentNotes || null
        }
      });

      await AuditService.logWithTx(tx, actorId, 'MARK_TRAVEL_PAID', 'TravelRequest', id,
        { status: travel.status }, { status: 'PAID', amountPaid, paymentNotes }, { ipAddress });

      await NotificationService.createNotification({
        userId: travel.requesterId,
        category: 'Travel',
        title: 'Travel Request Paid',
        message: `Your travel request for ${travel.purpose} has been paid (${amountPaid}).`,
        entityType: 'TravelRequest',
        entityId: travel.id,
        actionUrl: `/travel`,
        eventKey: `TRAVEL_PAID_${travel.id}`
      }, tx as any);

      return updated;
    });
  }
}
