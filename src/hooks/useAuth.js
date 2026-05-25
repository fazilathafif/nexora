import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { getProfile, upsertProfile } from '../lib/db.js'
import { loadGuestProfile, defaultGuestProfile } from '../lib/guest.js'

const GUEST_USER = { id: 'guest_local', email: null, isGuest: true }

function exploreProfile() {
  return { id: 'guest_local', xp: 0, streak: 0, stream: null, streams: [], active_stream: null, display_name: 'Explorer' }
}

export function useAuth() {
  const [user,               setUser]               = useState(null)
  const [profile,            setProfile]            = useState(null)
  const [loading,            setLoading]            = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    // Explore mode: user clicked "Explore first" — bypass auth entirely
    if (isSupabaseConfigured && sessionStorage.getItem('nx_explore') === '1') {
      setUser(null)
      setProfile(exploreProfile())
      setLoading(false)
      return
    }

    // No Supabase — local guest mode (dev / offline)
    if (!isSupabaseConfigured) {
      setUser(GUEST_USER)
      setProfile(loadGuestProfile() ?? defaultGuestProfile())
      setLoading(false)
      return
    }

    // Supabase configured — require explicit sign-in, no anonymous fallback
    // Timeout fallback: if getSession() hangs (Safari ITP / content blockers block
    // the token-refresh request), unblock the app after 5 s so the auth gate shows.
    const fallback = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const sessionActive = sessionStorage.getItem('nexora_session_active')
          const rememberMe    = localStorage.getItem('nexora_remember_me')
          const isOAuth       = session.user.app_metadata?.provider !== 'email'

          if (!sessionActive && !rememberMe && !isOAuth) {
            // Email user signed in without "remember me" and has since closed the browser
            await supabase.auth.signOut()
            return
          }
          // OAuth users always get treated as remembered (no checkbox shown in their flow)
          if (isOAuth) localStorage.setItem('nexora_remember_me', '1')
          sessionStorage.setItem('nexora_session_active', '1')
          setUser(session.user)
          await loadProfile(session.user.id)
        }
        // No session → user stays null, app shows auth gate
      })
      .catch(() => {})
      .finally(() => { clearTimeout(fallback); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (_event === 'PASSWORD_RECOVERY') { setIsPasswordRecovery(true); return }
        if (_event === 'USER_UPDATED')       { setIsPasswordRecovery(false) }
        if (_event === 'SIGNED_IN' && session?.user) {
          // Always mark the session active so subsequent page loads within the same
          // browser session work (critical for OAuth redirects which clear sessionStorage)
          sessionStorage.setItem('nexora_session_active', '1')
          if (session.user.app_metadata?.provider !== 'email') {
            localStorage.setItem('nexora_remember_me', '1')
          }
        }
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await getProfile(userId)
    // Profile may not exist yet (first sign-up before trigger fires)
    if (!data) await ensureProfile({ id: userId })
    else setProfile(data)
    return data
  }

  async function ensureProfile(u) {
    const defaults = { id: u.id, display_name: 'Student', xp: 0, streak: 0, stream: null, updated_at: new Date().toISOString() }
    await supabase
      .from('profiles')
      .upsert(defaults, { ignoreDuplicates: true })
    // ignoreDuplicates:true means the SELECT after upsert returns nothing for existing rows.
    // Always fetch fresh so an existing profile's stream/data is not wiped.
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle()
    if (data) setProfile(data)
    // If the SELECT also returned null (e.g. RLS temporarily blocked), keep
    // whatever profile is already in state rather than overwriting with stream:null.
    // App.jsx would redirect to StreamOnboarding if stream is null.
  }

  async function refreshProfile() {
    if (sessionStorage.getItem('nx_explore') === '1') {
      setProfile(exploreProfile())
      return
    }
    if (!isSupabaseConfigured) {
      setProfile({ ...(loadGuestProfile() ?? defaultGuestProfile()) })
      return
    }
    if (user) await loadProfile(user.id)
  }

  async function signOut() {
    if (!isSupabaseConfigured) return
    setUser(null)
    setProfile(null)
    sessionStorage.removeItem('nexora_session_active')
    localStorage.removeItem('nexora_remember_me')
    try { await supabase.auth.signOut() } catch {}
  }

  return { user, profile, loading, refreshProfile, signOut, isPasswordRecovery }
}
