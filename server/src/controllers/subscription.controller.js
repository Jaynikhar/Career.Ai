import Subscription from '../models/Subscription.js';
import { isStripeConfigured, createCheckoutSession } from '../services/payment/stripe.service.js';
import User from '../models/User.js';

const PLANS = {
  monthly: { label: 'Monthly', priceCents: 1200, durationDays: 30 },
  yearly: { label: 'Yearly', priceCents: 9600, durationDays: 365 }
};

export function listPlans(req, res) {
  res.json({ plans: PLANS });
}

// Uses real Stripe Checkout if STRIPE_SECRET_KEY is set; otherwise falls
// back to instantly activating a subscription so the rest of the app is
// still testable without a Stripe account.
export async function checkout(req, res, next) {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ code: 'INVALID_PLAN', message: 'Choose monthly or yearly.' });

    if (isStripeConfigured()) {
      const user = await User.findById(req.user.id);
      const session = await createCheckoutSession({
        userId: req.user.id,
        userEmail: user.email,
        plan,
        priceCents: PLANS[plan].priceCents,
        planLabel: PLANS[plan].label
      });
      return res.json({ url: session.url });
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + PLANS[plan].durationDays);

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, plan, status: 'active', provider: 'simulated', currentPeriodEnd: periodEnd },
      { upsert: true, new: true }
    );

    res.json({ subscription, note: 'Simulated checkout — set STRIPE_SECRET_KEY for real billing.' });
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      { cancelAtPeriodEnd: true },
      { new: true }
    );
    res.json({ subscription });
  } catch (err) { next(err); }
}

export async function status(req, res, next) {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    res.json({ subscription: subscription || null });
  } catch (err) { next(err); }
}