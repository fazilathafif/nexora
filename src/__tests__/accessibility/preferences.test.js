/**
 * Accessibility — applyPreferences DOM effects.
 *
 * Verifies every accessibility preference immediately mutates the DOM
 * without requiring an app restart.  These tests exercise the
 * applyPreferences() function from src/lib/preferences.js.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { applyPreferences, PREF_DEFAULTS } from '../../lib/preferences.js'

const SVG_FILTER_ID = 'nx-cb-filter'

beforeEach(() => {
  // Reset DOM state between tests
  document.body.className = ''
  document.documentElement.style.zoom = ''
  const svg = document.getElementById(SVG_FILTER_ID + '-svg')
  if (svg) svg.remove()
  const style = document.getElementById(SVG_FILTER_ID + '-style')
  if (style) style.remove()
})

// ── Dyslexia font mode ────────────────────────────────────────────────────────
describe('Dyslexia-friendly font', () => {
  it('applies nx-dyslexia class when dyslexia_font = true', () => {
    applyPreferences({ dyslexia_font: true })
    expect(document.body.classList.contains('nx-dyslexia')).toBe(true)
  })

  it('removes nx-dyslexia class when dyslexia_font = false', () => {
    document.body.classList.add('nx-dyslexia')
    applyPreferences({ dyslexia_font: false })
    expect(document.body.classList.contains('nx-dyslexia')).toBe(false)
  })

  it('applies globally without restart — repeated calls update the DOM immediately', () => {
    applyPreferences({ dyslexia_font: false })
    expect(document.body.classList.contains('nx-dyslexia')).toBe(false)
    applyPreferences({ dyslexia_font: true })
    expect(document.body.classList.contains('nx-dyslexia')).toBe(true)
    applyPreferences({ dyslexia_font: false })
    expect(document.body.classList.contains('nx-dyslexia')).toBe(false)
  })
})

// ── High contrast mode ────────────────────────────────────────────────────────
describe('High contrast mode', () => {
  it('applies nx-high-contrast class when high_contrast = true', () => {
    applyPreferences({ high_contrast: true })
    expect(document.body.classList.contains('nx-high-contrast')).toBe(true)
  })

  it('removes nx-high-contrast class when high_contrast = false', () => {
    document.body.classList.add('nx-high-contrast')
    applyPreferences({ high_contrast: false })
    expect(document.body.classList.contains('nx-high-contrast')).toBe(false)
  })

  it('high contrast applies alongside dyslexia font (both active at once)', () => {
    applyPreferences({ high_contrast: true, dyslexia_font: true })
    expect(document.body.classList.contains('nx-high-contrast')).toBe(true)
    expect(document.body.classList.contains('nx-dyslexia')).toBe(true)
  })
})

// ── Reduce motion ─────────────────────────────────────────────────────────────
describe('Reduce motion', () => {
  it('applies nx-reduce-motion class when reduce_motion = true', () => {
    applyPreferences({ reduce_motion: true })
    expect(document.body.classList.contains('nx-reduce-motion')).toBe(true)
  })

  it('removes nx-reduce-motion class when reduce_motion = false', () => {
    document.body.classList.add('nx-reduce-motion')
    applyPreferences({ reduce_motion: false })
    expect(document.body.classList.contains('nx-reduce-motion')).toBe(false)
  })
})

// ── Colour-blind modes ────────────────────────────────────────────────────────
describe('Colour-blind modes', () => {
  const modes = ['deuteranopia', 'protanopia', 'tritanopia']

  modes.forEach(mode => {
    it(`${mode}: adds nx-cb-${mode} class`, () => {
      applyPreferences({ color_blind_mode: mode })
      expect(document.body.classList.contains(`nx-cb-${mode}`)).toBe(true)
    })

    it(`${mode}: injects SVG filter element into body`, () => {
      applyPreferences({ color_blind_mode: mode })
      const svg = document.getElementById(SVG_FILTER_ID + '-svg')
      expect(svg).not.toBeNull()
    })

    it(`${mode}: SVG contains a feColorMatrix with values`, () => {
      applyPreferences({ color_blind_mode: mode })
      const svg = document.getElementById(SVG_FILTER_ID + '-svg')
      const matrix = svg?.querySelector('feColorMatrix')
      expect(matrix).not.toBeNull()
      expect(matrix?.getAttribute('values')).toBeTruthy()
    })

    it(`${mode}: only ONE colour-blind class is applied at a time`, () => {
      const other = modes.filter(m => m !== mode)
      applyPreferences({ color_blind_mode: mode })
      other.forEach(m => {
        expect(document.body.classList.contains(`nx-cb-${m}`)).toBe(false)
      })
    })
  })

  it('switching from deuteranopia to protanopia removes deuteranopia class', () => {
    applyPreferences({ color_blind_mode: 'deuteranopia' })
    applyPreferences({ color_blind_mode: 'protanopia' })
    expect(document.body.classList.contains('nx-cb-deuteranopia')).toBe(false)
    expect(document.body.classList.contains('nx-cb-protanopia')).toBe(true)
  })

  it('setting mode to none removes all CB classes and SVG filter', () => {
    applyPreferences({ color_blind_mode: 'deuteranopia' })
    applyPreferences({ color_blind_mode: 'none' })
    modes.forEach(m => {
      expect(document.body.classList.contains(`nx-cb-${m}`)).toBe(false)
    })
    const svg = document.getElementById(SVG_FILTER_ID + '-svg')
    expect(svg).toBeNull()
  })

  it('colour-blind SVG filter applies css filter to body', () => {
    applyPreferences({ color_blind_mode: 'tritanopia' })
    const styleEl = document.getElementById(SVG_FILTER_ID + '-style')
    expect(styleEl?.textContent).toContain(`url(#${SVG_FILTER_ID})`)
  })
})

// ── Font size zoom ────────────────────────────────────────────────────────────
describe('Font size zoom', () => {
  const zoomExpected = { small: '0.88', medium: '1', large: '1.12', xl: '1.25' }

  Object.entries(zoomExpected).forEach(([size, zoom]) => {
    it(`font_size "${size}" sets documentElement zoom to ${zoom}`, () => {
      applyPreferences({ font_size: size })
      expect(document.documentElement.style.zoom).toBe(zoom)
    })
  })
})

// ── PREF_DEFAULTS are safe ────────────────────────────────────────────────────
describe('PREF_DEFAULTS', () => {
  it('applying PREF_DEFAULTS produces no active accessibility classes', () => {
    applyPreferences(PREF_DEFAULTS)
    expect(document.body.classList.contains('nx-high-contrast')).toBe(false)
    expect(document.body.classList.contains('nx-reduce-motion')).toBe(false)
    expect(document.body.classList.contains('nx-dyslexia')).toBe(false)
    expect(document.body.classList.contains('nx-cb-deuteranopia')).toBe(false)
    expect(document.body.classList.contains('nx-cb-protanopia')).toBe(false)
    expect(document.body.classList.contains('nx-cb-tritanopia')).toBe(false)
  })
})
