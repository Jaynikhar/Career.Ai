import { Router } from 'express';
import { listPlans, checkout, cancel, status } from '../controllers/subscription.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/plans', listPlans);
router.get('/status', requireAuth, status);
router.post('/checkout', requireAuth, checkout);
router.post('/cancel', requireAuth, cancel);

export default router;
