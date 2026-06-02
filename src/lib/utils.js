export const generateToken = () =>
  Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11);

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
