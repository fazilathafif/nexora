import { useState, useEffect } from 'react'

export function useTheme() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('nx_theme') ?? 'system' } catch { return 'system' }
  })

  const systemDark = typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  const isDark = mode === 'dark' || (mode === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    try { localStorage.setItem('nx_theme', mode) } catch {}
  }, [mode, isDark])

  return { isDark, mode, setMode }
}
