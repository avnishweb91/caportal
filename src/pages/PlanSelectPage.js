import { useState } from 'react';
import { PLANS, payForPlan } from '../lib/billing';
import './PlanSelectPage.css';

export default function PlanSelectPage({ billing, user, onActivate, onLogout }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleSelect = async (planId) => {
    setError('');
    setLoading(planId);
    await payForPlan(
      planId,
      user?.name,
      user?.email,
      (pid) => { setLoading(null); onActivate(pid); },
      (msg) => {
        setLoading(null);
        if (msg) setError(msg);
      }
    );
    setLoading(null);
  };

  return (
    <div className="plan-page">
      {/* Top bar */}
      <div className="plan-topbar">
        <div className="plan-logo">
          <div className="plan-logo-box">CA</div>
          CAPortal
        </div>
        <button className="plan-logout" onClick={onLogout}>Sign out</button>
      </div>

      <div className="plan-content">
        {/* Header */}
        <div className="plan-header">
          {billing.isTrialing && billing.daysLeft === 0 ? (
            <>
              <div className="plan-badge plan-badge-expired">⏰ Free trial ended</div>
              {billing.graceDaysLeft > 0 && (
                <p className="plan-grace">
                  You have <strong>{billing.graceDaysLeft} grace day{billing.graceDaysLeft !== 1 ? 's' : ''}</strong> left — subscribe now to keep your clients and data.
                </p>
              )}
            </>
          ) : (
            <div className="plan-badge plan-badge-trial">
              ✓ {billing.daysLeft} day{billing.daysLeft !== 1 ? 's' : ''} left in free trial
            </div>
          )}
          <h1 className="plan-title">Choose your plan</h1>
          <p className="plan-sub">All plans include a 14-day free trial. Cancel anytime. Billed monthly.</p>
        </div>

        {error && (
          <div className="plan-error">{error}</div>
        )}

        {/* Plan cards */}
        <div className="plan-grid">
          {Object.values(PLANS).map((plan) => {
            const isPopular = plan.id === 'pro';
            const isLoading = loading === plan.id;
            return (
              <div key={plan.id} className={`plan-card ${isPopular ? 'plan-card-highlight' : ''}`}>
                {isPopular && <div className="plan-popular">Most popular</div>}
                <div className="plan-card-name">{plan.name}</div>
                <div className="plan-card-price">
                  <span className="plan-price-currency">₹</span>
                  <span className="plan-price-amount">{plan.price.toLocaleString()}</span>
                  <span className="plan-price-period">/month</span>
                </div>
                <div className="plan-card-limit">
                  {plan.clientLimit ? `Up to ${plan.clientLimit} clients` : 'Unlimited clients'}
                </div>
                <div className="plan-card-divider" />
                <div className="plan-card-features">
                  {plan.features.map(f => (
                    <div key={f} className="plan-feature">
                      <span className="plan-check">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  className={`btn btn-lg plan-cta ${isPopular ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleSelect(plan.id)}
                  disabled={!!loading}
                >
                  {isLoading
                    ? <span className="plan-spinner" />
                    : `Subscribe — ₹${plan.price.toLocaleString()}/mo`}
                </button>
                <p className="plan-cta-sub">Pay securely via UPI or card · Cancel anytime</p>
              </div>
            );
          })}
        </div>

        {/* Reassurance */}
        <div className="plan-footer">
          <div className="plan-reassurance">
            {[
              ['🔒', 'Secure payment via Razorpay'],
              ['↩', 'Cancel anytime, no questions asked'],
              ['📦', 'Your data is safe — always exportable'],
              ['💬', 'Questions? support@caportal.co'],
            ].map(([icon, text]) => (
              <div key={text} className="plan-reassurance-item">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
