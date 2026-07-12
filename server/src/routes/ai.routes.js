import { Router } from 'express';
import { customizeResume, generateCoverLetter, draftColdEmail, draftLinkedInReferral, history } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';

const router = Router();
router.use(requireAuth, requireActiveSubscription);
router.post('/resume/customize', customizeResume);
router.post('/cover-letter', generateCoverLetter);
router.post('/cold-email/draft', draftColdEmail);
router.post('/linkedin-referral/draft', draftLinkedInReferral);
router.get('/history', history);

export default router;