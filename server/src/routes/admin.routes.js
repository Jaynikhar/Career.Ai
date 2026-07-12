import { Router } from 'express';
import {
  listUsers, listSubscriptions, analytics,
  listJobsAdmin, createJob, updateJob, deleteJob,
  createQuestion, listAllQuestions, deleteQuestion,
  triggerJobIngest, triggerQuestionGeneration,
  listKnownCompanies
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/users', listUsers);
router.get('/subscriptions', listSubscriptions);
router.get('/analytics', analytics);
router.get('/jobs', listJobsAdmin);
router.get('/known-companies', listKnownCompanies);
router.post('/jobs', createJob);
router.patch('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.get('/questions', listAllQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/ingest/jobs', triggerJobIngest);
router.post('/ingest/questions', triggerQuestionGeneration);

export default router;