import { supabase, isSupabaseConfigured } from './supabase.js'

const FN_URL      = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain'
const ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_1ApxMrPiF0jv_SEnVUChNw_NhJhMg2j'
// JWT-format key required for Edge Function Bearer token (sb_publishable_* is not a JWT)
const JWT_BEARER  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3V2cmF4cXV4ZGpnZnhsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTQ1NzgsImV4cCI6MjA5NDY3MDU3OH0.v3f8GYT2_A7LfuKZZTeGMn2Lwy2A4AKucw6p7HyrYMg'

/**
 * Fetch an AI explanation via the Supabase Edge Function `explain`.
 * Falls back to a static hint when Supabase is not configured.
 */
export async function fetchExplanation(question, chosenIdx, stream) {
  if (!isSupabaseConfigured) {
    return `The correct answer is "${question.opts[question.ans]}". ${question.hint}. Work through the hint step by step — you've got this! 💪`
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? JWT_BEARER
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    const res = await fetch(FN_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ question, chosenIdx, stream }),
    })
    clearTimeout(timer)
    if (!res.ok) return fallback(question)
    const data = await res.json()
    return data?.explanation ?? fallback(question)
  } catch {
    return fallback(question)
  }
}

function fallback(question) {
  return `The correct answer is "${question.opts[question.ans]}". ${question.hint}. Keep practising — the method will click! 💪`
}
