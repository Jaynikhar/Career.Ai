import cron from 'node-cron';
import { env } from '../config/env.js';
import { ingestJobs } from './ingestJobs.js';
import { generateQuestionsForAllCompanies } from './generateQuestions.js';
import { expireOldJobs } from './expireOldJobs.js';

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  let ingestRunning = false;
  cron.schedule(env.jobIngestCron, async () => {
    if (ingestRunning) return;
    ingestRunning = true;
    try {
      await ingestJobs();
    } catch (err) {
      console.error('[scheduler] job ingest failed:', err.message);
    } finally {
      ingestRunning = false;
    }
  });

  let questionGenRunning = false;
  cron.schedule(env.questionGenCron, async () => {
    if (questionGenRunning) return;
    questionGenRunning = true;
    try {
      await generateQuestionsForAllCompanies();
    } catch (err) {
      console.error('[scheduler] question generation failed:', err.message);
    } finally {
      questionGenRunning = false;
    }
  });

  let expiryRunning = false;
  cron.schedule(env.jobExpiryCron, async () => {
    if (expiryRunning) return;
    expiryRunning = true;
    try {
      await expireOldJobs();
    } catch (err) {
      console.error('[scheduler] job expiry failed:', err.message);
    } finally {
      expiryRunning = false;
    }
  });

  console.log(`[scheduler] started — jobs: "${env.jobIngestCron}", questions: "${env.questionGenCron}", expiry: "${env.jobExpiryCron}"`);

  ingestJobs().catch((err) => console.error('[scheduler] initial job ingest failed:', err.message));
  generateQuestionsForAllCompanies().catch((err) => console.error('[scheduler] initial question gen failed:', err.message));
}