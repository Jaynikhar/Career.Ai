import Application from '../models/Application.js';

export async function listApplications(req, res, next) {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title companyName')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) { next(err); }
}

export async function createApplication(req, res, next) {
  try {
    const { jobId, status } = req.body;
    const application = await Application.create({ userId: req.user.id, jobId, status: status || 'Applied' });
    res.status(201).json({ application });
  } catch (err) { next(err); }
}

export async function updateApplication(req, res, next) {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!application) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json({ application });
  } catch (err) { next(err); }
}
