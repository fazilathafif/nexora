import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { getProfile, upsertProfile } from '../lib/db.js'
import { loadGuestProfile, defaultGuestProfile } from '../lib/guest.js'

const GUEST_USER = { id: 'guest_local', email: null, isGuest: true }

export function useAuth() {
  const [user,               setUser]               = useState(null)
  const [profile,            setProfile]            = useState(null)
  const [loading,            setLoading]            = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
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
          // Enforce "remember me = off": if no active session marker in sessionStorage
          // and no persistent remember-me flag, the user closed the browser without
          // wanting to stay signed in — sign them out now.
          const sessionActive = sessionStorage.getItem('nexora_session_active')
          const rememberMe    = localStorage.getItem('nexora_remember_me')
          if (!sessionActive && !rememberMe) {
            await supabase.auth.signOut()
            return
          }
          // Mark this browser session as active (covers the remember-me=on case on reload)
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
    const { data } = await upsertProfile(u.id, {
      display_name: 'Student', xp: 0, streak: 0, stream: null,
    })
    setProfile(data)
  }

  async function refreshProfile() {
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
