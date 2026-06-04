const loadScript = () =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export async function openPayment({ amount, clientName, clientEmail = '', clientPhone = '', description, notes = {}, onSuccess, onDismiss }) {
  const loaded = await loadScript();
  if (!loaded) {
    alert('Could not load Razorpay. Check your internet connection.');
    return;
  }

  // Key priority: Settings page → .env → placeholder
  let key = 'rzp_test_YOUR_KEY_HERE';
  try {
    const s = JSON.parse(localStorage.getItem('ca_settings') || '{}');
    key = s.razorpayKey || process.env.REACT_APP_RAZORPAY_KEY || key;
  } catch { key = process.env.REACT_APP_RAZORPAY_KEY || key; }

  const options = {
    key,
    amount: amount * 100,        // paise
    currency: 'INR',
    name: 'CAPortal',
    description,
    image: '',
    prefill: { name: clientName, email: clientEmail, contact: clientPhone },
    notes,
    theme: { color: '#5b8af5' },
    handler(response) {
      onSuccess?.({
        paymentId: response.razorpay_payment_id,
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
