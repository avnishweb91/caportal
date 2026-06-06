import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = (url && key && !url.includes('PASTE')) ? createClient(url, key) : null;
export const isSupabaseReady = () => !!supabase;

// ── Auth ──────────────────────────────────────────────────────────────────
export const supabaseSignIn = async (email, password) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithPassword({ email, password });
};

export const supabaseSignUp = async (email, password, name) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signUp({ email, password, options: { data: { name } } });
};

export const supabaseSignOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const supabaseGetUser = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

export const supabaseResetPassword = async (email) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
};

export const supabaseUpdatePassword = async (newPassword) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.updateUser({ password: newPassword });
};

// ── Storage ───────────────────────────────────────────────────────────────
const BUCKET = 'ca-documents';

const safeName = (str) => str.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();

// Upload a document as an authenticated CA
// Path: {ca_id}/{client_id}/{safe_doc_name}_{timestamp}.{ext}
export const uploadDocument = async (file, caId, clientId, docName) => {
  if (!supabase) return { error: 'Supabase not configured', url: null };
  const ext  = file.name.split('.').pop();
  const path = `${caId}/${clientId}/${safeName(docName)}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) return { error: error.message, url: null };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { error: null, url: data.publicUrl, path };
};

// Upload a document from the client portal (unauthenticated)
// Path: portal/{portal_token}/{safe_doc_name}_{timestamp}.{ext}
export const uploadPortalDocument = async (file, portalToken, docName) => {
  if (!supabase) return { error: 'Supabase not configured', url: null };
  const ext  = file.name.split('.').pop();
  const path = `portal/${portalToken}/${safeName(docName)}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) return { error: error.message, url: null };
  return { error: null, path };
};

// Get a signed URL so the CA can view a document (valid for 1 hour)
export const getDocumentUrl = async (path) => {
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
};
