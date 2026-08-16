import { PrismaClient, Prisma, Booking } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from './auditService';
import { TeamService } from './teamService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class CommissionService {
  /**
   * Determine the policy and calculate commission for a verified booking.
   * Runs within the same transaction as the booking verification.
   */
  async generateCommission(tx: Prisma.TransactionClient, booking: Booking) {
    // Check if commission already exists
    const existing = await tx.commissionTransaction.findUnique({
      where: { bookingId: booking.id }
    });
    
    if (existing) {
      // Idempotency: return existing if already generated
      return existing;
    }

    // 1. Find active policy for the associate
    // Precedence: Specific Project > Global
    let policy = await tx.commissionPolicy.findFirst({
      where: {
        associateId: booking.associateId,
        projectId: booking.projectId,
        status: 'ACTIVE'
      }
    });

    if (!policy) {
      policy = await tx.commissionPolicy.findFirst({
        where: {
          associateId: booking.associateId,
          projectId: null,
          status: 'ACTIVE'
        }
      });
    }

    if (!policy) {
      // No active policy, no commission generated
      return null;
    }

    // 2. Calculate amount
    let amountCalculated = new Decimal(0);
    if (policy.type === 'PERCENTAGE') {
      amountCalculated = booking.bookingAmount.mul(policy.value).div(100);
    } else if (policy.type === 'FIXED') {
      amountCalculated = policy.value;
    }

    // 3. Create Transaction
    const transaction = await tx.commissionTransaction.create({
      data: {
        bookingId: booking.id,
        associateId: booking.associateId,
        projectId: booking.projectId,
        commissionType: policy.type,
        commissionValue: policy.value,
        baseAmount: booking.bookingAmount,
        amountCalculated: amountCalculated,
        amountReceived: 0,
        amountDue: amountCalculated,
        status: 'PENDING'
      }
    });

    // 4. Audit
    await tx.auditLog.create({
      data: {
        actor: 'SYSTEM',
        action: 'CREATE_COMMISSION',
        entity: 'CommissionTransaction',
        entityId: transaction.id,
        afterJson: JSON.stringify(transaction),
        metadata: JSON.stringify({ policyId: policy.id })
      }
    });
    // 5. Notification
    await NotificationService.createNotification({
      userId: transaction.associateId,
      category: 'Commission',
      title: 'Commission Generated',
      message: `A commission of ${amountCalculated} has been generated for your recent booking.`,
      entityType: 'CommissionTransaction',
      entityId: transaction.id,
      actionUrl: `/commissions`, // Or wherever they see it
      eventKey: `COMMISSION_GENERATED_${transaction.id}`
    }, tx as any);

    return transaction;
  }
}

export default new CommissionService();
