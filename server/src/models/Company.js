import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['MNC', 'Service-based', 'Product-based', 'FAANG', 'Startup'], required: true },
  logoUrl: { type: String },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
