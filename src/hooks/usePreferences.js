import { useState, useEffect, useCallback } from 'react'
import { getPreferences, savePreferences } from '../lib/db.js'
import { PREF_DEFAULTS, applyPreferences } from '../lib/preferences.js'

export function usePreferences(userId) {
  const [prefs,   setPrefs]   = useState(PREF_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    getPreferences(userId).then(({ data }) => {
      const merged = { ...PREF_DEFAULTS, ...(data ?? {}) }
      setPrefs(merged)
      applyPreferences(merged)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  const updatePref = useCallback(async (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    applyPreferences(next)
    if (userId) {
      await savePreferences(userId, { [key]: value })
    }
  }, [prefs, userId])

  return { prefs, updatePref, loading }
}
