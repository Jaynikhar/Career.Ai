import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  provider: { type: String, enum: ['stripe'], default: 'stripe' },
  providerPaymentId: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['succeeded', 'failed', 'refunded'], default: 'succeeded' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);