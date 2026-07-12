import Job from '../models/Job.js';
import { env } from '../config/env.js';

// Runs on a schedule (see scheduler.js). Deletes any job posting older
// than JOB_EXPIRY_DAYS, regardless of source — matches "auto-delete after
// 7 days of posting" literally. If you'd rather admin-added jobs never
// expire, change the filter below to also require source !== 'manual'.
export async function expireOldJobs() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - env.jobExpiryDays);

  const result = await Job.deleteMany({ createdAt: { $lt: cutoff } });
  console.log(`[job-expiry] deleted ${result.deletedCount} jobs older than ${env.jobExpiryDays} days`);
  return { deletedCount: result.deletedCount };
}