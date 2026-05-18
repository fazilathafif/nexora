/**
 * Spaced Repetition System (SM-2-inspired).
 * Pure functions — storage is synchronous localStorage so no async/hooks needed.
 * Schedule: nx_srs = { [questionId]: { interval, ease, reps, nextDue } }
 */

const SRS_KEY = 'nx_srs'

function load() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) ?? '{}') } catch { return {} }
}
function save(data) {
  try { localStorage.setItem(SRS_KEY, JSON.stringify(data)) } catch {}
}

function today() { return new Date().toISOString().split('T')[0] }
function addDays(n) { return new Date(Date.now() + n * 86400000).toISOString().split('T')[0] }

/**
 * Record a question result and schedule the next review.
 * Call this after every answered question.
 */
export function scheduleReview(questionId, correct) {
  const srs   = load()
  const entry = srs[questionId] ?? { interval: 1, ease: 2.5, reps: 0 }

  if (correct) {
    const interval = entry.reps === 0 ? 1
      : entry.reps === 1              ? 6
      : Math.round(entry.interval * entry.ease)
    srs[questionId] = {
      interval,
      ease:    Math.min(3.0, entry.ease + 0.1),
      reps:    entry.reps + 1,
      nextDue: addDays(interval),
    }
  } else {
    srs[questionId] = {
      interval: 1,
      ease:     Math.max(1.3, entry.ease - 0.2),
      reps:     0,
      nextDue:  addDays(1),
    }
  }
  save(srs)
}

/**
 * Returns question IDs from the provided list that are due today or overdue.
 * A question that has never been answered is NOT due (it belongs in normal quiz flow).
 */
export function getDueIds(questions) {
  const srs = load()
  const t   = today()
  return questions
    .filter(q => srs[q.id]?.nextDue <= t)
    .map(q => q.id)
}

/** Total due count across a list of questions. */
export function getDueCount(questions) {
  return getDueIds(questions).length
}

/**
 * Sort a question list so due questions come first, then unseen, then mastered.
 * Useful for prioritising without changing total count.
 */
export function sortByDue(questions) {
  const srs = load()
  const t   = today()
  return [...questions].sort((a, b) => {
    const da = srs[a.id]?.nextDue
    const db = srs[b.id]?.nextDue
    const aScore = !da ? 1 : da <= t ? 0 : 2
    const bScore = !db ? 1 : db <= t ? 0 : 2
    return aScore - bScore
  })
}
