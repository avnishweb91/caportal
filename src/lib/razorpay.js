const loadScript = () =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export async function openPayment({ amount, orderId, clientName, clientEmail = '', clientPhone = '', description, notes = {}, onSuccess, onDismiss }) {
  const loaded = await loadScript();
  if (!loaded) {
    alert('Could not load Razorpay. Check your internet connection.');
    return;
  }

  const key = process.env.REACT_APP_RAZORPAY_KEY || '';
  if (!key || key.includes('YOUR_KEY_HERE')) {
    onDismiss?.('Razorpay is not configured for subscriptions.');
    return;
  }

  const options = {
    key,
    amount: amount * 100,        // paise
    currency: 'INR',
    order_id: orderId,
    name: 'CAPortal',
    description,
    image: '',
    prefill: { name: clientName, email: clientEmail, contact: clientPhone },
    notes,
    theme: { color: '#5b8af5' },
    handler(response) {
      onSuccess?.({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
        amount,
        clientName,
      });
    },
    modal: {
      ondismiss() { onDismiss?.(); },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', e => {
    console.error('Razorpay payment failed', e.error);
    onDismiss?.('Payment failed: ' + e.error.description);
  });
  rzp.open();
}
