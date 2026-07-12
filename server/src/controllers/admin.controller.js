import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Job from '../models/Job.js';
import Question from '../models/Question.js';
import { ingestJobs } from '../jobs/ingestJobs.js';
import { generateQuestionsForAllCompanies } from '../jobs/generateQuestions.js';
import { KNOWN_COMPANIES } from '../data/knownCompanies.js';


export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
}

export async function listSubscriptions(req, res, next) {
  try {
    const subscriptions = await Subscription.find().populate('userId', 'name email');
    res.json({ subscriptions });
  } catch (err) { next(err); }
}

export async function analytics(req, res, next) {
  try {
    const [totalUsers, activeSubs, totalJobs] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Job.countDocuments({ isActive: true })
    ]);
    res.json({ totalUsers, activeSubs, totalJobs });
  } catch (err) { next(err); }
}

// Admin sees ALL jobs (including ones auto-fetch already delisted), so they
// can review and hard-delete anything — the public /jobs route only ever
// shows isActive:true ones.
export async function listJobsAdmin(req, res, next) {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) { next(err); }
}



export function listKnownCompanies(req, res) {
  res.json({ companies: KNOWN_COMPANIES });
}


export async function createJob(req, res, next) {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ job });
  } catch (err) { next(err); }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json({ job });
  } catch (err) { next(err); }
}

// Real delete, not a soft delist — matches "admin can delete the job"
// literally rather than just hiding it from the public board.
export async function deleteJob(req, res, next) {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted.' });
  } catch (err) { next(err); }
}

// Manual question CRUD.
export async function createQuestion(req, res, next) {
  try {
    const { companyId, type, content, difficulty, year, tags } = req.body;
    if (!companyId || !type || !content) {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'companyId, type, and content are required.' });
    }
    const question = await Question.create({
      companyId,
      type,
      content,
      difficulty: difficulty || 'Medium',
      year: year || new Date().getFullYear(),
      tags: tags || [],
      source: 'manual'
    });
    res.status(201).json({ question });
  } catch (err) { next(err); }
}

export async function listAllQuestions(req, res, next) {
  try {
    const { companyId } = req.query;
    const filter = companyId ? { companyId } : {};
    const questions = await Question.find(filter).populate('companyId', 'name').sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) { next(err); }
}

export async function deleteQuestion(req, res, next) {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err) { next(err); }
}

// Manual triggers for the recurring workers — lets an admin run them on
// demand from the UI instead of waiting for the next cron tick.
export async function triggerJobIngest(req, res, next) {
  try {
    const result = await ingestJobs();
    res.json(result);
  } catch (err) { next(err); }
}

export async function triggerQuestionGeneration(req, res, next) {
  try {
    const result = await generateQuestionsForAllCompanies();
    res.json(result);
  } catch (err) { next(err); }
}