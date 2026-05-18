import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { signInAnonymously, getProfile, upsertProfile } from '../lib/db.js'
import { loadGuestProfile, saveGuestProfile, defaultGuestProfile } from '../lib/guest.js'

const GUEST_USER = { id: 'guest_local', email: null, isGuest: true }

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const p = loadGuestProfile() ?? defaultGuestProfile()
      setUser(GUEST_USER)
      setProfile(p)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        const { data, error } = await signInAnonymously()
        if (!error && data.user) {
          setUser(data.user)
          await ensureProfile(data.user)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await getProfile(userId)
    setProfile(data)
    return data
  }

  async function ensureProfile(user) {
    const { data } = await upsertProfile(user.id, {
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
    await supabase.auth.signOut()
  }

  return { user, profile, loading, refreshProfile, signOut }
}
