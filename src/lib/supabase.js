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
