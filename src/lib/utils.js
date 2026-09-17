export const generateToken = () => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
};

export const getPortalUrl = (token) => {
  const base = window.location.origin + window.location.pathname;
  return `${base}?portal=${token}`;
};

export const normalizeWhatsAppNumber = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
};

export const getWhatsAppUrl = (phone, message = '') => {
  const number = normalizeWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
};

export const buildClientReminderMessage = (client, { caName = '', documentName = '' } = {}) => {
  const firstName = String(client?.name || 'there').trim().split(/\s+/)[0];
  const missing = (client?.documents || []).filter(doc => !doc.uploaded).map(doc => doc.name);
  const requested = documentName ? [documentName] : missing;
  const portalUrl = getPortalUrl(client?.portalToken || '');
  const greeting = caName ? `Hello ${firstName}, this is CA ${caName}.` : `Hello ${firstName}, this is your CA.`;
  const request = requested.length
    ? `Please upload ${requested.join(', ')} using your secure client portal:`
    : 'Please open your secure client portal to review your documents:';
  return `${greeting}\n${request}\n${portalUrl}`;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};

export const getProfile = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('ca_auth') || '{}');
    const extra = JSON.parse(localStorage.getItem('ca_profile') || '{}');
    return { ...auth, ...extra };
  } catch { return {}; }
};

export const getSettings = () => {
  try { return JSON.parse(localStorage.getItem('ca_settings') || '{}'); }
  catch { return {}; }
};
