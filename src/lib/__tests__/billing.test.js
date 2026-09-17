import { getBillingStatus, ensureTrialStart, activatePlan, cancelPlan, PLANS, payForPlan } from '../billing';
import { openPayment } from '../razorpay';
import { supabase } from '../supabase';

jest.mock('../razorpay', () => ({ openPayment: jest.fn() }));
jest.mock('../supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const daysAhead = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
const setBilling = (data) => localStorage.setItem('ca_billing', JSON.stringify(data));

beforeEach(() => {
  localStorage.clear();
  openPayment.mockReset();
  supabase.functions.invoke.mockReset();
});

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

describe('payForPlan', () => {
  test('does not open checkout if server order creation fails', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: { message: 'Function unavailable' } });
    const dismissed = jest.fn();
    await payForPlan('starter', 'CA', 'ca@example.com', jest.fn(), dismissed);
    expect(openPayment).not.toHaveBeenCalled();
    expect(dismissed).toHaveBeenCalledWith('Function unavailable');
    expect(JSON.parse(localStorage.getItem('ca_billing') || '{}').plan).toBeUndefined();
  });

  test('opens checkout using the exact server key and server-created order amount', async () => {
    supabase.functions.invoke
      .mockResolvedValueOnce({ data: { orderId: 'order_123', amount: 79900, currency: 'INR', keyId: 'rzp_live_caportal' }, error: null })
      .mockResolvedValueOnce({ data: { verified: true, plan: 'starter', planExpiry: '2030-01-01T00:00:00.000Z' }, error: null });
    const success = jest.fn();

    await payForPlan('starter', 'CA Raj', 'raj@example.com', success, jest.fn());

    expect(openPayment).toHaveBeenCalledWith(expect.objectContaining({
      key: 'rzp_live_caportal', orderId: 'order_123', amount: 799,
    }));
    expect(supabase.functions.invoke).toHaveBeenNthCalledWith(1, 'subscription-payment', {
      body: { action: 'create_order', planId: 'starter' },
    });
  });

  test('rejects a server order whose mode, currency, or amount does not match the plan', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { orderId: 'order_bad', amount: 100, currency: 'INR', keyId: 'rzp_test_example' }, error: null,
    });
    const dismissed = jest.fn();
    await payForPlan('starter', 'CA', 'ca@example.com', jest.fn(), dismissed);
    expect(openPayment).not.toHaveBeenCalled();
    expect(dismissed).toHaveBeenCalledWith(expect.stringContaining('invalid order configuration'));
  });
});
