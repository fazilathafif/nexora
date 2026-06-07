import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

// ── Certificate definitions ───────────────────────────────────────────────────

export const CERT_DEFS = [
  {
    id:          'first_steps',
    title:       'First Steps',
    subtitle:    'Answered their very first question',
    icon:        '🎯',
    requires:    'Answer your first question in any quiz session.',
    check:       (profile, _stats) => (profile?.xp ?? 0) > 0,
  },
  {
    id:          'week_warrior',
    title:       'Week Warrior',
    subtitle:    '7-day learning streak maintained',
    icon:        '🔥',
    requires:    'Complete at least one quiz session every day for 7 consecutive days.',
    check:       (profile, _stats) => (profile?.streak ?? 0) >= 7,
  },
  {
    id:          'century_club',
    title:       'Century Club',
    subtitle:    'Earned 100 XP across all sessions',
    icon:        '💎',
    requires:    'Earn a total of 100 XP by completing quizzes and mock exams.',
    check:       (profile, _stats) => (profile?.xp ?? 0) >= 100,
  },
  {
    id:          'level_5',
    title:       'Level 5 Scholar',
    subtitle:    'Reached Level 5 on Nexora',
    icon:        '🌟',
    requires:    'Reach Level 5 by earning 750 XP total across all your sessions.',
    check:       (profile, _stats) => Math.floor(((profile?.xp ?? 0) / 150)) + 1 >= 5,
  },
  {
    id:          'subject_master',
    title:       'Subject Master',
    subtitle:    'Achieved ≥80% accuracy in a subject',
    icon:        '🏆',
    requires:    'Score ≥80% accuracy on at least 10 questions in any single subject.',
    check:       (_profile, stats) => stats?.some(s => s.pct >= 80 && s.total >= 10),
    getScore:    (stats) => Math.max(...(stats?.filter(s => s.total >= 10).map(s => s.pct) ?? [0])),
  },
  {
    id:          'on_track',
    title:       'On Track',
    subtitle:    'Overall accuracy above 75%',
    icon:        '📈',
    requires:    'Achieve an overall average accuracy of 75% or above across all answered topics.',
    check:       (_profile, stats) => {
      if (!stats?.length) return false
      const avg = stats.reduce((s, t) => s + t.pct, 0) / stats.length
      return avg >= 75
    },
    getScore: (stats) => {
      if (!stats?.length) return null
      return Math.round(stats.reduce((s, t) => s + t.pct, 0) / stats.length)
    },
  },
  {
    id:          'ib_candidate',
    title:       'IB Candidate',
    subtitle:    'Projected IB score ≥30/45',
    icon:        '🌐',
    streamOnly:  'ib',
    requires:    'IB Diploma track only. Reach a projected score of 30 or above out of 45 based on your topic accuracy.',
    check:       (_profile, stats) => {
      if (!stats?.length) return false
      const avg = stats.reduce((s, t) => s + t.pct, 0) / stats.length
      const projected = Math.round((avg / 100) * 7 * stats.length)
      return projected >= 30
    },
  },
  {
    id:          'track_graduate',
    title:       'Track Graduate',
    subtitle:    'All subjects mastered at ≥70%',
    icon:        '🎓',
    requires:    'Score ≥70% accuracy on at least 5 questions in every subject in your current track.',
    check:       (_profile, stats, subjects) => {
      if (!stats?.length || !subjects?.length) return false
      return subjects.every(s => {
        const t = stats.find(st => st.subjectId === s.id)
        return t && t.pct >= 70 && t.total >= 5
      })
    },
  },
]

// ── Cert ID generator ─────────────────────────────────────────────────────────

export function makeCertId(userId, certId, dateStr) {
  const raw = `${userId}-${certId}-${dateStr}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `NX-${hex.slice(0,4)}-${hex.slice(4)}`
}

// ── Load certificates from profile ───────────────────────────────────────────

export function getCertificates(profile) {
  return profile?.certificates ?? {}
}

// ── Check and stamp new unlocks ───────────────────────────────────────────────

export async function checkAndUnlockCertificates(profile, topicStats, subjects) {
  if (!profile?.id || !supabase) return {}
  const existing = getCertificates(profile)
  const today    = new Date().toISOString().slice(0, 10)
  const newUnlocks = {}

  for (const def of CERT_DEFS) {
    if (existing[def.id]) continue
    if (def.streamOnly && profile.stream !== def.streamOnly && !profile.streams?.includes(def.streamOnly)) continue
    if (def.check(profile, topicStats, subjects)) {
      newUnlocks[def.id] = today
    }
  }

  if (Object.keys(newUnlocks).length === 0) return {}

  const merged = { ...existing, ...newUnlocks }
  await supabase
    .from('profiles')
    .update({ certificates: merged })
    .eq('id', profile.id)

  return newUnlocks
}

// ── Download certificate as PDF ───────────────────────────────────────────────

export async function downloadCertificate(certEl, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(certEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, 562] })
  pdf.addImage(imgData, 'PNG', 0, 0, 794, 562)
  pdf.save(`${filename}.pdf`)
}
