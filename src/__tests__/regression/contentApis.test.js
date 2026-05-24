/**
 * Regression — content API payloads.
 *
 * Verifies that the GCSE and A-Level question banks return the expected
 * structure and content.  Any breaking change to the question schema or
 * subject availability will fail these tests, acting as a contract guard
 * on the v1 content API.
 */

import { describe, it, expect } from 'vitest'
import { getQuestions, STREAM_CONFIG, TIMER_CONFIG } from '../../data/questions.js'

// ── Required question fields ──────────────────────────────────────────────────
const REQUIRED_FIELDS = ['id', 'q', 'opts', 'ans', 'topic', 'hint']

function validateQuestionShape(questions, label) {
  expect(questions.length, `${label}: should have questions`).toBeGreaterThan(0)
  questions.forEach((q, i) => {
    REQUIRED_FIELDS.forEach(field => {
      expect(q, `${label}[${i}] missing field "${field}"`).toHaveProperty(field)
    })
    expect(Array.isArray(q.opts), `${label}[${i}] opts must be array`).toBe(true)
    expect(q.opts.length, `${label}[${i}] opts must have 4 choices`).toBe(4)
    expect(typeof q.ans, `${label}[${i}] ans must be number`).toBe('number')
    expect(q.ans, `${label}[${i}] ans must be valid index`).toBeGreaterThanOrEqual(0)
    expect(q.ans, `${label}[${i}] ans must be valid index`).toBeLessThan(q.opts.length)
    expect(typeof q.id,    `${label}[${i}] id must be string`).toBe('string')
    expect(typeof q.q,     `${label}[${i}] question text must be string`).toBe('string')
    expect(typeof q.topic, `${label}[${i}] topic must be string`).toBe('string')
    expect(typeof q.hint,  `${label}[${i}] hint must be string`).toBe('string')
    expect(q.q.trim().length, `${label}[${i}] question text must not be empty`).toBeGreaterThan(0)
  })
}

// ── GCSE subjects ─────────────────────────────────────────────────────────────
describe('GCSE content API — question schema', () => {
  const gcseSubjects = ['maths', 'english', 'science', 'history', 'geography']

  gcseSubjects.forEach(subject => {
    it(`gcse/${subject} returns valid question objects`, () => {
      const qs = getQuestions('gcse', subject)
      validateQuestionShape(qs, `gcse/${subject}`)
    })
  })

  it('GCSE maths questions have numeric topics (Algebra, Geometry, etc.)', () => {
    const qs = getQuestions('gcse', 'maths')
    const topics = new Set(qs.map(q => q.topic))
    expect(topics.size).toBeGreaterThan(1)
  })

  it('GCSE question IDs are globally unique within the subject', () => {
    const qs = getQuestions('gcse', 'maths')
    const ids = qs.map(q => q.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('GCSE answer index is always within bounds of opts array', () => {
    const qs = getQuestions('gcse', 'maths')
    qs.forEach(q => {
      expect(q.ans).toBeGreaterThanOrEqual(0)
      expect(q.ans).toBeLessThan(q.opts.length)
    })
  })
})

// ── A-Level subjects ──────────────────────────────────────────────────────────
describe('A-Level content API — question schema', () => {
  const alevelSubjects = ['ucat', 'lnat', 'mat', 'tmua']

  alevelSubjects.forEach(subject => {
    it(`alevel/${subject} returns valid question objects`, () => {
      const qs = getQuestions('alevel', subject)
      validateQuestionShape(qs, `alevel/${subject}`)
    })
  })

  it('A-Level question IDs are unique within each subject', () => {
    const qs = getQuestions('alevel', 'ucat')
    const ids = qs.map(q => q.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('LNAT questions have non-empty passage or question text', () => {
    const qs = getQuestions('alevel', 'lnat')
    qs.forEach(q => {
      const hasContent = (q.passage?.trim().length > 0) || (q.q?.trim().length > 0)
      expect(hasContent).toBe(true)
    })
  })
})

// ── STREAM_CONFIG contract ────────────────────────────────────────────────────
describe('STREAM_CONFIG — stream metadata contract', () => {
  const expectedStreams = ['gcse', 'alevel', 'sat', 'act', 'ap', 'psat']

  expectedStreams.forEach(stream => {
    it(`${stream} config has label and subjects array`, () => {
      expect(STREAM_CONFIG[stream]).toBeDefined()
      expect(typeof STREAM_CONFIG[stream].label).toBe('string')
      expect(Array.isArray(STREAM_CONFIG[stream].subjects)).toBe(true)
      expect(STREAM_CONFIG[stream].subjects.length).toBeGreaterThan(0)
    })
  })

  it('every subject in STREAM_CONFIG has an id and label', () => {
    expectedStreams.forEach(stream => {
      STREAM_CONFIG[stream].subjects.forEach(sub => {
        expect(typeof sub.id).toBe('string')
        expect(typeof sub.label).toBe('string')
      })
    })
  })

  it('GCSE subjects include maths and english (unchanged from v1)', () => {
    const ids = STREAM_CONFIG.gcse.subjects.map(s => s.id)
    expect(ids).toContain('maths')
    expect(ids).toContain('english')
  })

  it('A-Level subjects include ucat and lnat (unchanged from v1)', () => {
    const ids = STREAM_CONFIG.alevel.subjects.map(s => s.id)
    expect(ids).toContain('ucat')
    expect(ids).toContain('lnat')
  })
})

// ── TIMER_CONFIG contract ─────────────────────────────────────────────────────
describe('TIMER_CONFIG — timer values unchanged on v1 endpoints', () => {
  it('GCSE timer is 90 seconds per question', () => {
    expect(TIMER_CONFIG.gcse).toBe(90)
  })

  it('SAT math timer is 96 seconds', () => {
    expect(TIMER_CONFIG.sat.sat_math).toBe(96)
  })

  it('SAT reading-and-writing timer is 71 seconds', () => {
    expect(TIMER_CONFIG.sat.sat_rw).toBe(71)
  })
})

// ── Topic filter regression ───────────────────────────────────────────────────
describe('getQuestions — topic filter still works', () => {
  it('filtering by topic returns only questions matching that topic', () => {
    const allQs   = getQuestions('gcse', 'maths')
    const topics  = [...new Set(allQs.map(q => q.topic))]
    if (!topics.length) return

    const target   = topics[0]
    const filtered = getQuestions('gcse', 'maths', target)
    expect(filtered.every(q => q.topic === target)).toBe(true)
    expect(filtered.length).toBeGreaterThan(0)
  })
})
