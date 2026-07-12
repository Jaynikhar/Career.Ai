import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  trialStartedAt: { type: Date, default: Date.now },
  refreshTokenHash: { type: String, default: null },
  lastLoginAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
