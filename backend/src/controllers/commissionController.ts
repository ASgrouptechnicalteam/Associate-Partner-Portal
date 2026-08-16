import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

export const getPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const policies = await prisma.commissionPolicy.findMany({
      include: {
        associate: { select: { name: true, associateId: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPolicySchema = z.object({
  associateId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
});

export const createPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { associateId, projectId, type, value } = createPolicySchema.parse(req.body);

    const policy = await prisma.commissionPolicy.create({
      data: {
        associateId,
        projectId,
        type,
        value: new Prisma.Decimal(value),
        status: 'PENDING_APPROVAL',
        createdBy: req.user!.id
      }
    });

    await AuditService.log(req.user!.id, 'CREATE_COMMISSION_POLICY', 'CommissionPolicy', policy.id, null, policy);

    res.status(201).json({ success: true, data: policy });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const approvePolicySchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
  reason: z.string().optional()
});

export const approvePolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, reason } = approvePolicySchema.parse(req.body);

    const policy = await prisma.commissionPolicy.findUnique({ where: { id } });
    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found' });
      return;
    }

    const updated = await prisma.commissionPolicy.update({
      where: { id },
      data: {
        status,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
        rejectionReason: reason || null
      }
    });

    await AuditService.log(req.user!.id, 'APPROVE_COMMISSION_POLICY', 'CommissionPolicy', id, policy, updated);

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const payTransactionSchema = z.object({
  amount: z.number().positive()
});

export const payTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { amount } = payTransactionSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.commissionTransaction.findUnique({ where: { id } });
      if (!transaction) throw new Error('Transaction not found');

      const payment = new Prisma.Decimal(amount);
      const newReceived = transaction.amountReceived.add(payment);

      if (newReceived.greaterThan(transaction.amountCalculated)) {
        throw new Error('Overpayment detected. Received amount cannot exceed calculated amount.');
      }

      const newDue = transaction.amountCalculated.sub(newReceived);
      const newStatus = newDue.isZero() ? 'RECEIVED' : 'PARTIAL';

      const updated = await tx.commissionTransaction.update({
        where: { id },
        data: {
          amountReceived: newReceived,
          amountDue: newDue,
          status: newStatus
        }
      });

      await AuditService.logWithTx(tx, req.user!.id, 'PAY_COMMISSION', 'CommissionTransaction', id, transaction, updated, { paymentAmount: amount });

      return updated;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDashboardKPIs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    
    // Authorization filter
    let whereClause: any = {};
    if (role === 'ASSOCIATE') {
      whereClause.associateId = id;
    }

    const transactions = await prisma.commissionTransaction.findMany({ where: whereClause });

    let total = new Prisma.Decimal(0);
    let received = new Prisma.Decimal(0);
    let pending = new Prisma.Decimal(0);

    transactions.forEach(t => {
      total = total.add(t.amountCalculated);
      received = received.add(t.amountReceived);
      pending = pending.add(t.amountDue);
    });

    res.status(200).json({
      success: true,
      data: {
        totalCommission: total.toNumber(),
        received: received.toNumber(),
        pending: pending.toNumber() // pending/due
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLedger = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    const { projectId, timeFilter } = req.query;
    
    let whereClause: any = {};

    if (role === 'ASSOCIATE') {
      whereClause.associateId = id;
    }

    if (projectId) {
      whereClause.projectId = String(projectId);
    }

    if (timeFilter) {
      const now = new Date();
      if (timeFilter === 'TODAY') {
        const start = new Date(now.setHours(0,0,0,0));
        whereClause.createdAt = { gte: start };
      } else if (timeFilter === 'WEEK') {
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0,0,0,0);
        whereClause.createdAt = { gte: start };
      } else if (timeFilter === 'MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.createdAt = { gte: start };
      } else if (timeFilter === 'YEAR') {
        const start = new Date(now.getFullYear(), 0, 1);
        whereClause.createdAt = { gte: start };
      }
    }

    const ledger = await prisma.commissionTransaction.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        booking: { select: { customerName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
