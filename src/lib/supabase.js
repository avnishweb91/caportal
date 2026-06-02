// Supabase is activated when REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
// are set in your .env file. Until then, the app uses localStorage as the database.
//
// Setup:
//   1. npm install @supabase/supabase-js
//   2. Create a project at https://supabase.com
//   3. Copy your project URL and anon key into .env
//   4. Run the schema from supabase-schema.sql in the Supabase SQL editor

let supabase = null;

const url = process.env.REACT_APP_SUPABASE_URL;
const key  = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (url && key) {
  try {
    // Dynamically import so the build doesn't fail without the package installed
    import('@supabase/supabase-js').then(({ createClient }) => {
      supabase = createClient(url, key);
    }).catch(() => {
      console.warn('CAPortal: @supabase/supabase-js not installed. Run: npm install @supabase/supabase-js');
    });
  } catch {
    console.warn('CAPortal: Supabase env vars set but package not installed.');
  }
}

export { supabase };
export const isSupabaseReady = () => supabase !== null;

// Auth helpers — used by AuthPage when Supabase is configured
export const supabaseSignIn = async (email, password) => {
  if (!supabase) return { error: 'Supabase not configured' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const supabaseSignUp = async (email, password, name) => {
  if (!supabase) return { error: 'Supabase not configured' };
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  });
  return { data, error };
};

export const supabaseSignOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const supabaseGetSession = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};
