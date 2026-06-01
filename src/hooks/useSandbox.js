/**
 * useSandbox.js — State management hook for IB Survival Sandbox.
 *
 * Handles:
 * - Feature flag check (VITE_IB_SANDBOX_ENABLED)
 * - Stress index fetch + De-stress Target Adjuster state
 * - Recommendations fetch
 * - IB subscription gate
 */

import { useState, useEffect, useCallback } from 'react'
import { getEffectivePlan } from '../lib/subscription.js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FEATURE_FLAG  = import.meta.env.VITE_IB_SANDBOX_ENABLED === 'true'

async function fetchWithAuth(path, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    headers: {
      apikey:        SUPABASE_ANON,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`${path} returned ${res.status}`)
  return res.json()
}

export function useSandbox(user, profile, supabase) {
  const [enabled,         setEnabled]         = useState(false)
  const [stressData,      setStressData]       = useState(null)
  const [recommendations, setRecommendations]  = useState([])
  const [loading,         setLoading]          = useState(false)
  const [error,           setError]            = useState(null)

  // ── Gate: feature flag + IB subscription ──────────────────────────────────
  const plan     = getEffectivePlan(profile)
  const isIBUser = profile?.streams?.includes('ib') || profile?.active_stream === 'ib'
  const hasAccess = FEATURE_FLAG && isIBUser && plan !== 'free'

  useEffect(() => {
    setEnabled(hasAccess)
  }, [hasAccess])

  // ── Fetch stress index + recommendations ──────────────────────────────────
  const refresh = useCallback(async () => {
    if (!hasAccess || !user?.id) return
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('No session token')

      const [stress, recs] = await Promise.all([
        fetchWithAuth('sandbox-stress-index',   token),
        fetchWithAuth('sandbox-recommendations', token),
      ])
      setStressData(stress)
      setRecommendations(recs.recommendations ?? [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load sandbox data')
    } finally {
      setLoading(false)
    }
  }, [hasAccess, user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ── De-stress Target Adjuster ─────────────────────────────────────────────
  // Returns a multiplier (0.5 if stressed, 1.0 normal) to apply to GoalCard rec
  const targetMultiplier = stressData?.stress_mode ? 0.5 : 1.0
  const stressMode       = !!stressData?.stress_mode
  const stressIndex      = stressData?.stress_index ?? 0

  return {
    enabled,
    hasAccess,
    stressMode,
    stressIndex,
    targetMultiplier,
    recommendations,
    loading,
    error,
    refresh,
  }
}
