import { Router } from 'express';
import { listCompanies, listQuestions } from '../controllers/company.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireTrialOrSubscription } from '../middleware/subscription.middleware.js';

const router = Router();
router.get('/', requireAuth, listCompanies);
router.get('/:id/questions', requireAuth, requireTrialOrSubscription, listQuestions);

export default router;
