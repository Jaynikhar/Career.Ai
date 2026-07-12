import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: {
    type: String,
    enum: ['Applied', 'ResponseReceived', 'Interviewing', 'OfferReceived', 'Rejected'],
    default: 'Applied'
  },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);
