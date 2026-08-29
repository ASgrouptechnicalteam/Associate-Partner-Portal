import { Router } from 'express';
import { authenticate, roleCheck } from '../middleware/authMiddleware';
import * as commissionController from '../controllers/commissionController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// AM/MD only for policies
router.get('/policies', roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), commissionController.getPolicies);
router.post('/policies', roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), commissionController.createPolicy);
router.patch('/policies/:id/approve', roleCheck(['MD']), commissionController.approvePolicy);

// Transactions (AM/MD only for payment)
router.patch('/transactions/:id/pay', roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), commissionController.payTransaction);

// Dashboard and Ledger (All roles, data scoped internally)
router.get('/dashboard', commissionController.getDashboardKPIs);
router.get('/ledger', commissionController.getLedger);

export default router;
