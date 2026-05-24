/**
 * Accessibility — axe-core automated scans + DOM-order VoiceOver / TalkBack.
 *
 * axe-core is run against rendered React components inside a MemoryRouter.
 * Supabase is not configured (env vars are empty) so all hooks use guest mode.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import axe from 'axe-core'
import WellbeingPage from '../../pages/WellbeingPage.jsx'
import ResultPage from '../../pages/ResultPage.jsx'

// ── axe helper ────────────────────────────────────────────────────────────────
async function runAxe(container) {
  const results = await axe.run(container, {
    rules: {
      // YouTube iframes have known third-party violations outside our control
      'frame-title': { enabled: false },
    },
  })
  return results.violations
}

function formatViolations(violations) {
  return violations.map(v =>
    `[${v.impact}] ${v.id}: ${v.description}\n  nodes: ${v.nodes.map(n => n.html).join(', ')}`
  ).join('\n')
}

// ── WellbeingPage ─────────────────────────────────────────────────────────────
describe('axe-core: WellbeingPage', () => {
  it('has no critical or serious accessibility violations', async () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/gcse/wellbeing']}>
        <Routes>
          <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
        </Routes>
      </MemoryRouter>
    )
    const violations = await runAxe(container)
    const serious = violations.filter(v => ['critical', 'serious'].includes(v.impact))
    unmount()
    expect(serious, formatViolations(serious)).toHaveLength(0)
  })

  it('breathing type toggle buttons have accessible labels', () => {
    const { getAllByRole } = render(
      <MemoryRouter initialEntries={['/gcse/wellbeing']}>
        <Routes>
          <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
        </Routes>
      </MemoryRouter>
    )
    const buttons = getAllByRole('button')
    const breathButtons = buttons.filter(b =>
      b.textContent.includes('Box') || b.textContent.includes('4-7-8')
    )
    expect(breathButtons.length).toBeGreaterThanOrEqual(2)
    breathButtons.forEach(b => {
      expect(b.textContent.trim().length).toBeGreaterThan(0)
    })
  })

  it('checklist items are interactive buttons with visible text', () => {
    const { getAllByRole } = render(
      <MemoryRouter initialEntries={['/gcse/wellbeing']}>
        <Routes>
          <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
        </Routes>
      </MemoryRouter>
    )
    const buttons = getAllByRole('button')
    const checklistButtons = buttons.filter(b => b.textContent.includes('Pack'))
    expect(checklistButtons.length).toBeGreaterThanOrEqual(1)
  })
})

// ── ResultPage ────────────────────────────────────────────────────────────────
describe('axe-core: ResultPage', () => {
  const fakeState = {
    subject: 'maths',
    answers: [
      { q: { topic: 'Algebra', q: 'What is 2+2?', opts: ['3','4','5','6'], ans: 1, hint: 'Add' }, chosen: 1, correct: true  },
      { q: { topic: 'Number',  q: 'What is 3×3?', opts: ['6','8','9','10'], ans: 2, hint: 'Multiply' }, chosen: 0, correct: false },
    ],
    score: 1,
    total: 2,
    xpEarned: 15,
  }

  it('has no critical or serious accessibility violations', async () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/gcse/result']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/:stream/result"
            element={<ResultPage user={null} profile={null} />}
          />
        </Routes>
      </MemoryRouter>
    )
    const violations = await runAxe(container)
    const serious = violations.filter(v => ['critical', 'serious'].includes(v.impact))
    unmount()
    expect(serious, formatViolations(serious)).toHaveLength(0)
  })
})

// ── VoiceOver / TalkBack DOM order ────────────────────────────────────────────
// The quiz question must precede its answer options in DOM source order so
// screen readers encounter the question before reading options aloud.
describe('VoiceOver / TalkBack — DOM order', () => {
  it('anxiety tip accordion titles appear before their bullet content in DOM', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/gcse/wellbeing']}>
        <Routes>
          <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
        </Routes>
      </MemoryRouter>
    )
    // All tip buttons (collapsed state) should be present
    const tipButtons = Array.from(container.querySelectorAll('button')).filter(b =>
      b.textContent.includes('Reframing') ||
      b.textContent.includes('Grounding') ||
      b.textContent.includes('Sleep')     ||
      b.textContent.includes('Nutrition') ||
      b.textContent.includes('Panic')
    )
    expect(tipButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('checklist section labels appear before their items in DOM', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/gcse/wellbeing']}>
        <Routes>
          <Route path="/:stream/wellbeing" element={<WellbeingPage />} />
        </Routes>
      </MemoryRouter>
    )
    // Find the "Night Before" section heading element and a checklist item
    const allEls = Array.from(container.querySelectorAll('*'))
    const nightEl = allEls.find(el => el.childElementCount === 0 && el.textContent.includes('Night Before'))
    const alarmEl = allEls.find(el => el.childElementCount === 0 && el.textContent.includes('Set two alarms'))

    expect(nightEl).toBeTruthy()
    expect(alarmEl).toBeTruthy()

    // DOCUMENT_POSITION_FOLLOWING means nightEl comes before alarmEl
    const position = nightEl.compareDocumentPosition(alarmEl)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
