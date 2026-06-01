/**
 * studySchedule.js — Date-aware study plan calculations.
 * Pure functions, no side effects, no API calls.
 */

/**
 * Given topics + exam date, determine which phase today falls in
 * and which topics should be studied today.
 * Includes spill-over: topics still below 70% get higher priority the longer they remain weak.
 */
export function getDayPlan(topics, examDate, today) {
  const todayDate = today ? new Date(today) : new Date()
  todayDate.setHours(0, 0, 0, 0)
  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)

  const daysLeft = Math.ceil((examD - todayDate) / 86400000)
  if (daysLeft <= 0 || !examDate) return null

  const totalDays  = daysLeft
  // Dynamic weak topics — sorted by pct ascending (weakest first)
  // Spill-over: topics below 50% are treated as urgent and appear more frequently
  const urgent     = topics.filter(t => t.pct < 50).sort((a, b) => a.pct - b.pct)
  const weak       = topics.filter(t => t.pct >= 50 && t.pct < 70).sort((a, b) => a.pct - b.pct)
  const allWeak    = [...urgent, ...weak] // urgent first
  const strong     = topics.filter(t => t.pct >= 70)

  let phase, phaseLabel, phaseColor, phaseIcon, todayTopics

  if (totalDays >= 21) {
    const drillingDays = Math.round(totalDays * 0.6)
    const mixedDays    = Math.round(totalDays * 0.3)
    const dayOfPlan    = totalDays - daysLeft

    if (dayOfPlan < drillingDays) {
      phase = 1; phaseLabel = 'Targeted Drilling'; phaseColor = '#EF4444'; phaseIcon = '🎯'
      if (allWeak.length === 0) {
        todayTopics = strong.slice(0, 2)
      } else {
        // Rotate through weak topics — urgent ones appear every other day
        const phaseFraction = drillingDays > 1 ? dayOfPlan / (drillingDays - 1) : 0
        const normalised    = Math.round(phaseFraction * (allWeak.length - 1))
        // Always include the weakest if it's urgent
        const alwaysInclude = urgent.length > 0 ? [urgent[0]] : []
        const rotating = allWeak.filter(t => !alwaysInclude.includes(t))
        const rotIdx   = rotating.length > 0 ? normalised % rotating.length : 0
        const rotated  = rotating.slice(rotIdx, rotIdx + 2)
        todayTopics = [...new Set([...alwaysInclude, ...rotated])].slice(0, 3)
      }
    } else if (dayOfPlan < drillingDays + mixedDays) {
      phase = 2; phaseLabel = 'Mixed Practice'; phaseColor = '#F59E0B'; phaseIcon = '🔄'
      const dayInPhase   = dayOfPlan - drillingDays
      const phaseFraction = mixedDays > 1 ? dayInPhase / (mixedDays - 1) : 0
      const allTopics    = [...allWeak, ...strong]
      const startIdx     = allTopics.length > 0 ? Math.round(phaseFraction * (allTopics.length - 1)) % allTopics.length : 0
      // Still include any urgent topics that aren't resolved
      const stillUrgent  = urgent.filter(t => t.pct < 50)
      const regular      = allTopics.filter(t => !stillUrgent.includes(t))
      const rotIdx       = regular.length > 0 ? startIdx % regular.length : 0
      todayTopics = [...new Set([...stillUrgent.slice(0, 1), ...regular.slice(rotIdx, rotIdx + 2)])].slice(0, 3)
    } else {
      phase = 3; phaseLabel = 'Mock Exams'; phaseColor = '#10B981'; phaseIcon = '📋'
      todayTopics = allWeak.slice(0, 2) // light review before mock
    }
  } else if (totalDays >= 7) {
    const drillingDays = Math.round(totalDays * 0.5)
    const dayOfPlan    = totalDays - daysLeft
    if (dayOfPlan < drillingDays) {
      phase = 1; phaseLabel = 'Intensive Revision'; phaseColor = '#EF4444'; phaseIcon = '🎯'
      todayTopics = allWeak.slice(0, 3)
    } else {
      phase = 2; phaseLabel = 'Mock & Review'; phaseColor = '#10B981'; phaseIcon = '📋'
      todayTopics = allWeak.slice(0, 2)
    }
  } else {
    phase = 3; phaseLabel = 'Final Sprint'; phaseColor = '#F59E0B'; phaseIcon = '🚀'
    todayTopics = allWeak.slice(0, 3)
  }

  return {
    phase,
    phaseLabel,
    phaseColor,
    phaseIcon,
    dayOfPlan: totalDays - daysLeft,
    totalDays,
    daysLeft,
    todayTopics: (todayTopics ?? []).slice(0, 3),
  }
}

