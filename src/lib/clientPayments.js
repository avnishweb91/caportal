import { openPayment } from './razorpay';
import { createPortalFeeOrder, verifyPortalFeePayment } from './supabase';

export const payClientFee = async (client, onSuccess, onDismiss) => {
  let result;
  try {
    result = await createPortalFeeOrder(client.portalToken);
  } catch (error) {
    onDismiss?.(error?.message || 'Could not contact the secure payment service. Try again.');
    return;
  }
  const { data: order, error } = result;
  if (error || !order?.orderId) {
    onDismiss?.(error || 'Could not start secure checkout.');
    return;
  }
  if (!order.keyId || !/^rzp_(test|live)_/.test(order.keyId)
    || order.currency !== 'INR' || Number(order.amount) !== Math.round(Number(client.feeAmount) * 100)) {
    onDismiss?.('Razorpay returned an invalid payment order. Contact your CA before retrying.');
    return;
  }

  await openPayment({
    key: order.keyId,
    amount: Number(order.amount) / 100,
    orderId: order.orderId,
    clientName: client.name || 'Client',
    clientEmail: client.email || '',
    clientPhone: client.phone || '',
    description: `Professional fee · ${client.type || 'Tax filing'}`,
    onSuccess: async payment => {
      try {
        const verification = await verifyPortalFeePayment(client.portalToken, payment);
        if (verification.error || !verification.data?.verified || !verification.data?.client) {
          onDismiss?.(verification.error || 'Payment confirmation could not be verified. Contact your CA with the Razorpay payment ID.');
          return;
        }
        onSuccess?.(verification.data.client, payment);
      } catch (verifyError) {
        onDismiss?.(verifyError?.message || 'Payment was submitted but confirmation could not be checked. Contact your CA with the Razorpay payment ID.');
      }
    },
    onDismiss,
  });
};
