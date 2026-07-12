import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { env } from '../config/env.js';

// Gates company-prep content: allowed during the 7-day trial window,
// with an active subscription, or always for admins.
export async function requireTrialOrSubscription(req, res, next) {
  try {
    if (req.user.role === 'admin') return next();

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ code: 'NO_USER' });

    const trialEnd = new Date(user.trialStartedAt);
    trialEnd.setDate(trialEnd.getDate() + env.trialDays);
    const inTrial = new Date() <= trialEnd;

    if (inTrial) return next();

    const sub = await Subscription.findOne({ userId: user._id, status: 'active' });
    if (sub && sub.currentPeriodEnd > new Date()) return next();

    return res.status(403).json({
      code: 'TRIAL_EXPIRED',
      message: 'Your free trial has ended. Subscribe to keep access to company prep.'
    });
  } catch (err) {
    next(err);
  }
}

// Gates the AI agent: subscription only for regular users. Admins always
// have access — no need to "subscribe" to your own product to test or
// demo the AI features.
export async function requireActiveSubscription(req, res, next) {
  try {
    if (req.user.role === 'admin') return next();

    const sub = await Subscription.findOne({ userId: req.user.id, status: 'active' });
    if (sub && sub.currentPeriodEnd > new Date()) return next();
    return res.status(403).json({
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'The AI agent is a subscriber feature. Choose a plan to unlock it.'
    });
  } catch (err) {
    next(err);
  }
}