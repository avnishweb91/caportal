import { payClientFee } from '../clientPayments';
import { openPayment } from '../razorpay';
import { createPortalFeeOrder, verifyPortalFeePayment } from '../supabase';

jest.mock('../razorpay', () => ({ openPayment: jest.fn() }));
jest.mock('../supabase', () => ({
  createPortalFeeOrder: jest.fn(),
  verifyPortalFeePayment: jest.fn(),
}));

const client = { portalToken: 'token', name: 'Pramod', email: 'pramod@example.com', feeAmount: 100, type: 'ITR-1' };

beforeEach(() => {
  openPayment.mockReset();
  createPortalFeeOrder.mockReset();
  verifyPortalFeePayment.mockReset();
});

test('opens Razorpay with the server-created order and only reports success after server verification', async () => {
  createPortalFeeOrder.mockResolvedValue({
    data: { orderId: 'order_123', amount: 10000, currency: 'INR', keyId: 'rzp_live_public' }, error: null,
  });
  verifyPortalFeePayment.mockResolvedValue({ data: { verified: true, client: { id: 7, feePaid: true } }, error: null });
  const success = jest.fn();

  await payClientFee(client, success, jest.fn());

  expect(openPayment).toHaveBeenCalledWith(expect.objectContaining({
    key: 'rzp_live_public', amount: 100, orderId: 'order_123', clientName: 'Pramod',
  }));
  expect(success).not.toHaveBeenCalled();
  const checkout = openPayment.mock.calls[0][0];
  await checkout.onSuccess({ orderId: 'order_123', paymentId: 'pay_123', signature: 'sig' });
  expect(verifyPortalFeePayment).toHaveBeenCalledWith('token', {
    orderId: 'order_123', paymentId: 'pay_123', signature: 'sig',
  });
  expect(success).toHaveBeenCalledWith({ id: 7, feePaid: true }, expect.any(Object));
});

test('does not open Checkout when the CA has not configured Route', async () => {
  const dismiss = jest.fn();
  createPortalFeeOrder.mockResolvedValue({ data: null, error: 'Your CA has not finished setting up Razorpay payments.' });

  await payClientFee(client, jest.fn(), dismiss);

  expect(openPayment).not.toHaveBeenCalled();
  expect(dismiss).toHaveBeenCalledWith(expect.stringContaining('CA has not finished'));
});

test('rejects a server order whose amount does not match the CA fee', async () => {
  const dismiss = jest.fn();
  createPortalFeeOrder.mockResolvedValue({
    data: { orderId: 'order_bad', amount: 5000, currency: 'INR', keyId: 'rzp_test_public' }, error: null,
  });

  await payClientFee(client, jest.fn(), dismiss);

  expect(openPayment).not.toHaveBeenCalled();
  expect(dismiss).toHaveBeenCalledWith(expect.stringContaining('invalid payment order'));
});
