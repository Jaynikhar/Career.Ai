import AIRequest from '../models/AIRequest.js';
import Job from '../models/Job.js';
import { generateWithAI } from '../services/ai.service.js';

async function runRequest(req, res, next, type) {
  try {
    const { jobId, context, manualJob } = req.body;

    let jobTitle;
    let companyName;

    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found.' });
      jobTitle = job.title;
      companyName = job.companyName;
    } else if (manualJob?.title && manualJob?.companyName) {
      // Manually-entered job — not looked up from the database. Lets users
      // generate for a posting that isn't in the job board at all.
      jobTitle = manualJob.title;
      companyName = manualJob.companyName;
    } else {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'Provide either jobId or manualJob { title, companyName }.' });
    }

    const fullContext = manualJob?.description
      ? `Job description:\n${manualJob.description}\n\nCandidate background:\n${context || ''}`
      : (context || '');

    const record = await AIRequest.create({
      userId: req.user.id, type, jobId: jobId || undefined, input: fullContext, status: 'processing'
    });

    const output = await generateWithAI({ type, jobTitle, companyName, context: fullContext });

    record.output = output;
    record.status = 'completed';
    await record.save();

    res.json({ requestId: record._id, output });
  } catch (err) { next(err); }
}

export const customizeResume = (req, res, next) => runRequest(req, res, next, 'resume_edit');
export const generateCoverLetter = (req, res, next) => runRequest(req, res, next, 'cover_letter');
export const draftColdEmail = (req, res, next) => runRequest(req, res, next, 'cold_email');
export const draftLinkedInReferral = (req, res, next) => runRequest(req, res, next, 'linkedin_referral');

export async function history(req, res, next) {
  try {
    const requests = await AIRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) { next(err); }
}