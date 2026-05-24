/**
 * db.js — typed wrappers around every Supabase query Nexora needs.
 * All functions return { data, error } matching Supabase's convention.
 * When Supabase is not configured, guest mode uses localStorage instead.
 */

import { supabase, isSupabaseConfigured } from './supabase.js'
import { loadGuestProfile, saveGuestProfile } from './guest.js'

// ── Guest-mode helpers ────────────────────────────────────────────────────────

const GUEST_ACTIVITY_KEY = 'nx_guest_activity'
const GUEST_ANSWERS_KEY  = 'nx_guest_answers'

function noop() { return { data: null, error: null } }

function guestUpsertProfile(updates) {
  const current = loadGuestProfile() ?? { id:'guest_local', xp:0, streak:0, stream:null, last_active_date:null, display_name:'Student' }
  const merged = { ...current, ...updates }
  saveGuestProfile(merged)
  return { data: merged, error: null }
}

function guestAddXp(amount) {
  const p = loadGuestProfile() ?? { xp: 0 }
  guestUpsertProfile({ xp: (p.xp ?? 0) + amount })
  return { data: null, error: null }
}

function guestTouchDailyActivity() {
  const today = new Date().toISOString().split('T')[0]
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_ACTIVITY_KEY) ?? '[]')
    const existing = raw.find(r => r.date === today)
    if (existing) existing.sessions = (existing.sessions ?? 0) + 1
    else raw.push({ date: today, sessions: 1 })
    localStorage.setItem(GUEST_ACTIVITY_KEY, JSON.stringify(raw))
  } catch { /* ignore */ }
  return { data: null, error: null }
}

function guestGetWeeklyActivity() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_ACTIVITY_KEY) ?? '[]')
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    return { data: raw.filter(r => r.date >= cutoff), error: null }
  } catch { return { data: [], error: null } }
}

function guestRecordAnswer(entry) {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_ANSWERS_KEY) ?? '[]')
    raw.push(entry)
    localStorage.setItem(GUEST_ANSWERS_KEY, JSON.stringify(raw))
  } catch { /* ignore */ }
  return { data: null, error: null }
}

function guestGetTopicStats(stream) {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_ANSWERS_KEY) ?? '[]')
    return { data: raw.filter(a => a.stream === stream).map(a => ({ topic: a.topic, is_correct: a.is_correct })), error: null }
  } catch { return { data: [], error: null } }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUpWithEmail(email, password, displayName) {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') }
  return supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
}

export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInAnonymously() {
  if (!isSupabaseConfigured) return { data: { user: null }, error: null }
  return supabase.auth.signInAnonymously()
}

export async function signOut() {
  if (!isSupabaseConfigured) return noop()
  return supabase.auth.signOut()
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!isSupabaseConfigured) {
    return { data: loadGuestProfile(), error: null }
  }

  // Use raw fetch to bypass the navigator.locks mutex — same pattern as updateProfile.
  let accessToken = null
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 2000)),
    ])
    accessToken = result?.data?.session?.access_token ?? null
  } catch {}

  if (!accessToken) {
    try {
      const key = Object.keys(localStorage).find(k => /^sb-.+-auth-token$/.test(k))
      if (key) {
        const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
        const exp = stored?.expires_at
        if (stored?.access_token && (!exp || exp > Date.now() / 1000 + 5)) {
          accessToken = stored.access_token
        }
      }
    } catch {}
  }

  if (!accessToken) {
    // Fall back to Supabase client as last resort (may hang, but beats returning null)
    return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) }
    const rows = await res.json()
    return { data: rows[0] ?? null, error: null }
  } catch (e) {
    clearTimeout(timer)
    // On timeout/network error fall back to Supabase client
    return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  }
}

