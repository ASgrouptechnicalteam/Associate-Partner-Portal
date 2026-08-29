import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { 
  createProject, 
  updateProject, 
  submitProject, 
  approveProject, 
  rejectProject, 
  archiveProject, 
  getProjects, 
  getProjectById,
  toggleHotStatus,
  toggleFeaturedStatus,
  deleteProject
} from '../controllers/projectController';
import { uploadProjectMedia, deleteProjectMedia, setCoverPhoto } from '../controllers/mediaController';
import { upload } from '../utils/fileUpload';
import { validateCreateProject, validateUpdateProject, validateProjectRejection } from '../validators/projectValidator';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Public (to authenticated users) but data is gated in controller based on role
router.get('/', getProjects);
router.get('/:id', getProjectById);

// AM and MD routes
router.post('/', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), validateCreateProject, createProject);
router.patch('/:id', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), validateUpdateProject, updateProject);
router.patch('/:id/submit', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), submitProject);
router.patch('/:id/archive', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), archiveProject);
router.patch('/:id/hot', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), toggleHotStatus);
router.patch('/:id/featured', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), toggleFeaturedStatus);
router.delete('/:id', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), deleteProject);
import { 
  getPublishedLayout, 
  getDraftLayout, 
  saveDraftLayout, 
  publishLayout,
  uploadLayoutBackground 
} from '../controllers/layoutController';

// Media routes
router.post('/:projectId/media', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), upload.single('file'), uploadProjectMedia);
router.delete('/media/:mediaId', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), deleteProjectMedia);
router.patch('/media/:mediaId/cover', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), setCoverPhoto);

// Layout routes
router.get('/:projectId/layout/published', getPublishedLayout);
router.get('/:projectId/layout/draft', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), getDraftLayout);
router.post('/:projectId/layout/draft', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), saveDraftLayout);
router.post('/layout/:layoutId/publish', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), publishLayout);
router.post('/:projectId/layout/background', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), upload.single('image'), uploadLayoutBackground);

// MD only verification routes
router.patch('/:id/approve', requireRole('MD'), approveProject);
router.patch('/:id/reject', requireRole('MD'), validateProjectRejection, rejectProject);

export default router;
