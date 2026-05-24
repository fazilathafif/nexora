/**
 * Functional — SAT/ACT recommender produces consistent results.
 *
 * The "recommender" in Nexora is the SRS engine: sortByDue + getDueIds
 * determine which questions to surface next.  These must be deterministic:
 * the same SRS state → the same order, every time.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { scheduleReview, getDueIds, getDueCount, sortByDue } from '../../lib/srs.js'
import { getQuestions } from '../../data/questions.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFakeQuestions(ids) {
  return ids.map(id => ({ id, q: `Question ${id}`, opts: ['a','b','c','d'], ans: 0, topic: 'Test', hint: '' }))
}

function setNextDue(questionId, dateStr) {
  const srs  = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
  srs[questionId] = { interval: 1, ease: 2.5, reps: 1, nextDue: dateStr }
  localStorage.setItem('nx_srs', JSON.stringify(srs))
}

// ── SAT questions exist ───────────────────────────────────────────────────────
describe('SAT / ACT question banks', () => {
  it('getQuestions returns SAT math questions', () => {
    const qs = getQuestions('sat', 'sat_math')
    expect(qs.length).toBeGreaterThan(0)
  })

  it('getQuestions returns SAT reading-and-writing questions', () => {
    const qs = getQuestions('sat', 'sat_rw')
    expect(qs.length).toBeGreaterThan(0)
  })

  it('getQuestions returns ACT English questions', () => {
    const qs = getQuestions('act', 'act_english')
    expect(qs.length).toBeGreaterThan(0)
  })

  it('getQuestions returns ACT Math questions', () => {
    const qs = getQuestions('act', 'act_math')
    expect(qs.length).toBeGreaterThan(0)
  })
})

// ── getDueIds is deterministic ────────────────────────────────────────────────
describe('getDueIds — determinism', () => {
  beforeEach(() => localStorage.clear())

  it('returns the same IDs on repeated calls with identical SRS state', () => {
    const questions = makeFakeQuestions(['sat_001', 'sat_002', 'sat_003'])
    const today = new Date().toISOString().split('T')[0]
    const past  = '2020-01-01'

    setNextDue('sat_001', past)
    setNextDue('sat_002', today)
    // sat_003 not due (no entry)

    const first  = getDueIds(questions)
    const second = getDueIds(questions)
    expect(first).toEqual(second)
  })

  it('a newly answered question is not immediately due again (correct answer)', () => {
    const questions = makeFakeQuestions(['sat_100'])
    scheduleReview('sat_100', true) // correct → schedules for future
    const due = getDueIds(questions)
    expect(due).not.toContain('sat_100')
  })

  it('an incorrectly answered question is due tomorrow', () => {
    scheduleReview('sat_200', false) // wrong → nextDue = tomorrow
    const srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    expect(srs['sat_200'].nextDue).toBe(tomorrow)
  })
})

// ── sortByDue is deterministic ────────────────────────────────────────────────
describe('sortByDue — determinism', () => {
  beforeEach(() => localStorage.clear())

  it('produces the same order on two consecutive calls', () => {
    const questions = makeFakeQuestions(['q1', 'q2', 'q3', 'q4'])
    setNextDue('q1', '2020-01-01') // overdue
    setNextDue('q4', '2020-01-01') // overdue

    const run1 = sortByDue(questions).map(q => q.id)
    const run2 = sortByDue(questions).map(q => q.id)
    expect(run1).toEqual(run2)
  })

  it('places overdue questions before unseen questions', () => {
    const questions = makeFakeQuestions(['new', 'overdue'])
    setNextDue('overdue', '2020-01-01')
    const sorted = sortByDue(questions).map(q => q.id)
    expect(sorted.indexOf('overdue')).toBeLessThan(sorted.indexOf('new'))
  })

  it('places unseen questions before mastered (far-future) questions', () => {
    const questions = makeFakeQuestions(['mastered', 'unseen'])
    setNextDue('mastered', '2099-01-01')
    const sorted = sortByDue(questions).map(q => q.id)
    expect(sorted.indexOf('unseen')).toBeLessThan(sorted.indexOf('mastered'))
  })

  it('getDueCount matches getDueIds length', () => {
    const questions = makeFakeQuestions(['a', 'b', 'c'])
    setNextDue('a', '2020-01-01')
    setNextDue('b', '2020-06-15')
    expect(getDueCount(questions)).toBe(getDueIds(questions).length)
  })
})

// ── scheduleReview SM-2 invariants ────────────────────────────────────────────
describe('scheduleReview — SM-2 algorithm consistency', () => {
  beforeEach(() => localStorage.clear())

  it('ease factor increases on correct answer (capped at 3.0)', () => {
    scheduleReview('sm2_001', true)
    const srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_001'].ease).toBeGreaterThan(2.5)
    expect(srs['sm2_001'].ease).toBeLessThanOrEqual(3.0)
  })

  it('ease factor decreases on wrong answer (floored at 1.3)', () => {
    scheduleReview('sm2_002', false)
    const srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_002'].ease).toBeGreaterThanOrEqual(1.3)
    expect(srs['sm2_002'].ease).toBeLessThan(2.5)
  })

  it('reps counter increments on correct, resets to 0 on wrong', () => {
    scheduleReview('sm2_003', true)
    scheduleReview('sm2_003', true)
    let srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_003'].reps).toBe(2)

    scheduleReview('sm2_003', false)
    srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_003'].reps).toBe(0)
  })

  it('first correct answer schedules review for 1 day later', () => {
    scheduleReview('sm2_004', true)
    const srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_004'].interval).toBe(1)
  })

  it('second correct answer schedules review for 6 days later', () => {
    scheduleReview('sm2_005', true) // reps → 1
    scheduleReview('sm2_005', true) // reps → 2
    const srs = JSON.parse(localStorage.getItem('nx_srs') ?? '{}')
    expect(srs['sm2_005'].interval).toBe(6)
  })
})
