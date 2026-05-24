/**
 * Accessibility — keyboard-only navigation.
 *
 * Uses @testing-library/user-event (keyboard simulation) to verify that
 * interactive elements in the Wellbeing Hub and other key surfaces are
 * reachable and activatable without a mouse.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import WellbeingPage from '../../pages/WellbeingPage.jsx'

function renderWellbeing(stream = 'gcse') {
  return render(
    <MemoryRouter initialEntries={[`/${stream}/wellbeing`]}>
      <Routes>
        <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tab focus reaches interactive controls ────────────────────────────────────
describe('Keyboard navigation — WellbeingPage', () => {
  it('Tab reaches the Back (←) button', async () => {
    const user = userEvent.setup()
    renderWellbeing()
    await user.tab()
    // The first focusable element on the page should be the back button
    const focused = document.activeElement
    expect(focused?.tagName).toBe('BUTTON')
  })

  it('Tab cycles through all breathing type toggle buttons', async () => {
    const user = userEvent.setup()
    renderWellbeing()
    // Tab through buttons and collect text
    const visited = new Set()
    for (let i = 0; i < 20; i++) {
      await user.tab()
      const el = document.activeElement
      if (el?.tagName === 'BUTTON') visited.add(el.textContent?.trim() ?? '')
    }
    expect([...visited].some(t => t.includes('Box'))).toBe(true)
    expect([...visited].some(t => t.includes('4-7-8'))).toBe(true)
  })

  it('Space activates the Start Breathing button', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    // Find start button explicitly and focus it
    const startBtn = screen.getByRole('button', { name: /Start Breathing/i })
    startBtn.focus()
    await user.keyboard(' ')

    // After activation the button label should switch to Pause
    const pauseBtn = screen.queryByRole('button', { name: /Pause/i })
    expect(pauseBtn).not.toBeNull()
  })

  it('Enter activates the Start Breathing button', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    const startBtn = screen.getByRole('button', { name: /Start Breathing/i })
    startBtn.focus()
    await user.keyboard('{Enter}')

    expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeNull()
  })

  it('keyboard activates breathing type toggle', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    const btn478 = screen.getByRole('button', { name: /4-7-8/i })
    btn478.focus()
    await user.keyboard(' ')
    // After activating 4-7-8, the description should mention 4 s, 7 s, 8 s
    expect(screen.getByText(/7 s|7 seconds|hold for 7/i)).toBeTruthy()
  })

  it('Tab reaches at least one checklist item button', async () => {
    const user = userEvent.setup()
    renderWellbeing()
    const visited = []
    for (let i = 0; i < 40; i++) {
      await user.tab()
      const el = document.activeElement
      if (el?.tagName === 'BUTTON') visited.push(el.textContent?.trim() ?? '')
    }
    // Checklist buttons include items like "Pack your pencil case"
    const hasChecklist = visited.some(t => t.toLowerCase().includes('pack') || t.toLowerCase().includes('breakfast'))
    expect(hasChecklist).toBe(true)
  })

  it('keyboard activates a checklist item (marks it checked)', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    // Find first checklist button by known text
    const packBtn = screen.getByRole('button', { name: /Pack your pencil case/i })
    packBtn.focus()
    await user.keyboard(' ')

    // After toggle the item should be visually marked — verify localStorage update
    const today = new Date().toISOString().split('T')[0]
    const stored = JSON.parse(localStorage.getItem(`nx_checklist_${today}`) ?? '[]')
    expect(stored).toContain('n1')
  })

  it('keyboard activates an anxiety tip to expand it', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    const reframeBtn = screen.getByRole('button', { name: /Cognitive Reframing/i })
    reframeBtn.focus()
    await user.keyboard(' ')

    // After expanding, the tip content should be visible
    expect(screen.getByText(/worst-case thought/i)).toBeTruthy()
  })

  it('pressing Space on expanded tip collapses it', async () => {
    const user = userEvent.setup()
    renderWellbeing()

    const reframeBtn = screen.getByRole('button', { name: /Cognitive Reframing/i })
    reframeBtn.focus()
    await user.keyboard(' ') // expand
    await user.keyboard(' ') // collapse

    expect(screen.queryByText(/worst-case thought/i)).toBeNull()
  })
})

// ── All streams are keyboard-navigable ───────────────────────────────────────
describe('Keyboard navigation — all streams render without errors', () => {
  const streams = ['gcse', 'alevel', 'sat', 'act', 'ap', 'psat']

  streams.forEach(stream => {
    it(`/${stream}/wellbeing — back button is keyboard-focusable`, async () => {
      const user = userEvent.setup()
      const { unmount } = renderWellbeing(stream)
      await user.tab()
      expect(document.activeElement?.tagName).toBe('BUTTON')
      unmount()
    })
  })
})
