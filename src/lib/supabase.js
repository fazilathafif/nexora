import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// App runs in offline/guest mode when Supabase is not configured.
// XP, streaks, and progress are stored in localStorage instead.
export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseKey.includes('your-anon-public-key'))

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

// Returns true when all DB operations should use localStorage instead of Supabase.
// This covers both offline/dev mode (Supabase not configured) and explore mode
// (user chose "Explore first" without signing in).
export function isGuestSession() {
  if (!isSupabaseConfigured) return true
  try { return sessionStorage.getItem('nx_explore') === '1' } catch { return false }
}