export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured) return guestUpsertProfile(updates)

  // The Supabase JS client serialises every query behind a navigator.locks mutex
  // for token management. On mobile PWAs the lock can be held for many seconds
  // (background token refresh, ITP, SW lifecycle events), causing queries to hang.
  // Fix: get the access token with a short timeout and fall back to localStorage,
  // then fire a plain fetch() so we never contend on the lock at all.
  let accessToken = null
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 2000)),
    ])
    accessToken = result?.data?.session?.access_token ?? null
  } catch {}

  if (!accessToken) {
    try {
      const key = Object.keys(localStorage).find(k => /^sb-.+-auth-token$/.test(k))
      if (key) {
        const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
        const exp = stored?.expires_at
        if (stored?.access_token && (!exp || exp > Date.now() / 1000 + 5)) {
          accessToken = stored.access_token
        }
      }
    } catch {}
  }

  if (!accessToken) return { data: null, error: new Error('Session expired — please sign in again') }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      signal: controller.signal,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
    })
    clearTimeout(timer)
    if (!res.ok) {
      const msg = await res.text().catch(() => `HTTP ${res.status}`)
      return { data: null, error: new Error(msg) }
    }
    const rows = await res.json()
    return { data: rows[0] ?? null, error: null }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') return { data: null, error: new Error('Request timed out — please try again') }
    return { data: null, error: e }
  }
}

export async function upsertProfile(userId, updates) {
  if (!isSupabaseConfigured) return guestUpsertProfile(updates)
  const patch = { ...updates }
  // Only generate a referral_code during initial profile creation (when stream is first set).
  // Partial updates (e.g. exam_date) must not overwrite an existing code.
  if (!patch.referral_code && patch.stream) {
    patch.referral_code = Math.random().toString(36).slice(2, 10).toUpperCase()
  }
  return supabase
    .from('profiles')
    .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle()
}

