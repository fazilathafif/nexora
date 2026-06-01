/**
 * studySchedule.js — Date-aware study plan calculations.
 * Pure functions, no side effects, no API calls.
 */

/**
 * Given topics + exam date, determine which phase a specific date falls in
 * and which topics should be studied that day.
 *
 * totalDays is fixed from REAL today to exam.
 * dayOfPlan is offset from real today — so each future date gets a different phase/topics.
 */
export function getDayPlan(topics, examDate, forDate) {
  const targetDate = forDate ? new Date(forDate) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const realToday = new Date()
  realToday.setHours(0, 0, 0, 0)

  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)

  // daysLeft from the target date to exam
  const daysLeft = Math.ceil((examD - targetDate) / 86400000)
  if (daysLeft <= 0 || !examDate) return null

  // totalDays = full plan length (real today → exam), constant reference
  const totalDays = Math.ceil((examD - realToday) / 86400000)
  if (totalDays <= 0) return null

  // dayOfPlan = how far into the plan the target date is (0=today, 7=one week from now, etc.)
  const dayOfPlan = Math.round((targetDate - realToday) / 86400000)

  const urgent  = topics.filter(t => t.pct < 50).sort((a, b) => a.pct - b.pct)
  const weak    = topics.filter(t => t.pct >= 50 && t.pct < 70).sort((a, b) => a.pct - b.pct)
  const allWeak = [...urgent, ...weak]
  const strong  = topics.filter(t => t.pct >= 70)

  let phase, phaseLabel, phaseColor, phaseIcon, todayTopics

  if (totalDays >= 21) {
    const drillingDays = Math.round(totalDays * 0.6)
    const mixedDays    = Math.round(totalDays * 0.3)

    if (dayOfPlan < drillingDays) {
      phase = 1; phaseLabel = 'Targeted Drilling'; phaseColor = '#EF4444'; phaseIcon = '🎯'
      if (allWeak.length === 0) {
        todayTopics = strong.slice(0, 2)
      } else {
        const phaseFraction = drillingDays > 1 ? dayOfPlan / (drillingDays - 1) : 0
        const alwaysInclude = urgent.length > 0 ? [urgent[0]] : []
        const rotating      = allWeak.filter(t => !alwaysInclude.includes(t))
        const rotIdx        = rotating.length > 0 ? Math.round(phaseFraction * (rotating.length - 1)) % rotating.length : 0
        todayTopics = [...new Set([...alwaysInclude, ...rotating.slice(rotIdx, rotIdx + 2)])].slice(0, 3)
      }
    } else if (dayOfPlan < drillingDays + mixedDays) {
      phase = 2; phaseLabel = 'Mixed Practice'; phaseColor = '#F59E0B'; phaseIcon = '🔄'
      const dayInPhase    = dayOfPlan - drillingDays
      const phaseFraction = mixedDays > 1 ? dayInPhase / (mixedDays - 1) : 0
      const allTopics     = [...allWeak, ...strong]
      const stillUrgent   = urgent.filter(t => t.pct < 50)
      const regular       = allTopics.filter(t => !stillUrgent.includes(t))
      const rotIdx        = regular.length > 0 ? Math.round(phaseFraction * (regular.length - 1)) % regular.length : 0
      todayTopics = [...new Set([...stillUrgent.slice(0, 1), ...regular.slice(rotIdx, rotIdx + 2)])].slice(0, 3)
    } else {
      phase = 3; phaseLabel = 'Mock Exams'; phaseColor = '#10B981'; phaseIcon = '📋'
      todayTopics = allWeak.slice(0, 2)
    }
  } else if (totalDays >= 7) {
    const drillingDays = Math.round(totalDays * 0.5)
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
    phase, phaseLabel, phaseColor, phaseIcon,
    dayOfPlan,
    totalDays,
    daysLeft,
    todayTopics: (todayTopics ?? []).slice(0, 3),
  }
}

/**
 * Build a week-by-week calendar from today until exam.
 * No day cap — shows ALL weeks until exam.
 * Each week is collapsed by default (except the current week).
 */
export function getWeekCalendar(topics, examDate) {
  if (!examDate) return []

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)
  const totalDays = Math.ceil((examD - todayDate) / 86400000)
  if (totalDays <= 0) return []

  const days = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() + i)
    const daysLeft = Math.ceil((examD - d) / 86400000)
    const dayPlan  = getDayPlan(topics, examDate, d.toISOString().split('T')[0])
    const isToday  = i === 0

    days.push({
      date:       d.toISOString().split('T')[0],
      label:      d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
      dayOfWeek:  d.toLocaleDateString('en-GB', { weekday:'short' }),
      dayNum:     d.getDate(),
      monthLabel: d.toLocaleDateString('en-GB', { month:'short' }),
      isToday,
      isPast:     false,
      isExamDay:  daysLeft === 0,
      phase:      dayPlan?.phase ?? 0,
      phaseLabel: dayPlan?.phaseLabel ?? '',
      phaseColor: dayPlan?.phaseColor ?? '#64748B',
      phaseIcon:  dayPlan?.phaseIcon ?? '📅',
      topics:     dayPlan?.todayTopics ?? [],
    })
  }

  // Exam day entry
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

  // Group into collapsible weeks
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    const chunk      = days.slice(i, i + 7)
    const weekStart  = chunk[0]
    const weekNum    = Math.floor(i / 7) + 1
    const totalWeeks = Math.ceil(days.length / 7)
    weeks.push({
      weekLabel:      i === 0 ? 'This week' : i === 7 ? 'Next week' : `Week ${weekNum} of ${totalWeeks} — ${weekStart.label}`,
      isCurrentWeek:  i === 0,
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
 * Falls back gracefully for topics whose subjectId doesn't match cfg.subjects.
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
        label:     subCfg?.label ?? key.replace(/_/g, ' ').replace(/^(igcse|ib) /i, s => s.toUpperCase()),
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
