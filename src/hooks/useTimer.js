import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Countdown timer for quiz questions.
 * Returns seconds remaining, a pct (0-100) for the progress bar, and controls.
 * onExpire fires once when the timer hits 0.
 * resetKey — increment to force reset without changing `seconds` (e.g. new question same duration).
 */
export function useTimer(seconds, onExpire, resetKey = 0) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef  = useRef(null)
  const firedRef     = useRef(false)
  const activeRef    = useRef(seconds > 0)
  const onExpireRef  = useRef(onExpire)

  // Keep ref current on every render so the interval always calls the latest callback
  useEffect(() => { onExpireRef.current = onExpire })

  // Reset whenever seconds or resetKey changes (new question)
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (seconds <= 0) { activeRef.current = false; setRemaining(0); return }

    setRemaining(seconds)
    firedRef.current  = false
    activeRef.current = true

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (!firedRef.current) { firedRef.current = true; onExpireRef.current?.() }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [seconds, resetKey]) // eslint-disable-line

  const pause  = useCallback(() => clearInterval(intervalRef.current), [])
  const resume = useCallback(() => {
    if (!activeRef.current || remaining <= 0) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); onExpireRef.current?.(); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [remaining]) // eslint-disable-line

  const pct     = seconds > 0 ? (remaining / seconds) * 100 : 100
  const warning = pct < 30
  const danger  = pct < 15

  return { remaining, pct, warning, danger, pause, resume, active: seconds > 0 }
}
