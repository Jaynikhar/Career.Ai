import Job from '../models/Job.js';

export async function listJobs(req, res, next) {
  try {
    const { search, location, jobType } = req.query;
    const filter = { isActive: true };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) { next(err); }
}

export async function getJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found.' });
    res.json({ job });
  } catch (err) { next(err); }
}
