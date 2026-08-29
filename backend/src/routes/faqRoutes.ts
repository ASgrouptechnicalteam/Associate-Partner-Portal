import { Router } from 'express';
import { getFaqs, getFaqById, createFaq, updateFaq, deleteFaq } from '../controllers/faqController';
import { authenticate, roleCheck } from '../middleware/authMiddleware';

const router = Router();

// Publicly readable for authenticated users (service handles filtering)
router.get('/', authenticate, getFaqs);
router.get('/:id', authenticate, getFaqById);

// CMS Endpoints
router.post('/', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), createFaq);
router.patch('/:id', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), updateFaq);
router.delete('/:id', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), deleteFaq);

export default router;
