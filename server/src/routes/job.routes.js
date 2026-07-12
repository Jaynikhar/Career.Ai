import { Router } from 'express';
import { listJobs, getJob } from '../controllers/job.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, listJobs);
router.get('/:id', requireAuth, getJob);

export default router;
