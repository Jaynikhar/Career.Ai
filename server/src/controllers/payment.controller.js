import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import { constructWebhookEvent, retrieveStripeSubscription } from '../services/payment/stripe.service.js';

// Stripe calls this directly — never trust the payload without verifying
// the signature first, or anyone could POST a fake "payment succeeded".
export async function handleWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (!userId || !session.subscription) break;

        const stripeSub = await retrieveStripeSubscription(session.subscription);
        const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

        const subscription = await Subscription.findOneAndUpdate(
          { userId },
          {
            userId,
            plan,
            status: 'active',
            provider: 'stripe',
            providerSubscriptionId: stripeSub.id,
            currentPeriodEnd,
            cancelAtPeriodEnd: false
          },
          { upsert: true, new: true }
        );

        await Payment.create({
          userId,
          subscriptionId: subscription._id,
          provider: 'stripe',
          providerPaymentId: session.payment_intent || session.id,
          amount: session.amount_total,
          currency: session.currency,
          status: 'succeeded'
        });
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object;
        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: stripeSub.id },
          {
            status: stripeSub.status === 'active' ? 'active' : 'past_due',
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: stripeSub.id },
          { status: 'canceled' }
        );
        break;
      }

      default:
        break; // ignore other event types
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ code: 'WEBHOOK_HANDLER_ERROR' });
  }
}