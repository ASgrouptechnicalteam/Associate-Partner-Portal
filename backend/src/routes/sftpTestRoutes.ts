import { Router } from 'express';
import { testHostingerSftp } from '../controllers/sftpTestController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/hostinger',
  authenticate,
  testHostingerSftp
);

export default router;