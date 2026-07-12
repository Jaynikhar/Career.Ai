import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  type: { type: String, enum: ['OA', 'Technical', 'HR'], required: true },
  year: { type: Number },
  content: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  tags: [{ type: String }],
  // Set when the question was written by the AI generation worker rather
  // than entered manually, so admins can filter/audit generated content.
  source: { type: String, enum: ['manual', 'ai_generated'], default: 'manual' }
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
