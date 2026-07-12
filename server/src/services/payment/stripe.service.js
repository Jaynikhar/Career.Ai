import Stripe from 'stripe';
import { env } from '../../config/env.js';

let stripeClient = null;

function getStripe() {
  if (!env.stripeSecretKey) return null;
  if (!stripeClient) stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(env.stripeSecretKey);
}

const PLAN_INTERVALS = { monthly: 'month', yearly: 'year' };

// Creates a Stripe Checkout Session using inline price data — no need to
// pre-create Product/Price objects in the Stripe dashboard.
export async function createCheckoutSession({ userId, userEmail, plan, priceCents, planLabel }) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: userEmail,
    client_reference_id: String(userId),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: priceCents,
          recurring: { interval: PLAN_INTERVALS[plan] },
          product_data: { name: `CareerPrep AI — ${planLabel} plan` }
        }
      }
    ],
    metadata: { userId: String(userId), plan },
    success_url: `${env.clientOrigin}/subscription?success=true`,
    cancel_url: `${env.clientOrigin}/subscription?canceled=true`
  });
}

export function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

export async function retrieveStripeSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}