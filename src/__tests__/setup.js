import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// ── localStorage shim ─────────────────────────────────────────────────────────
// jsdom includes a localStorage implementation; clear it between tests so
// SRS / guest-profile / checklist data never bleeds across cases.
afterEach(() => {
  localStorage.clear()
})

// ── matchMedia stub ───────────────────────────────────────────────────────────
// jsdom doesn't implement window.matchMedia; several components call it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ── navigator.share stub ──────────────────────────────────────────────────────
Object.defineProperty(navigator, 'share', { writable: true, configurable: true, value: undefined })

// ── ResizeObserver stub ───────────────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ── IntersectionObserver stub ─────────────────────────────────────────────────
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
