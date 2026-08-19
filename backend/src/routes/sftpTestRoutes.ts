import { Router } from 'express';
import { testHostingerSftp } from '../controllers/sftpTestController';

const router = Router();

// TEMPORARY: public SFTP connectivity test.
// Remove this route after the SFTP test is completed.
router.get('/hostinger', testHostingerSftp);

export default router;