import { useState, useCallback } from 'react'

/**
 * Persists the HL/SL tier selection per IB subject in localStorage.
 * Returns [tier, setTier] — default 'sl'.
 */
export function useIBTier(subjectId) {
  const key = `nx_ib_tier_${subjectId}`
  const [tier, setTierState] = useState(() => localStorage.getItem(key) ?? 'sl')

  const setTier = useCallback((t) => {
    localStorage.setItem(key, t)
    setTierState(t)
  }, [key])

  return [tier, setTier]
}
