import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  description: { type: String, required: true },
  applyUrl: { type: String, required: true },
  location: { type: String },
  jobType: { type: String, enum: ['Full-time', 'Internship', 'Contract'], default: 'Full-time' },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }],
  // Ingestion metadata — lets the auto-fetch worker upsert instead of
  // creating duplicates every time it runs.
  source: { type: String, enum: ['manual', 'remotive', 'arbeitnow'], default: 'manual' },
  externalId: { type: String, index: true, sparse: true, unique: true }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
