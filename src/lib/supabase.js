import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = (url && key && !url.includes('PASTE')) ? createClient(url, key) : null;
export const isSupabaseReady = () => !!supabase;

export const clientFromRow = (row) => {
  const data = row.data || {};
  return {
    ...data,
    id: row.id,
    portalToken: row.portal_token,
    name: row.name,
    pan: row.pan,
    phone: row.phone || '',
    email: row.email || '',
    type: row.type || 'ITR-1',
    plan: row.plan || 'Starter',
    status: row.status || 'waiting_docs',
    feeAmount: row.fee_amount || 0,
    feePaid: !!row.fee_paid,
    feePaymentStatus: row.fee_payment_status || (row.fee_paid ? 'paid' : 'pending'),
    docsReceived: row.docs_received || 0,
    docsTotal: row.docs_total || 0,
    documents: data.documents || [],
    timeline: data.timeline || [],
    acknowledgments: data.acknowledgments || [],
  };
};

export const clientToRow = (client, caId) => ({
  ca_id: caId,
  name: client.name,
  pan: client.pan,
  phone: client.phone || null,
  email: client.email || null,
  type: client.type || 'ITR-1',
  plan: client.plan || 'Starter',
  status: client.status || 'waiting_docs',
  fee_amount: Number(client.feeAmount) || 0,
  fee_paid: !!client.feePaid,
  fee_payment_status: client.feePaid ? 'paid' : (client.feePaymentStatus || 'pending'),
  docs_total: client.docsTotal ?? client.documents?.length ?? 0,
  docs_received: client.docsReceived ?? client.documents?.filter(d => d.uploaded).length ?? 0,
  portal_token: client.portalToken,
  data: client,
});

export const loadClients = async (caId) => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('clients').select('*').eq('ca_id', caId).order('created_at');
  return { data: data?.map(clientFromRow) || null, error: error?.message || null };
};

export const saveClients = async (caId, clients) => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const saved = [];
  for (const client of clients) {
    const { data, error } = await supabase.from('clients')
      .upsert(clientToRow(client, caId), { onConflict: 'portal_token' })
      .select('*').single();
    if (error) return { data: null, error: error.message };
    saved.push(clientFromRow(data));
  }
  return { data: saved, error: null };
};

export const deleteClient = async (caId, portalToken) => {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('clients').delete().eq('ca_id', caId).eq('portal_token', portalToken);
  return { error: error?.message || null };
};

export const deleteAllClients = async (caId) => {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('clients').delete().eq('ca_id', caId);
  return { error: error?.message || null };
};

export const loadPortalClient = async (token) => {
  if (!supabase) return { data: null, error: 'Portal service unavailable' };
  const { data, error } = await supabase.functions.invoke('client-portal', { body: { action: 'get', token } });
  return { data: data?.client || null, error: error?.message || data?.error || null };
};

export const reportPortalPayment = async (token) => {
  if (!supabase) return { error: 'Portal service unavailable' };
  const { data, error } = await supabase.functions.invoke('client-portal', { body: { action: 'report_payment', token } });
  return { data, error: error?.message || data?.error || null };
};

export const uploadPortalDocument = async (file, portalToken, docName) => {
  if (!supabase) return { error: 'Supabase not configured', path: null };
  const { data: { session } } = await supabase.auth.getSession();
  const form = new FormData();
  form.append('action', 'upload');
  form.append('token', portalToken);
  form.append('docName', docName);
  form.append('file', file);
  try {
    const response = await fetch(`${url}/functions/v1/client-portal`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${session?.access_token || key}`,
      },
      body: form,
    });
    const result = await response.json();
    return response.ok
      ? { error: null, path: result.path, fileInfo: result.fileInfo, client: result.client }
      : { error: result.error || 'Upload failed', path: null };
  } catch (error) {
    return { error: error.message || 'Upload failed', path: null };
  }
};

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

export const supabaseUpdateProfile = async (updates) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'Not logged in' } };
  return supabase.from('profiles').update(updates).eq('id', user.id);
};

export const syncProfileFromSupabase = async () => {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('name, firm_name, city, phone, membership_no')
      .eq('id', user.id)
      .single();
    return data || null;
  } catch { return null; }
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

// Get a signed URL so the CA can view a document (valid for 1 hour)
export const getDocumentUrl = async (path) => {
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
};
