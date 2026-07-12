import Job from '../models/Job.js';
import { fetchLiveJobs } from '../services/jobFeed.service.js';
import { env } from '../config/env.js';

// Runs on a schedule (see scheduler.js). Upserts by externalId so re-runs
// never create duplicates.
export async function ingestJobs() {
  const started = Date.now();
  const jobs = await fetchLiveJobs({ searchTerm: env.jobFeedSearchTerm });

  let created = 0;
  let updated = 0;

  for (const job of jobs) {
    const result = await Job.findOneAndUpdate(
      { externalId: job.externalId },
      { $set: job, $setOnInsert: { isActive: true } },
      { upsert: true, new: false, rawResult: true }
    );
    if (result?.lastErrorObject?.updatedExisting) updated += 1;
    else created += 1;
  }

  console.log(`[job-ingest] fetched=${jobs.length} created=${created} updated=${updated} in ${Date.now() - started}ms`);
  return { fetched: jobs.length, created, updated };
}