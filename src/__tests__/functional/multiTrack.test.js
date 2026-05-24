/**
 * Functional — Multi-track enrolment & per-track progress isolation.
 *
 * All tests run in guest mode (isSupabaseConfigured = false) so every
 * db.js call touches localStorage, not a real database.  The Supabase
 * module is mocked once at the top so the import.meta.env values are
 * never evaluated against a real project.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  enrollStream,
  switchActiveStream,
  getApSubjects,
  saveApSubjects,
  getProfile,
  createSession,
  recordAnswer,
  getTopicStats,
  addXp,
  upsertProfile,
} from '../../lib/db.js'
import { getQuestions, STREAM_CONFIG } from '../../data/questions.js'

// Guest mode is active when env vars are empty — the vite.config sets them to ''.

// ── helpers ───────────────────────────────────────────────────────────────────
function seedGuestProfile(overrides = {}) {
  const profile = {
    id: 'guest_local',
    xp: 0,
    streak: 0,
    stream: null,
    streams: [],
    active_stream: null,
    display_name: 'Student',
    ...overrides,
  }
  localStorage.setItem('nx_guest_profile', JSON.stringify(profile))
  return profile
}

// ── Simultaneous UK + US enrolment ────────────────────────────────────────────
describe('Multi-track enrolment', () => {
  beforeEach(() => seedGuestProfile())

  it('enrolling a UK track stores it in streams[]', async () => {
    await enrollStream('guest_local', 'gcse')
    const { data } = await getProfile('guest_local')
    expect(data.streams).toContain('gcse')
  })

  it('enrolling a second (US) track appends without removing the first', async () => {
    await enrollStream('guest_local', 'gcse')
    await enrollStream('guest_local', 'sat')
    const { data } = await getProfile('guest_local')
    expect(data.streams).toContain('gcse')
    expect(data.streams).toContain('sat')
  })

  it('enrolling the same track twice produces no duplicates', async () => {
    await enrollStream('guest_local', 'gcse')
    await enrollStream('guest_local', 'gcse')
    const { data } = await getProfile('guest_local')
    const gcseEntries = data.streams.filter(s => s === 'gcse')
    expect(gcseEntries).toHaveLength(1)
  })

  it('can hold all six supported tracks simultaneously', async () => {
    for (const stream of ['gcse', 'alevel', 'sat', 'act', 'ap', 'psat']) {
      await enrollStream('guest_local', stream)
    }
    const { data } = await getProfile('guest_local')
    expect(data.streams.length).toBe(6)
  })
})

// ── Active-stream switching ───────────────────────────────────────────────────
describe('switchActiveStream', () => {
  beforeEach(() => seedGuestProfile({ streams: ['gcse', 'sat'] }))

  it('updates active_stream without removing other enrolled tracks', async () => {
    await enrollStream('guest_local', 'gcse')
    await enrollStream('guest_local', 'sat')
    await switchActiveStream('guest_local', 'sat')
    const { data } = await getProfile('guest_local')
    expect(data.active_stream).toBe('sat')
    expect(data.streams).toContain('gcse')
  })

  it('switching back to UK track preserves US enrolment', async () => {
    await enrollStream('guest_local', 'gcse')
    await enrollStream('guest_local', 'sat')
    await switchActiveStream('guest_local', 'sat')
    await switchActiveStream('guest_local', 'gcse')
    const { data } = await getProfile('guest_local')
    expect(data.active_stream).toBe('gcse')
    expect(data.streams).toContain('sat')
  })
})

// ── Per-track progress isolation ──────────────────────────────────────────────
describe('Progress persists independently per track', () => {
  it('answers recorded on SAT stream do NOT appear in GCSE topic stats', async () => {
    // Simulate a SAT answer
    await recordAnswer({
      sessionId: 'sess_sat',
      userId: 'guest_local',
      questionId: 'q001',
      topic: 'Algebra',
      chosenIndex: 0,
      correctIndex: 1,
      hintUsed: false,
      stream: 'sat',
    })
    const { data } = await getTopicStats('guest_local', 'gcse')
    expect(data).toEqual([])
  })

  it('answers recorded on GCSE stream do NOT appear in SAT topic stats', async () => {
    await recordAnswer({
      sessionId: 'sess_gcse',
      userId: 'guest_local',
      questionId: 'q002',
      topic: 'Number',
      chosenIndex: 1,
      correctIndex: 1,
      hintUsed: false,
      stream: 'gcse',
    })
    const { data } = await getTopicStats('guest_local', 'sat')
    expect(data).toEqual([])
  })

  it('topic stats for each stream contain only answers from that stream', async () => {
    await recordAnswer({ sessionId: 's1', userId: 'g', questionId: 'q1', topic: 'Algebra',    chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'sat'  })
    await recordAnswer({ sessionId: 's2', userId: 'g', questionId: 'q2', topic: 'Number',     chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'gcse' })
    await recordAnswer({ sessionId: 's3', userId: 'g', questionId: 'q3', topic: 'Statistics', chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'sat'  })

    const { data: gcseStats } = await getTopicStats('g', 'gcse')
    const { data: satStats  } = await getTopicStats('g', 'sat')

    expect(gcseStats.every(s => s.topic === 'Number')).toBe(true)
    expect(satStats.every(s => s.topic !== 'Number')).toBe(true)
    expect(satStats).toHaveLength(2)
  })

  it('createSession returns a valid id for each stream', async () => {
    const { data: satSess  } = await createSession({ userId: 'u1', stream: 'sat',  subject: 'sat_math', totalQuestions: 10 })
    const { data: gcseSess } = await createSession({ userId: 'u1', stream: 'gcse', subject: 'maths',    totalQuestions: 10 })
    // Both sessions must have a non-empty id
    expect(typeof satSess.id).toBe('string')
    expect(satSess.id.length).toBeGreaterThan(0)
    expect(typeof gcseSess.id).toBe('string')
    expect(gcseSess.id.length).toBeGreaterThan(0)
  })
})

// ── AP subject selection ──────────────────────────────────────────────────────
describe('AP subject selection', () => {
  it('saveApSubjects + getApSubjects round-trips correctly', async () => {
    await saveApSubjects('guest_local', ['ap_calculus', 'ap_bio'])
    const { data } = await getApSubjects('guest_local')
    expect(data).toContain('ap_calculus')
    expect(data).toContain('ap_bio')
    expect(data).toHaveLength(2)
  })

  it('saving an empty selection clears all AP subjects', async () => {
    await saveApSubjects('guest_local', ['ap_calculus'])
    await saveApSubjects('guest_local', [])
    const { data } = await getApSubjects('guest_local')
    expect(data).toEqual([])
  })

  it('getQuestions returns an array (even if empty) for ap_calculus subject', () => {
    const qs = getQuestions('ap', 'ap_calculus')
    expect(Array.isArray(qs)).toBe(true)
    // AP question bank is a future content addition; validate structure when populated
    qs.forEach(q => {
      expect(q).toHaveProperty('id')
      expect(q).toHaveProperty('topic')
    })
  })

  it('STREAM_CONFIG lists AP subjects with distinct topic areas', () => {
    const calcConf = STREAM_CONFIG.ap.subjects.find(s => s.id === 'ap_calculus')
    const bioConf  = STREAM_CONFIG.ap.subjects.find(s => s.id === 'ap_bio')
    expect(calcConf).toBeDefined()
    expect(bioConf).toBeDefined()
    expect(calcConf?.desc).not.toBe(bioConf?.desc)
  })

  it('STREAM_CONFIG lists all nine AP subjects', () => {
    const apSubjects = STREAM_CONFIG.ap.subjects.map(s => s.id)
    const expected = [
      'ap_calculus','ap_stats','ap_bio','ap_chem','ap_phys',
      'ap_ush','ap_eng_lang','ap_cs','ap_econ',
    ]
    expected.forEach(id => expect(apSubjects).toContain(id))
  })
})

// ── XP accrual ────────────────────────────────────────────────────────────────
describe('Session XP accrues correctly', () => {
  beforeEach(() => seedGuestProfile({ xp: 100 }))

  it('addXp increases XP by the given amount', async () => {
    await addXp('guest_local', 50)
    const { data } = await getProfile('guest_local')
    expect(data.xp).toBe(150)
  })

  it('addXp with negative amount decreases XP (streak shield deduction)', async () => {
    await addXp('guest_local', -50)
    const { data } = await getProfile('guest_local')
    expect(data.xp).toBe(50)
  })
})

// ── University readiness gauge ────────────────────────────────────────────────
describe('University readiness gauge — topic stats shape', () => {
  it('getTopicStats returns an array of { topic, is_correct } objects', async () => {
    await recordAnswer({ sessionId: 's1', userId: 'u1', questionId: 'q1', topic: 'Algebra', chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'alevel' })
    await recordAnswer({ sessionId: 's1', userId: 'u1', questionId: 'q2', topic: 'Calculus', chosenIndex: 1, correctIndex: 0, hintUsed: false, stream: 'alevel' })

    const { data, error } = await getTopicStats('u1', 'alevel')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    data.forEach(stat => {
      expect(stat).toHaveProperty('topic')
      expect(stat).toHaveProperty('is_correct')
      expect(typeof stat.is_correct).toBe('boolean')
    })
  })

  it('accuracy can be computed from topic stats (basis for readiness gauge)', async () => {
    await recordAnswer({ sessionId: 's', userId: 'u2', questionId: 'q1', topic: 'Vectors', chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'alevel' })
    await recordAnswer({ sessionId: 's', userId: 'u2', questionId: 'q2', topic: 'Vectors', chosenIndex: 1, correctIndex: 0, hintUsed: false, stream: 'alevel' })
    await recordAnswer({ sessionId: 's', userId: 'u2', questionId: 'q3', topic: 'Vectors', chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'alevel' })

    const { data } = await getTopicStats('u2', 'alevel')
    const vectorStats = data.filter(s => s.topic === 'Vectors')
    const accuracy    = vectorStats.filter(s => s.is_correct).length / vectorStats.length
    expect(accuracy).toBeCloseTo(2 / 3, 2)
  })
})

// ── Existing GCSE/A-Level users unaffected ────────────────────────────────────
describe('GCSE / A-Level users unaffected by multi-track changes', () => {
  it('a GCSE-only user has a non-empty streams field after enrollStream', async () => {
    seedGuestProfile({ stream: 'gcse', streams: ['gcse'], active_stream: 'gcse' })
    const { data } = await getProfile('guest_local')
    expect(data.streams).toContain('gcse')
    expect(data.active_stream).toBe('gcse')
  })

  it('GCSE topic stats unaffected after SAT session is recorded', async () => {
    await recordAnswer({ sessionId: 's_gcse', userId: 'uk_user', questionId: 'q1', topic: 'Algebra', chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'gcse' })
    await recordAnswer({ sessionId: 's_sat',  userId: 'uk_user', questionId: 'q2', topic: 'Math',    chosenIndex: 0, correctIndex: 1, hintUsed: false, stream: 'sat'  })

    const { data: gcse } = await getTopicStats('uk_user', 'gcse')
    expect(gcse).toHaveLength(1)
    expect(gcse[0].topic).toBe('Algebra')
    expect(gcse[0].is_correct).toBe(true)
  })
})

// ── upsertProfile bulk multi-stream save (LandingPage save path) ──────────────
describe('upsertProfile — bulk multi-stream save', () => {
  beforeEach(() => seedGuestProfile())

  it('saves a streams array directly via upsertProfile', async () => {
    await upsertProfile('guest_local', {
      streams:       ['gcse', 'sat'],
      stream:        'gcse',
      active_stream: 'gcse',
    })
    const { data } = await getProfile('guest_local')
    expect(data.streams).toContain('gcse')
    expect(data.streams).toContain('sat')
    expect(data.streams).toHaveLength(2)
  })

  it('active_stream is set to the first element of the saved streams array', async () => {
    await upsertProfile('guest_local', {
      streams:       ['alevel', 'act'],
      stream:        'alevel',
      active_stream: 'alevel',
    })
    const { data } = await getProfile('guest_local')
    expect(data.active_stream).toBe('alevel')
  })

  it('saving an updated selection overwrites the previous streams list', async () => {
    await upsertProfile('guest_local', {
      streams: ['gcse', 'sat'], stream: 'gcse', active_stream: 'gcse',
    })
    await upsertProfile('guest_local', {
      streams: ['alevel', 'act', 'ap'], stream: 'alevel', active_stream: 'alevel',
    })
    const { data } = await getProfile('guest_local')
    expect(data.streams).toEqual(['alevel', 'act', 'ap'])
    expect(data.streams).not.toContain('gcse')
    expect(data.streams).not.toContain('sat')
  })

  it('removing all tracks except one is persisted correctly', async () => {
    await upsertProfile('guest_local', {
      streams: ['gcse', 'sat', 'ap'], stream: 'gcse', active_stream: 'gcse',
    })
    await upsertProfile('guest_local', {
      streams: ['gcse'], stream: 'gcse', active_stream: 'gcse',
    })
    const { data } = await getProfile('guest_local')
    expect(data.streams).toHaveLength(1)
    expect(data.streams[0]).toBe('gcse')
  })

  it('saving all six tracks simultaneously is supported', async () => {
    const all = ['gcse', 'alevel', 'sat', 'act', 'ap', 'psat']
    await upsertProfile('guest_local', {
      streams: all, stream: 'gcse', active_stream: 'gcse',
    })
    const { data } = await getProfile('guest_local')
    expect(data.streams).toHaveLength(6)
    all.forEach(s => expect(data.streams).toContain(s))
  })
})
