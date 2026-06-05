export const generateToken = () => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
};

export const getPortalUrl = (token) => {
  const base = window.location.origin + window.location.pathname;
  return `${base}?portal=${token}`;
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
