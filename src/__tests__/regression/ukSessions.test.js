/**
 * Regression — UK session display format.
 *
 * Guards against breaking changes to the session / answer record shape
 * as seen by the ProgressPage and ResultPage.  All assertions run in
 * guest mode (localStorage) — no real Supabase connection required.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createSession,
  completeSession,
  recordAnswer,
  getTopicStats,
  getWeeklyActivity,
  touchDailyActivity,
} from '../../lib/db.js'

// ── Session record shape ──────────────────────────────────────────────────────
describe('UK sessions — createSession return shape', () => {
  it('createSession returns { data: { id }, error: null }', async () => {
    const { data, error } = await createSession({
      userId: 'uk_user_1',
      stream: 'gcse',
      subject: 'maths',
      totalQuestions: 10,
    })
    expect(error).toBeNull()
    expect(data).toHaveProperty('id')
    expect(typeof data.id).toBe('string')
    expect(data.id.length).toBeGreaterThan(0)
  })

  it('createSession for A-Level stream returns valid id', async () => {
    const { data, error } = await createSession({
      userId: 'uk_user_2',
      stream: 'alevel',
      subject: 'ucat',
      totalQuestions: 20,
    })
    expect(error).toBeNull()
    expect(data.id).toBeTruthy()
  })

  it('completeSession returns { data: null, error: null } in guest mode', async () => {
    const { data, error } = await completeSession('session_xyz', { score: 8, durationSeconds: 120 })
    expect(error).toBeNull()
  })
})

// ── Answer record shape ───────────────────────────────────────────────────────
describe('UK sessions — answer record shape', () => {
  it('recordAnswer returns { data, error: null }', async () => {
    const { error } = await recordAnswer({
      sessionId: 'sess_uk',
      userId: 'uk_user_3',
      questionId: 'gcse_maths_001',
      topic: 'Algebra',
      chosenIndex: 1,
      correctIndex: 1,
      hintUsed: false,
      stream: 'gcse',
    })
    expect(error).toBeNull()
  })

  it('is_correct is true when chosenIndex === correctIndex', async () => {
    await recordAnswer({
      sessionId: 's', userId: 'u', questionId: 'q1',
      topic: 'Algebra', chosenIndex: 2, correctIndex: 2, hintUsed: false, stream: 'gcse',
    })
    const { data } = await getTopicStats('u', 'gcse')
    const algebra = data.find(s => s.topic === 'Algebra')
    expect(algebra?.is_correct).toBe(true)
  })

  it('is_correct is false when chosenIndex !== correctIndex', async () => {
    await recordAnswer({
      sessionId: 's2', userId: 'u2', questionId: 'q2',
      topic: 'Number', chosenIndex: 0, correctIndex: 3, hintUsed: false, stream: 'gcse',
    })
    const { data } = await getTopicStats('u2', 'gcse')
    const number = data.find(s => s.topic === 'Number')
    expect(number?.is_correct).toBe(false)
  })
})

// ── Weekly activity shape (Progress screen heatmap) ───────────────────────────
describe('UK sessions — weekly activity shape', () => {
  beforeEach(() => localStorage.clear())

  it('getWeeklyActivity returns { data: [], error: null } before any activity', async () => {
    const { data, error } = await getWeeklyActivity('fresh_user')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('touchDailyActivity records today and getWeeklyActivity returns it', async () => {
    await touchDailyActivity('u_activity')
    const { data } = await getWeeklyActivity('u_activity')
    const today = new Date().toISOString().split('T')[0]
    expect(data.some(r => r.date === today)).toBe(true)
  })

  it('weekly activity entries have { date, sessions } shape', async () => {
    await touchDailyActivity('u_shape')
    const { data } = await getWeeklyActivity('u_shape')
    data.forEach(entry => {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('sessions')
      expect(typeof entry.date).toBe('string')
      expect(typeof entry.sessions).toBe('number')
    })
  })

  it('date values in weekly activity are YYYY-MM-DD format', async () => {
    await touchDailyActivity('u_date_fmt')
    const { data } = await getWeeklyActivity('u_date_fmt')
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    data.forEach(entry => {
      expect(entry.date).toMatch(datePattern)
    })
  })
})

// ── getTopicStats shape (ProgressPage + readiness gauge) ─────────────────────
describe('UK sessions — getTopicStats return shape', () => {
  it('returns array of { topic, is_correct } for GCSE stream', async () => {
    await recordAnswer({ sessionId: 's', userId: 'ts_user', questionId: 'q1', topic: 'Algebra',  chosenIndex: 0, correctIndex: 0, hintUsed: false, stream: 'gcse' })
    await recordAnswer({ sessionId: 's', userId: 'ts_user', questionId: 'q2', topic: 'Geometry', chosenIndex: 1, correctIndex: 0, hintUsed: false, stream: 'gcse' })

    const { data, error } = await getTopicStats('ts_user', 'gcse')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)
    data.forEach(stat => {
      expect(Object.keys(stat)).toContain('topic')
      expect(Object.keys(stat)).toContain('is_correct')
    })
  })

  it('returns array of { topic, is_correct } for A-Level stream', async () => {
    await recordAnswer({ sessionId: 's', userId: 'al_user', questionId: 'q1', topic: 'Abstract Reasoning', chosenIndex: 2, correctIndex: 2, hintUsed: false, stream: 'alevel' })
    const { data } = await getTopicStats('al_user', 'alevel')
    expect(data).toHaveLength(1)
    expect(data[0].topic).toBe('Abstract Reasoning')
  })
})

// ── Guest profile schema stability ───────────────────────────────────────────
describe('UK sessions — guest profile schema unchanged', () => {
  it('getProfile returns object with xp, streak, stream fields', async () => {
    localStorage.setItem('nx_guest_profile', JSON.stringify({
      id: 'guest_local', xp: 250, streak: 7, stream: 'gcse', streams: ['gcse'],
      active_stream: 'gcse', display_name: 'Test Student',
    }))
    const { getProfile } = await import('../../lib/db.js')
    const { data, error } = await getProfile('guest_local')
    expect(error).toBeNull()
    expect(data).toHaveProperty('xp')
    expect(data).toHaveProperty('streak')
    expect(data).toHaveProperty('stream')
    expect(data.xp).toBe(250)
    expect(data.streak).toBe(7)
  })
})
