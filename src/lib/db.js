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
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function upsertProfile(userId, updates) {
  if (!isSupabaseConfigured) return guestUpsertProfile(updates)
  return supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
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

// ── Teacher dashboard ─────────────────────────────────────────────────────────

export async function getClassSummary(teacherToken) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  return supabase.rpc('get_class_summary', { token: teacherToken })
}
