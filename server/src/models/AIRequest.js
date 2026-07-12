import mongoose from 'mongoose';

const aiRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['resume_edit', 'cover_letter', 'cold_email', 'linkedin_referral'], required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  input: { type: String },
  output: { type: String },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' }
}, { timestamps: true });

export default mongoose.model('AIRequest', aiRequestSchema);
