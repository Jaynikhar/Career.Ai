import { Router } from 'express';
import { listApplications, createApplication, updateApplication } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/applications', listApplications);
router.post('/applications', createApplication);
router.patch('/applications/:id', updateApplication);

export default router;
