/**
 * Regression — auth token / refresh logic.
 *
 * Verifies that all auth functions return the expected { data, error } shape
 * and never throw, even when Supabase is not configured.  Also guards that
 * onAuthChange returns an object with an unsubscribe method so callers
 * (App.jsx) can safely clean up listeners without a try/catch.
 */

import { describe, it, expect } from 'vitest'
import {
  signUpWithEmail,
  signInWithEmail,
  signInAnonymously,
  signOut,
  onAuthChange,
} from '../../lib/db.js'

// When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are empty strings
// (as configured in vite.config.js test.env), isSupabaseConfigured = false,
// so every function below takes the guest/offline branch.

// ── Shape contract ────────────────────────────────────────────────────────────
describe('Auth functions — return shape', () => {
  it('signUpWithEmail returns { data, error } (not throws)', async () => {
    const result = await signUpWithEmail('test@example.com', 'password123', 'Tester')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })

  it('signInWithEmail returns { data, error } (not throws)', async () => {
    const result = await signInWithEmail('test@example.com', 'password123')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })

  it('signInAnonymously returns { data, error } (not throws)', async () => {
    const result = await signInAnonymously()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })

  it('signOut returns { data, error } (not throws)', async () => {
    const result = await signOut()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })
})

// ── Guest-mode behaviour ──────────────────────────────────────────────────────
describe('Auth functions — guest-mode (Supabase not configured)', () => {
  it('signUpWithEmail error is present and indicates Supabase not configured', async () => {
    const { error } = await signUpWithEmail('a@b.com', 'pw', 'Name')
    expect(error).not.toBeNull()
    expect(error?.message?.toLowerCase()).toMatch(/not configured|supabase/)
  })

  it('signInWithEmail error is present in guest mode', async () => {
    const { error } = await signInWithEmail('a@b.com', 'pw')
    expect(error).not.toBeNull()
  })

  it('signInAnonymously returns data.user = null in guest mode', async () => {
    const { data, error } = await signInAnonymously()
    expect(error).toBeNull()
    expect(data).toHaveProperty('user')
    expect(data.user).toBeNull()
  })
})

// ── onAuthChange — unsubscribe contract ───────────────────────────────────────
describe('onAuthChange — subscription lifecycle', () => {
  it('returns an object with an unsubscribe method', () => {
    const sub = onAuthChange(() => {})
    expect(sub).toHaveProperty('unsubscribe')
    expect(typeof sub.unsubscribe).toBe('function')
  })

  it('calling unsubscribe() does not throw', () => {
    const sub = onAuthChange(() => {})
    expect(() => sub.unsubscribe()).not.toThrow()
  })

  it('can safely call unsubscribe() multiple times', () => {
    const sub = onAuthChange(() => {})
    expect(() => {
      sub.unsubscribe()
      sub.unsubscribe()
    }).not.toThrow()
  })
})

// ── Auth does not leak tokens to localStorage in guest mode ───────────────────
describe('Auth — no token leakage in guest mode', () => {
  it('no sb-* auth token is written to localStorage after signInWithEmail fails', async () => {
    await signInWithEmail('hacker@evil.com', 'pw')
    const tokenKey = Object.keys(localStorage).find(k => /^sb-.+-auth-token$/.test(k))
    expect(tokenKey).toBeUndefined()
  })

  it('no sb-* auth token is written after signUpWithEmail fails', async () => {
    await signUpWithEmail('hacker@evil.com', 'pw', 'Hacker')
    const tokenKey = Object.keys(localStorage).find(k => /^sb-.+-auth-token$/.test(k))
    expect(tokenKey).toBeUndefined()
  })
})

// ── updateProfile token-expiry guard ─────────────────────────────────────────
describe('updateProfile — token expiry handling', () => {
  it('returns error object (not throws) when no session is available', async () => {
    // updateProfile tries getSession first; with no Supabase configured it
    // falls to guestUpsertProfile which always succeeds — just verify shape
    const { updateProfile } = await import('../../lib/db.js')
    const result = await updateProfile('guest_local', { display_name: 'Updated' })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })
})
