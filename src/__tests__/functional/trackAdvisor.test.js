/**
 * Functional — AI Track Advisor: fetchTrackRecommendation + rule-based fallback.
 *
 * All network calls are mocked so tests run offline.  The rule-based
 * fallback is the safety net for users with a slow or offline connection
 * and must produce valid, deterministic results for every input combination.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { fetchTrackRecommendation } from '../../lib/ai.js'

const VALID_STREAMS = new Set(['gcse', 'alevel', 'sat', 'act', 'ap', 'psat'])

afterEach(() => vi.restoreAllMocks())

// ── Return shape contract ─────────────────────────────────────────────────────
describe('fetchTrackRecommendation — return shape', () => {
  it('returns { tracks, reason } when the API responds successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: ['gcse'], reason: 'Year 10 UK student.' }),
    }))
    const result = await fetchTrackRecommendation({ country: 'uk', year: 10, goal: 'top' })
    expect(result).toHaveProperty('tracks')
    expect(result).toHaveProperty('reason')
    expect(Array.isArray(result.tracks)).toBe(true)
    expect(result.tracks.length).toBeGreaterThan(0)
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })

  it('tracks returned by the API contain only valid stream IDs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: ['sat', 'ap'], reason: 'US ivy-bound student.' }),
    }))
    const result = await fetchTrackRecommendation({ country: 'us', year: 11, goal: 'ivy' })
    result.tracks.forEach(t => expect(VALID_STREAMS.has(t)).toBe(true))
  })

  it('passes context payload to the edge function', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: ['sat'], reason: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await fetchTrackRecommendation({ country: 'us', year: 10, goal: 'top' })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toMatchObject({ country: 'us', year: 10, goal: 'top' })
  })
})

// ── UK rule-based fallback ────────────────────────────────────────────────────
describe('Rule-based fallback — UK', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  })

  it('Year 8 UK student → gcse', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'uk', year: 8, goal: 'top' })
    expect(tracks).toContain('gcse')
    expect(tracks).not.toContain('alevel')
  })

  it('Year 10 UK student → gcse', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'uk', year: 10, goal: 'top' })
    expect(tracks).toContain('gcse')
  })

  it('Year 11 UK student → gcse (upper boundary)', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'uk', year: 11, goal: 'top' })
    expect(tracks).toContain('gcse')
    expect(tracks).not.toContain('alevel')
  })

  it('Year 12 UK student → alevel (lower boundary)', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'uk', year: 12, goal: 'ivy' })
    expect(tracks).toContain('alevel')
    expect(tracks).not.toContain('gcse')
  })

  it('Year 13 UK student → alevel', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'uk', year: 13, goal: 'top' })
    expect(tracks).toContain('alevel')
  })

  it('UK fallback reason references the recommended track name', async () => {
    const { reason } = await fetchTrackRecommendation({ country: 'uk', year: 10, goal: 'other' })
    expect(reason.toLowerCase()).toMatch(/gcse/)
  })

  it('UK fallback reason includes the year number', async () => {
    const { reason } = await fetchTrackRecommendation({ country: 'uk', year: 9, goal: 'other' })
    expect(reason).toContain('9')
  })
})

// ── US rule-based fallback ────────────────────────────────────────────────────
describe('Rule-based fallback — US', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  })

  it('US ivy goal → sat + ap', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'us', year: 11, goal: 'ivy' })
    expect(tracks).toContain('sat')
    expect(tracks).toContain('ap')
    expect(tracks).not.toContain('act')
  })

  it('US top goal → sat + act (not ap)', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'us', year: 10, goal: 'top' })
    expect(tracks).toContain('sat')
    expect(tracks).toContain('act')
    expect(tracks).not.toContain('ap')
  })

  it('US other/unsure goal → sat + act', async () => {
    const { tracks } = await fetchTrackRecommendation({ country: 'us', year: 11, goal: 'other' })
    expect(tracks).toContain('sat')
    expect(tracks).toContain('act')
  })

  it('US ivy reason mentions selective universities', async () => {
    const { reason } = await fetchTrackRecommendation({ country: 'us', year: 11, goal: 'ivy' })
    expect(reason.toLowerCase()).toMatch(/selectiv|ivy|university/)
  })

  it('US non-ivy reason mentions college', async () => {
    const { reason } = await fetchTrackRecommendation({ country: 'us', year: 10, goal: 'other' })
    expect(reason.toLowerCase()).toMatch(/college/)
  })

  it('US fallback tracks are all valid stream IDs', async () => {
    const goals = ['ivy', 'top', 'other']
    for (const goal of goals) {
      const { tracks } = await fetchTrackRecommendation({ country: 'us', year: 10, goal })
      tracks.forEach(t => expect(VALID_STREAMS.has(t)).toBe(true))
    }
  })
})

// ── Fallback trigger conditions ───────────────────────────────────────────────
describe('Fallback triggers', () => {
  it('non-2xx HTTP response falls back to rule-based result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const result = await fetchTrackRecommendation({ country: 'uk', year: 10, goal: 'top' })
    expect(result).toHaveProperty('tracks')
    expect(result.tracks).toContain('gcse')
  })

  it('non-2xx 503 falls back — does not throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    await expect(
      fetchTrackRecommendation({ country: 'us', year: 11, goal: 'ivy' })
    ).resolves.toMatchObject({ tracks: expect.any(Array) })
  })

  it('network failure (TypeError) falls back gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const result = await fetchTrackRecommendation({ country: 'us', year: 11, goal: 'ivy' })
    expect(result.tracks).toContain('sat')
    expect(result.tracks).toContain('ap')
  })

  it('AbortError (12s timeout) falls back gracefully — does not throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))
    const result = await fetchTrackRecommendation({ country: 'uk', year: 12, goal: 'top' })
    expect(result).toHaveProperty('tracks')
    expect(result).toHaveProperty('reason')
    expect(result.tracks.length).toBeGreaterThan(0)
  })

  it('fetch being unavailable (undefined) falls back — does not throw', async () => {
    vi.stubGlobal('fetch', undefined)
    await expect(
      fetchTrackRecommendation({ country: 'us', year: 9, goal: 'other' })
    ).resolves.toHaveProperty('tracks')
  })
})

// ── Idempotency / determinism ─────────────────────────────────────────────────
describe('Fallback determinism', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('same context always returns the same tracks (no randomness)', async () => {
    const ctx = { country: 'uk', year: 10, goal: 'top' }
    const r1 = await fetchTrackRecommendation(ctx)
    const r2 = await fetchTrackRecommendation(ctx)
    expect(r1.tracks).toEqual(r2.tracks)
  })

  it('different contexts return different track recommendations', async () => {
    const uk  = await fetchTrackRecommendation({ country: 'uk', year: 10, goal: 'top' })
    const us  = await fetchTrackRecommendation({ country: 'us', year: 10, goal: 'ivy' })
    expect(uk.tracks).not.toEqual(us.tracks)
  })
})