export async function addXp(userId, amount) {
  if (!isSupabaseConfigured) return guestAddXp(amount)
  return supabase.rpc('increment_xp', { user_id: userId, amount })
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession({ userId, stream, subject, totalQuestions }) {
  if (!isSupabaseConfigured) return { data: { id: `local_${Date.now()}` }, error: null }
  return supabase
    .from('sessions')
    .insert({ user_id: userId, stream, subject, total_questions: totalQuestions, started_at: new Date().toISOString() })
    .select()
    .single()
}

export async function completeSession(sessionId, { score, durationSeconds }) {
  if (!isSupabaseConfigured) return noop()
  return supabase
    .from('sessions')
    .update({ score, duration_seconds: durationSeconds, completed_at: new Date().toISOString() })
    .eq('id', sessionId)
}

// ── Answers ───────────────────────────────────────────────────────────────────

export async function recordAnswer({ sessionId, userId, questionId, topic, chosenIndex, correctIndex, hintUsed, stream }) {
  if (!isSupabaseConfigured) {
    return guestRecordAnswer({ topic, is_correct: chosenIndex === correctIndex, stream: stream ?? 'gcse', answered_at: new Date().toISOString() })
  }
  return supabase.from('answers').insert({
    session_id: sessionId, user_id: userId, question_id: questionId, topic, stream,
    chosen_index: chosenIndex, correct_index: correctIndex,
    is_correct: chosenIndex === correctIndex, hint_used: hintUsed,
    answered_at: new Date().toISOString(),
  })
}

// ── Daily activity ────────────────────────────────────────────────────────────

export async function touchDailyActivity(userId) {
  if (!isSupabaseConfigured) return guestTouchDailyActivity()
  const today = new Date().toISOString().split('T')[0]
  return supabase
    .from('daily_activity')
    .upsert({ user_id: userId, date: today, sessions: 1 }, { onConflict: 'user_id,date', ignoreDuplicates: false })
}

export async function getWeeklyActivity(userId) {
  if (!isSupabaseConfigured) return guestGetWeeklyActivity()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  return supabase
    .from('daily_activity')
    .select('date, sessions')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo)
    .order('date')
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function getTopicStats(userId, stream) {
  if (!isSupabaseConfigured) return guestGetTopicStats(stream)
  return supabase.from('answers').select('topic, is_correct').eq('user_id', userId).eq('stream', stream)
}

// ── AI usage ─────────────────────────────────────────────────────────────────

export async function getAiUsageToday(userId) {
  if (!isSupabaseConfigured) {
    try { return { data: Number(localStorage.getItem('nx_ai_usage') ?? 0), error: null } } catch { return { data: 0, error: null } }
  }
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('ai_usage').select('count').eq('user_id', userId).eq('date', today).single()
  return { data: data?.count ?? 0, error }
}

export async function incrementAiUsage(userId) {
  if (!isSupabaseConfigured) {
    try {
      const n = Number(localStorage.getItem('nx_ai_usage') ?? 0) + 1
      localStorage.setItem('nx_ai_usage', String(n))
    } catch {}
    return { data: null, error: null }
  }
  const today = new Date().toISOString().split('T')[0]
  return supabase.rpc('increment_ai_usage', { p_user_id: userId, p_date: today })
}

// ── Referral helpers ──────────────────────────────────────────────────────────

export async function getReferralStats(userId) {
  if (!isSupabaseConfigured) return { data: { total: 0, converted: 0 }, error: null }
  const { data, error } = await supabase.from('referrals').select('status').eq('referrer_id', userId)
  const total     = data?.length ?? 0
  const converted = data?.filter(r => r.status === 'converted').length ?? 0
  return { data: { total, converted }, error }
}

// ── Accessibility preferences ─────────────────────────────────────────────────

export async function getPreferences(userId) {
  if (!isSupabaseConfigured) {
    try { return { data: JSON.parse(localStorage.getItem('nx_prefs') ?? 'null'), error: null } }
    catch { return { data: null, error: null } }
  }
  return supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle()
}

export async function savePreferences(userId, prefs) {
  if (!isSupabaseConfigured) {
    try { localStorage.setItem('nx_prefs', JSON.stringify(prefs)) } catch {}
    return { data: prefs, error: null }
  }
  return supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle()
}

// ── Multi-stream enrolment ────────────────────────────────────────────────────

export async function enrollStream(userId, stream) {
  if (!isSupabaseConfigured) {
    const p = loadGuestProfile() ?? {}
    const streams = Array.from(new Set([...(p.streams ?? []), stream]))
    return guestUpsertProfile({ streams, active_stream: stream, stream })
  }
  // Append to streams array (no duplicates) and set as active.
  // Falls back to a plain UPDATE if the enroll_stream RPC isn't available yet.
  const { data, error } = await supabase.rpc('enroll_stream', { p_user_id: userId, p_stream: stream })
  if (error) {
    const { data: profile } = await supabase.from('profiles').select('streams').eq('id', userId).maybeSingle()
    const streams = Array.from(new Set([...(profile?.streams ?? []), stream]))
    return supabase
      .from('profiles')
      .update({ streams, active_stream: stream, stream, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle()
  }
  return { data, error }
}

export async function switchActiveStream(userId, stream) {
  if (!isSupabaseConfigured) return guestUpsertProfile({ active_stream: stream, stream })
  return supabase
    .from('profiles')
    .update({ active_stream: stream, stream, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle()
}

export async function getApSubjects(userId) {
  if (!isSupabaseConfigured) {
    try { return { data: JSON.parse(localStorage.getItem('nx_ap_subjects') ?? '[]'), error: null } }
    catch { return { data: [], error: null } }
  }
  return supabase.from('user_ap_subjects').select('subject_id').eq('user_id', userId)
}

export async function saveApSubjects(userId, subjectIds) {
  if (!isSupabaseConfigured) {
    try { localStorage.setItem('nx_ap_subjects', JSON.stringify(subjectIds)) } catch {}
    return { data: subjectIds, error: null }
  }
  await supabase.from('user_ap_subjects').delete().eq('user_id', userId)
  if (!subjectIds.length) return { data: [], error: null }
  const rows = subjectIds.map(subject_id => ({ user_id: userId, subject_id }))
  return supabase.from('user_ap_subjects').insert(rows).select()
}

// ── Sysadmin ──────────────────────────────────────────────────────────────────

export async function adminGetAllUsers() {
  if (!isSupabaseConfigured) return { data: [], error: null }
  return supabase.rpc('admin_get_users')
}

export async function adminUpdateProfile(userId, updates) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  return supabase.from('profiles').update(updates).eq('id', userId).select().single()
}

export async function adminDeleteProfile(userId) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  return supabase.from('profiles').delete().eq('id', userId)
}

export async function getClassSummary(teacherToken) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  return supabase.rpc('get_class_summary', { token: teacherToken })
}
