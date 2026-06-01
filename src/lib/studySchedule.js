/**
 * studySchedule.js — Date-aware study plan calculations.
 * Pure functions, no side effects, no API calls.
 */

/**
 * Given topics + exam date, determine which phase today falls in
 * and which topics should be studied today.
 *
 * @param {Array}  topics    — [{ topic, pct, subjectId, emoji, total }]
 * @param {string} examDate  — YYYY-MM-DD
 * @param {string} [today]   — YYYY-MM-DD (defaults to today)
 * @returns {{ phase, phaseLabel, phaseColor, phaseIcon, dayOfPlan, totalDays, todayTopics, daysLeft }}
 */
export function getDayPlan(topics, examDate, today) {
  const todayDate = today ? new Date(today) : new Date()
  todayDate.setHours(0, 0, 0, 0)
  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)

  const daysLeft = Math.ceil((examD - todayDate) / 86400000)
  if (daysLeft <= 0 || !examDate) return null

  const totalDays = daysLeft
  const weakTopics   = topics.filter(t => t.pct < 70).sort((a, b) => a.pct - b.pct)
  const strongTopics = topics.filter(t => t.pct >= 70)

  // Phase boundaries (same logic as buildSchedule)
  let phase, phaseLabel, phaseColor, phaseIcon, phaseFraction, todayTopics

  if (totalDays >= 21) {
    const drillingDays = Math.round(totalDays * 0.6)
    const mixedDays    = Math.round(totalDays * 0.3)
    const mockDays     = totalDays - drillingDays - mixedDays
    const dayOfPlan    = totalDays - daysLeft // how many days since we started

    if (dayOfPlan < drillingDays) {
      phase = 1; phaseLabel = 'Targeted Drilling'; phaseColor = '#EF4444'; phaseIcon = '🎯'
      phaseFraction = dayOfPlan / drillingDays
      // Rotate through weak topics — 2-3 per day
      const topicsPerDay = Math.max(1, Math.min(3, weakTopics.length))
      const startIdx = Math.floor(phaseFraction * weakTopics.length) % Math.max(1, weakTopics.length)
      todayTopics = weakTopics.slice(startIdx, startIdx + topicsPerDay)
      if (todayTopics.length < topicsPerDay) todayTopics = [...todayTopics, ...weakTopics.slice(0, topicsPerDay - todayTopics.length)]
    } else if (dayOfPlan < drillingDays + mixedDays) {
      phase = 2; phaseLabel = 'Mixed Practice'; phaseColor = '#F59E0B'; phaseIcon = '🔄'
      const dayInPhase = dayOfPlan - drillingDays
      phaseFraction = dayInPhase / mixedDays
      const allTopics = [...weakTopics, ...strongTopics]
      const startIdx = Math.floor(phaseFraction * allTopics.length) % Math.max(1, allTopics.length)
      todayTopics = allTopics.slice(startIdx, startIdx + 2)
      if (todayTopics.length < 2) todayTopics = [...todayTopics, ...allTopics.slice(0, 2 - todayTopics.length)]
    } else {
      phase = 3; phaseLabel = 'Mock Exams'; phaseColor = '#10B981'; phaseIcon = '📋'
      todayTopics = weakTopics.slice(0, 1) // review weakest before mock
    }
  } else if (totalDays >= 7) {
    const drillingDays = Math.round(totalDays * 0.5)
    const dayOfPlan = totalDays - daysLeft
    if (dayOfPlan < drillingDays) {
      phase = 1; phaseLabel = 'Intensive Revision'; phaseColor = '#EF4444'; phaseIcon = '🎯'
      todayTopics = weakTopics.slice(0, 2)
    } else {
      phase = 2; phaseLabel = 'Mock & Review'; phaseColor = '#10B981'; phaseIcon = '📋'
      todayTopics = weakTopics.slice(0, 1)
    }
  } else {
    phase = 3; phaseLabel = 'Final Sprint'; phaseColor = '#F59E0B'; phaseIcon = '🚀'
    todayTopics = weakTopics.slice(0, 2)
  }

  return {
    phase,
    phaseLabel,
    phaseColor,
    phaseIcon,
    dayOfPlan: totalDays - daysLeft,
    totalDays,
    daysLeft,
    todayTopics: todayTopics.slice(0, 3), // max 3 topics per day
  }
}

