import { getBillingStatus, ensureTrialStart, activatePlan, cancelPlan, PLANS } from '../billing';

jest.mock('../razorpay', () => ({ openPayment: jest.fn() }));
jest.mock('../supabase', () => ({ supabase: null }));

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const daysAhead = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
const setBilling = (data) => localStorage.setItem('ca_billing', JSON.stringify(data));

beforeEach(() => localStorage.clear());

// ── Trial status ──────────────────────────────────────────────────────────────

describe('getBillingStatus — trial', () => {
  test('no stored data → 14 days left, not blocked', () => {
    const s = getBillingStatus();
    expect(s.plan).toBe('trial');
    expect(s.isTrialing).toBe(true);
    expect(s.daysLeft).toBe(14);
    expect(s.isHardBlocked).toBe(false);
  });
  test('fresh trial → 14 days left', () => {
    setBilling({ trialStart: daysAgo(0) });
    const s = getBillingStatus();
    expect(s.daysLeft).toBe(14);
    expect(s.isExpired).toBe(false);
  });
  test('5 days in → 9 days left', () => {
    setBilling({ trialStart: daysAgo(5) });
    const s = getBillingStatus();
    expect(s.daysLeft).toBe(9);
  });
  test('14 days in → expired but not hard-blocked', () => {
    setBilling({ trialStart: daysAgo(14) });
    const s = getBillingStatus();
    expect(s.isExpired).toBe(true);
    expect(s.isHardBlocked).toBe(false);
    expect(s.daysLeft).toBe(0);
  });
  test('17 days in → hard-blocked (trial + 3 grace days)', () => {
    setBilling({ trialStart: daysAgo(17) });
    expect(getBillingStatus().isHardBlocked).toBe(true);
  });
  test('trial client limit is 30', () => {
    expect(getBillingStatus().clientLimit).toBe(30);
  });
});

// ── Paid plan status ──────────────────────────────────────────────────────────

describe('getBillingStatus — paid plan', () => {
  test('active plan → isPaid=true, isTrialing=false', () => {
    setBilling({ plan: 'pro', planExpiry: daysAhead(20) });
    const s = getBillingStatus();
    expect(s.isPaid).toBe(true);
    expect(s.isTrialing).toBe(false);
    expect(s.plan).toBe('pro');
  });
  test('daysLeft calculated correctly', () => {
    setBilling({ plan: 'starter', planExpiry: daysAhead(10) });
    const s = getBillingStatus();
    expect(s.daysLeft).toBe(10);
  });
  test('expired plan falls back to trial logic', () => {
    setBilling({ plan: 'starter', planExpiry: daysAgo(1), trialStart: daysAgo(3) });
    const s = getBillingStatus();
    expect(s.isTrialing).toBe(true);
  });
  test('pro plan has clientLimit 100', () => {
    setBilling({ plan: 'pro', planExpiry: daysAhead(20) });
    expect(getBillingStatus().clientLimit).toBe(100);
  });
  test('firm plan has no clientLimit', () => {
    setBilling({ plan: 'firm', planExpiry: daysAhead(20) });
    expect(getBillingStatus().clientLimit).toBeNull();
  });
});

// ── ensureTrialStart ──────────────────────────────────────────────────────────

describe('ensureTrialStart', () => {
  test('sets trialStart if not present', () => {
    ensureTrialStart({});
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    expect(data.trialStart).toBeTruthy();
  });
  test('does not overwrite existing trialStart', () => {
    const original = daysAgo(5);
    setBilling({ trialStart: original });
    ensureTrialStart({});
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    expect(data.trialStart).toBe(original);
  });
});

// ── activatePlan / cancelPlan ─────────────────────────────────────────────────

describe('activatePlan', () => {
  test('stores plan, expiry, and payment record', () => {
    activatePlan('starter', 'pay_001', 799);
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    expect(data.plan).toBe('starter');
    expect(data.planExpiry).toBeTruthy();
    expect(data.payments[0].id).toBe('pay_001');
    expect(data.payments[0].amount).toBe(799);
  });
  test('plan expiry is ~30 days from now', () => {
    activatePlan('pro', 'pay_002', 1799);
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    const expiry = new Date(data.planExpiry);
    const daysOut = Math.round((expiry - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysOut).toBeGreaterThanOrEqual(29);
    expect(daysOut).toBeLessThanOrEqual(31);
  });
  test('accumulates multiple payment records', () => {
    activatePlan('starter', 'pay_001', 799);
    activatePlan('pro',     'pay_002', 1799);
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    expect(data.payments).toHaveLength(2);
  });
});

describe('cancelPlan', () => {
  test('removes plan and expiry but preserves payment history', () => {
    activatePlan('pro', 'pay_003', 1799);
    cancelPlan();
    const data = JSON.parse(localStorage.getItem('ca_billing'));
    expect(data.plan).toBeUndefined();
    expect(data.planExpiry).toBeUndefined();
    expect(data.payments).toHaveLength(1);
  });
});

// ── PLANS constants ───────────────────────────────────────────────────────────

describe('PLANS', () => {
  test('starter: ₹799, 30 clients', () => {
    expect(PLANS.starter.price).toBe(799);
    expect(PLANS.starter.clientLimit).toBe(30);
  });
  test('pro: ₹1799, 100 clients', () => {
    expect(PLANS.pro.price).toBe(1799);
    expect(PLANS.pro.clientLimit).toBe(100);
  });
  test('firm: ₹3499, unlimited clients', () => {
    expect(PLANS.firm.price).toBe(3499);
    expect(PLANS.firm.clientLimit).toBeNull();
  });
  test('all plans have features array', () => {
    Object.values(PLANS).forEach(p => {
      expect(Array.isArray(p.features)).toBe(true);
      expect(p.features.length).toBeGreaterThan(0);
    });
  });
});