/**
 * Build a week-by-week calendar from today until exam.
 * No day cap — shows ALL weeks until exam.
 * Each week is collapsed by default (except the current week).
 *
 * @param {Array}  topics   — [{ topic, pct, subjectId, emoji }]
 * @param {string} examDate — YYYY-MM-DD
 * @returns {Array<{ weekLabel, isCurrentWeek, days[] }>}
 */
export function getWeekCalendar(topics, examDate) {
  if (!examDate) return []

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)
  const totalDays = Math.ceil((examD - todayDate) / 86400000)
  if (totalDays <= 0) return []

  // Build flat day list — ALL days until exam (no cap)
  const days = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() + i)
    const daysLeft = Math.ceil((examD - d) / 86400000)
    const dayPlan  = getDayPlan(topics, examDate, d.toISOString().split('T')[0])
    const isToday  = i === 0

    days.push({
      date:      d.toISOString().split('T')[0],
      label:     d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
      dayOfWeek: d.toLocaleDateString('en-GB', { weekday:'short' }),
      dayNum:    d.getDate(),
      monthLabel:d.toLocaleDateString('en-GB', { month:'short' }),
      isToday,
      isPast:    false,
      isExamDay: daysLeft === 0,
      phase:     dayPlan?.phase ?? 0,
      phaseLabel:dayPlan?.phaseLabel ?? '',
      phaseColor:dayPlan?.phaseColor ?? '#64748B',
      phaseIcon: dayPlan?.phaseIcon ?? '📅',
      topics:    dayPlan?.todayTopics ?? [],
    })
  }

  // Add exam day
  days.push({
    date: examDate,
    label: examD.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
    dayOfWeek: examD.toLocaleDateString('en-GB', { weekday:'short' }),
    dayNum: examD.getDate(),
    monthLabel: examD.toLocaleDateString('en-GB', { month:'short' }),
    isToday: false, isPast: false, isExamDay: true,
    phase: 0, phaseLabel: 'Exam Day! 🏆', phaseColor: '#0056D2', phaseIcon: '🏆',
    topics: [],
  })

  // Group into weeks — each week collapsed by default except current week
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    const chunk      = days.slice(i, i + 7)
    const weekStart  = chunk[0]
    const isCurrentWeek = i === 0
    const weekNum    = Math.floor(i / 7) + 1
    const totalWeeks = Math.ceil(days.length / 7)
    weeks.push({
      weekLabel:      isCurrentWeek ? 'This week' : i === 7 ? 'Next week' : `Week ${weekNum} of ${totalWeeks} — ${weekStart.label}`,
      isCurrentWeek,
      containsToday:  chunk.some(d => d.isToday),
      containsExam:   chunk.some(d => d.isExamDay),
      phaseColors:    [...new Set(chunk.map(d => d.phaseColor))],
      days: chunk,
    })
  }

  return weeks
}

/**
 * Group topics by subjectId for the combined topics view.
 * Returns subjects sorted weakest first.
 * Falls back gracefully for topics whose subjectId doesn't match cfg.subjects (e.g. IGCSE).
 */
export function groupTopicsBySubject(topics, streamConfig) {
  if (!topics?.length || !streamConfig) return []

  const subjectMap = {}
  for (const t of topics) {
    const key = t.subjectId ?? 'unknown'
    if (!subjectMap[key]) {
      const subCfg = streamConfig.subjects?.find(s => s.id === key)
      subjectMap[key] = {
        subjectId: key,
        label:     subCfg?.label ?? (key !== 'unknown' ? key.replace(/_/g, ' ').replace(/^igcse |^ib /, s => s.toUpperCase()) : 'Other Topics'),
        emoji:     subCfg?.emoji ?? t.emoji ?? '📚',
        topics:    [],
        avgPct:    0,
      }
    }
    subjectMap[key].topics.push(t)
  }

  const subjects = Object.values(subjectMap).map(s => ({
    ...s,
    topics:  s.topics.sort((a, b) => a.pct - b.pct),
    avgPct:  Math.round(s.topics.reduce((sum, t) => sum + t.pct, 0) / s.topics.length),
  }))

  return subjects.sort((a, b) => a.avgPct - b.avgPct)
}
