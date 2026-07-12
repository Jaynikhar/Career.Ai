import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';

export default function Subscription() {
  const [plans, setPlans] = useState({});
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh() {
    api.get('/subscriptions/plans').then((d) => setPlans(d.plans));
    api.get('/subscriptions/status').then((d) => setStatus(d.subscription));
  }

  useEffect(refresh, []);

  async function choose(plan) {
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/subscriptions/checkout', { plan });
      if (result.url) {
        // Real Stripe Checkout — leave the app and go to Stripe's hosted page.
        window.location.href = result.url;
        return;
      }
      // Simulated checkout (no Stripe key configured) — already activated.
      refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="main">
      <p className="muted" style={{ marginBottom: 16 }}>Unlock full company prep and the AI agent.</p>
      {error && <p className="error-text">{error}</p>}

      {status?.status === 'active' && (
        <div className="banner">
          <CheckCircle2 aria-hidden="true" />
          You're on the {status.plan} plan, active until {new Date(status.currentPeriodEnd).toLocaleDateString()}.
        </div>
      )}

      <div className="grid grid-2">
        {Object.entries(plans).map(([key, plan]) => {
          const active = status?.status === 'active' && status.plan === key;
          return (
            <div className={`card${key === 'yearly' ? ' raised' : ''}`} key={key} style={key === 'yearly' ? { border: '2px solid var(--accent)' } : undefined}>
              {key === 'yearly' && <span className="pill gold" style={{ marginBottom: 10 }}>Best value</span>}
              <h3>{plan.label}</h3>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, margin: '6px 0' }}>
                ${(plan.priceCents / 100).toFixed(0)}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>
                  /{key === 'monthly' ? 'mo' : 'yr'}
                </span>
              </p>
              <p className="muted" style={{ marginBottom: 16 }}>Full company prep and AI agent access.</p>
              <button className="btn gold" style={{ width: '100%' }} disabled={busy || active} onClick={() => choose(key)}>
                {active ? 'Current plan' : `Choose ${plan.label.toLowerCase()}`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 16 }}>
        This demo simulates checkout instantly. Wire up services/payment/stripe.service.js on the backend for real billing.
      </p>
    </div>
  );
}
