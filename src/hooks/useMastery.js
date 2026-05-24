import { useMemo } from 'react'

const THRESHOLDS = { bronze: 40, silver: 70, gold: 90 }

function readSrs() {
  try { return JSON.parse(localStorage.getItem('nx_srs') ?? '{}') }
  catch { return {} }
}

export function useMastery(questions) {
  return useMemo(() => {
    if (!questions?.length) return { total: 0, mastered: 0, pct: 0, badge: null }
    const srs = readSrs()
    const total    = questions.length
    const mastered = questions.filter(q => (srs[q.id]?.reps ?? 0) >= 3).length
    const pct      = Math.round((mastered / total) * 100)
    const badge    = pct >= THRESHOLDS.gold   ? 'gold'
                   : pct >= THRESHOLDS.silver ? 'silver'
                   : pct >= THRESHOLDS.bronze ? 'bronze'
                   : null
    return { total, mastered, pct, badge }
  }, [questions])
}