/**
 * Build a week-by-week calendar from today until exam.
 * Returns an array of week objects, each with day entries.
 *
 * @param {Array}  topics   — [{ topic, pct, subjectId, emoji }]
 * @param {string} examDate — YYYY-MM-DD
 * @returns {Array<{ weekLabel, days: [{ date, label, dayOfWeek, isToday, isPast, phase, phaseColor, phaseIcon, topics }] }>}
 */
export function getWeekCalendar(topics, examDate) {
  if (!examDate) return []

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const examD = new Date(examDate)
  examD.setHours(0, 0, 0, 0)
  const totalDays = Math.ceil((examD - todayDate) / 86400000)
  if (totalDays <= 0) return []

  const weakTopics   = topics.filter(t => t.pct < 70).sort((a, b) => a.pct - b.pct)
  const allTopics    = [...weakTopics, ...topics.filter(t => t.pct >= 70)]
  const maxDays      = Math.min(totalDays, 28) // show max 4 weeks

  // Build flat day list
  const days = []
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() + i)
    const daysLeft = Math.ceil((examD - d) / 86400000)
    const dayPlan = getDayPlan(topics, examDate, d.toISOString().split('T')[0])
    const isToday  = i === 0
    const isPast   = d < todayDate

    days.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
      dayOfWeek: d.toLocaleDateString('en-GB', { weekday:'short' }),
      dayNum: d.getDate(),
      isToday,
      isPast,
      isExamDay: daysLeft === 0,
      phase: dayPlan?.phase ?? 0,
      phaseLabel: dayPlan?.phaseLabel ?? '',
      phaseColor: dayPlan?.phaseColor ?? '#64748B',
      phaseIcon: dayPlan?.phaseIcon ?? '📅',
      topics: dayPlan?.todayTopics ?? [],
    })
  }

  // Add exam day
  if (totalDays <= 28) {
    days.push({
      date: examDate,
      label: examD.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
      isToday: false, isPast: false, isExamDay: true,
      phase: 0, phaseLabel: 'Exam Day!', phaseColor: '#0056D2', phaseIcon: '🏆',
      topics: [],
    })
  }

  // Group into weeks
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7)
    const weekStart = chunk[0]
    weeks.push({
      weekLabel: i === 0 ? 'This week' : i === 7 ? 'Next week' : `Week of ${weekStart.label}`,
      days: chunk,
    })
  }

  return weeks
}

/**
 * Group topics by subjectId for the combined topics view.
 * Returns subjects sorted weakest first, each with their topics sorted weakest first.
 */
export function groupTopicsBySubject(topics, streamConfig) {
  if (!topics?.length || !streamConfig) return []

  const subjectMap = {}
  for (const t of topics) {
    if (!subjectMap[t.subjectId]) {
      const subCfg = streamConfig.subjects?.find(s => s.id === t.subjectId)
      subjectMap[t.subjectId] = {
        subjectId: t.subjectId,
        label: subCfg?.label ?? t.subjectId,
        emoji: subCfg?.emoji ?? t.emoji ?? '📚',
        topics: [],
        avgPct: 0,
      }
    }
    subjectMap[t.subjectId].topics.push(t)
  }

  // Calculate average accuracy per subject and sort topics within each subject
  const subjects = Object.values(subjectMap).map(s => ({
    ...s,
    topics: s.topics.sort((a, b) => a.pct - b.pct),
    avgPct: Math.round(s.topics.reduce((sum, t) => sum + t.pct, 0) / s.topics.length),
  }))

  // Sort subjects weakest first
  return subjects.sort((a, b) => a.avgPct - b.avgPct)
}
