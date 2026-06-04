import { openPayment } from './razorpay';
import { supabase } from './supabase';

export const PLANS = {
  starter: {
    id: 'starter', name: 'Starter', price: 799,
    clientLimit: 30, period: 'month',
    features: ['Document portal', 'WhatsApp reminders', 'Filing status tracker', 'ITR/GST deadline calendar', 'Email support'],
  },
  pro: {
    id: 'pro', name: 'Pro', price: 1799,
    clientLimit: 100, period: 'month',
    features: ['Everything in Starter', 'Draft return approval flow', 'Fee invoicing + UPI payments', 'Practice analytics dashboard', 'Priority support'],
  },
  firm: {
    id: 'firm', name: 'Firm', price: 3499,
    clientLimit: null, period: 'month',
    features: ['Everything in Pro', 'Multi-CA staff accounts', 'Custom branding & white-label', 'API access', 'Dedicated account manager'],
  },
};

const TRIAL_DAYS = 14;
const GRACE_DAYS = 3; // extra days after trial before hard block

// ── Storage helpers ──────────────────────────────────────────────────────
const getBillingData = () => {
  try { return JSON.parse(localStorage.getItem('ca_billing') || '{}'); }
  catch { return {}; }
};

const saveBillingData = (data) => {
  localStorage.setItem('ca_billing', JSON.stringify(data));
};

// ── Trial start ──────────────────────────────────────────────────────────
export const ensureTrialStart = (user) => {
  const data = getBillingData();
  if (!data.trialStart) {
    saveBillingData({ ...data, trialStart: new Date().toISOString() });
  }
};

// ── Status ───────────────────────────────────────────────────────────────
export const getBillingStatus = () => {
  const data = getBillingData();

  // Active paid plan
  if (data.plan && data.planExpiry) {
    const expiry = new Date(data.planExpiry);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft > 0) {
      return {
        plan: data.plan,
        planName: PLANS[data.plan]?.name || data.plan,
        isTrialing: false,
        isPaid: true,
        daysLeft,
        isExpired: false,
        needsPlan: false,
        clientLimit: PLANS[data.plan]?.clientLimit ?? null,
        payments: data.payments || [],
        planExpiry: data.planExpiry,
      };
    }
  }

  // Trial
  const trialStart = data.trialStart ? new Date(data.trialStart) : new Date();
  const now = new Date();
  const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceStart);
  const graceDaysLeft = Math.max(0, TRIAL_DAYS + GRACE_DAYS - daysSinceStart);
  const isExpired = daysSinceStart >= TRIAL_DAYS;
  const isHardBlocked = daysSinceStart >= TRIAL_DAYS + GRACE_DAYS;

  return {
    plan: 'trial',
    planName: 'Free trial',
    isTrialing: true,
    isPaid: false,
    daysLeft: trialDaysLeft,
    graceDaysLeft,
    isExpired,
    isHardBlocked,
    needsPlan: isExpired,
    clientLimit: 30,
    payments: data.payments || [],
    planExpiry: null,
    daysSinceStart,
  };
};

// ── Activate plan after payment ──────────────────────────────────────────
export const activatePlan = (planId, paymentId, amount) => {
  const data = getBillingData();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const payment = {
    id: paymentId || 'manual_' + Date.now(),
    plan: planId,
    amount,
    date: new Date().toISOString(),
  };

  saveBillingData({
    ...data,
    plan: planId,
    planExpiry: expiry.toISOString(),
    payments: [payment, ...(data.payments || [])],
  });
};

// ── Cancel / reset ───────────────────────────────────────────────────────
export const cancelPlan = () => {
  const data = getBillingData();
  const { plan: _, planExpiry: __, ...rest } = data;
  saveBillingData(rest);
};

// ── Sync plan from Supabase → localStorage (called on login) ─────────────
export const syncPlanFromSupabase = async () => {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('plan, plan_expiry, trial_start')
      .eq('id', user.id)
      .single();
    if (!data) return;

    const stored = getBillingData();
    // Supabase is source of truth — overwrite localStorage
    saveBillingData({
      ...stored,
      ...(data.trial_start ? { trialStart: data.trial_start } : {}),
      ...(data.plan && data.plan !== 'trial' ? {
        plan:        data.plan,
        planExpiry:  data.plan_expiry,
      } : {}),
    });
  } catch (e) {
    console.warn('Could not sync plan from Supabase:', e.message);
  }
};

// ── Push plan activation to Supabase (after client-side payment success) ──
const pushPlanToSupabase = async (planId, expiry) => {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      plan:        planId,
      plan_expiry: expiry,
    }).eq('id', user.id);
  } catch (e) {
    console.warn('Could not push plan to Supabase:', e.message);
  }
};

// ── Payment flow ─────────────────────────────────────────────────────────
export const payForPlan = async (planId, caName, caEmail, onSuccess, onDismiss) => {
  const plan = PLANS[planId];
  if (!plan) return;

  await openPayment({
    amount:       plan.price,
    clientName:   caName  || 'CAPortal User',
    clientEmail:  caEmail || '',
    description:  `CAPortal ${plan.name} Plan — Monthly Subscription`,
    notes: { planId, caEmail: caEmail || '' }, // webhook reads these
    onSuccess: (resp) => {
      activatePlan(planId, resp.paymentId, plan.price);
      // Also push to Supabase immediately (webhook is backup)
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      pushPlanToSupabase(planId, expiry.toISOString());
      onSuccess?.(planId, resp);
    },
    onDismiss,
  });
};
