import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getColors, Shell, SectionLabel } from './HomePage.jsx'
import { shadow } from '../styles/tokens.js'
import { ANXIETY_TIPS, CHECKLIST_ITEMS } from '../data/wellbeingContent.js'

// ── Breathing configs ──────────────────────────────────────────────────────────
const BOX = {
  phases:    ['Breathe In', 'Hold', 'Breathe Out', 'Hold'],
  durations: [4000, 4000, 4000, 4000],
  label:     'Box (4×4)',
}
const F478 = {
  phases:    ['Breathe In', 'Hold', 'Breathe Out'],
  durations: [4000, 7000, 8000],
  label:     '4-7-8',
}

// ── Inline Toggle (mirrors SettingsPage) ──────────────────────────────────────
function Toggle({ value, onChange, color, label = 'Toggle' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-label={label}
      aria-pressed={value}
      style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: value ? color : '#CBD5E1',
        transition: 'background 0.2s',
        position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: 'white',
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  )
}

// ── Checklist localStorage helpers ───────────────────────────────────────────
function todayKey() {
  return `nx_checklist_${new Date().toISOString().split('T')[0]}`
}
function loadChecked() {
  try { return new Set(JSON.parse(localStorage.getItem(todayKey()) ?? '[]')) }
  catch { return new Set() }
}
function saveChecked(set) {
  try { localStorage.setItem(todayKey(), JSON.stringify([...set])) } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WellbeingPage({ isDark }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const C          = getColors(stream, null, isDark)
  const dark       = isDark

  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Breathing state ──────────────────────────────────────────────────────
  const [breathType,  setBreathType]  = useState('box')    // 'box' | '478'
  const [active,      setActive]      = useState(false)
  const [breathPhase, setBreathPhase] = useState(0)
  const timerRef = useRef(null)

  const phaseConfig = breathType === 'box' ? BOX : F478

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  // Advance phases using setTimeout chain so each phase can have its own duration
  const scheduleNext = useCallback((currentPhase) => {
    const config = breathType === 'box' ? BOX : F478
    const duration = config.durations[currentPhase]
    timerRef.current = setTimeout(() => {
      const next = (currentPhase + 1) % config.phases.length
      setBreathPhase(next)
      scheduleNext(next)
    }, duration)
  }, [breathType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active && !prefersReduced) {
      scheduleNext(breathPhase)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  function switchBreathType(type) {
    clearTimer()
    setActive(false)
    setBreathPhase(0)
    setBreathType(type)
  }

  const phases    = phaseConfig.phases
  const durations = phaseConfig.durations
  const scaleIn   = breathPhase === 0
  const scaleOut  = breathPhase === (breathType === 'box' ? 2 : 2)
  const circleScale = active
    ? (scaleIn ? 1.25 : scaleOut ? 0.85 : phases[breathPhase] === 'Hold' ? (breathPhase === 1 ? 1.25 : 0.85) : 1)
    : 1

  // ── Anxiety tips state ───────────────────────────────────────────────────
  const [expandedTip, setExpandedTip] = useState(null)

  function toggleTip(id) {
    setExpandedTip(prev => prev === id ? null : id)
  }

  // ── Focus sounds state ───────────────────────────────────────────────────
  const [soundOn, setSoundOn] = useState(false)

  // ── Checklist state ──────────────────────────────────────────────────────
  const [checked, setChecked] = useState(loadChecked)

  function toggleCheck(id) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      saveChecked(next)
      return next
    })
  }

  function resetChecklist() {
    setChecked(new Set())
    saveChecked(new Set())
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const cardStyle = {
    background: C.card,
    borderRadius: 20, padding: '24px 20px',
    marginBottom: 18,
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.35)' : shadow.md,
    border: `1.5px solid ${C.border}`,
  }

  return (
    <Shell C={C} isDark={isDark}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, padding: 0, lineHeight: 1 }}
        >←</button>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: '-0.4px', fontFamily: "'Playfair Display', Georgia, serif" }}>
          Wellbeing Hub
        </div>
      </div>

      {/* ── Breathing Exercise ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionLabel C={C}>Breathing Exercise</SectionLabel>

        {/* Breath type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[{ key: 'box', label: BOX.label }, { key: '478', label: F478.label }].map(t => (
            <button
              key={t.key}
              onClick={() => switchBreathType(t.key)}
              style={{
                background: breathType === t.key ? C.primary : 'transparent',
                border: `1.5px solid ${breathType === t.key ? C.primary : C.border}`,
                borderRadius: 20, padding: '7px 16px',
                fontSize: 12, fontWeight: 700,
                color: breathType === t.key ? 'white' : C.muted,
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                transition: 'all 0.2s',
              }}
            >{t.label}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
          {breathType === 'box'
            ? 'Breathe in, hold, out, hold — 4 seconds each. Calms your nervous system before an exam.'
            : 'Breathe in for 4 s, hold for 7 s, exhale for 8 s. A natural tranquiliser for the nervous system.'}
        </div>

        {/* Animated circle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 140, height: 140, borderRadius: 70,
            background: `radial-gradient(circle,${C.primary}30,${C.primary}10)`,
            border: `3px solid ${C.primary}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: active && !prefersReduced
              ? `${scaleIn ? 'breatheIn' : scaleOut ? 'breatheOut' : 'breatheHold'} ${durations[breathPhase]}ms ease-in-out forwards`
              : 'none',
            transform: active ? `scale(${circleScale})` : 'scale(1)',
            transition: prefersReduced || !active ? 'transform 0.3s ease' : 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🌬️</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {active ? phases[breathPhase] : 'Ready'}
              </div>
              {active && (
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {breathPhase + 1} / {phases.length}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setActive(a => !a)}
          style={{
            background: active
              ? `${C.primary}18`
              : `linear-gradient(135deg,${C.primary},${C.secondary ?? C.primary})`,
            color: active ? C.primary : 'white',
            border: active ? `2px solid ${C.primary}40` : 'none',
            borderRadius: 12, padding: '11px 28px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          {active ? '⏸ Pause' : '▶ Start Breathing'}
        </button>

        {active && (
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
            {breathType === 'box' ? 'One full cycle = 16 seconds' : 'One full cycle = 19 seconds'}
          </div>
        )}
      </div>

      {/* ── Exam Anxiety Tips ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionLabel C={C}>Exam Anxiety Tips</SectionLabel>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
          Evidence-based techniques to manage exam stress. Tap any card to expand.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ANXIETY_TIPS.map(tip => {
            const open = expandedTip === tip.id
            return (
              <div
                key={tip.id}
                style={{
                  background: open ? `${C.primary}08` : C.card,
                  border: `1.5px solid ${open ? C.primary + '40' : C.border}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <button
                  onClick={() => toggleTip(tip.id)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${C.primary}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {tip.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{tip.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{tip.short}</div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: C.primary,
                    background: `${C.primary}15`, borderRadius: 20, padding: '3px 8px',
                    flexShrink: 0,
                  }}>{tip.category}</div>
                  <div style={{ fontSize: 14, color: C.muted, marginLeft: 4, flexShrink: 0 }}>
                    {open ? '▲' : '▼'}
                  </div>
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {tip.tips.map((t, i) => (
                        <li key={i} style={{ fontSize: 12, color: C.navy, lineHeight: 1.7, marginBottom: 4 }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Focus Sounds ───────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionLabel C={C}>Focus Sounds</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${C.primary}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🎵</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>Lo-Fi Study Music</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Ambient beats to help you focus
            </div>
          </div>
          <Toggle value={soundOn} onChange={setSoundOn} color={C.primary} label="Toggle Lo-Fi Study Music" />
        </div>

        {soundOn && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
              Video will autoplay — works best with sound on.
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
              <iframe
                width="100%"
                height="160"
                src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"
                title="Lo-Fi Girl"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Pre-Exam Checklist ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionLabel C={C} style={{ marginBottom: 0 }}>Pre-Exam Checklist</SectionLabel>
          <button
            onClick={resetChecklist}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: C.muted,
              fontFamily: 'Inter,sans-serif',
            }}
          >Reset</button>
        </div>

        {[
          { key: 'night',   label: 'Night Before', emoji: '🌙', items: CHECKLIST_ITEMS.night },
          { key: 'morning', label: 'Morning Of',   emoji: '☀️', items: CHECKLIST_ITEMS.morning },
        ].map(section => {
          const done  = section.items.filter(it => checked.has(it.id)).length
          const total = section.items.length
          return (
            <div key={section.key} style={{ marginBottom: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {section.emoji} {section.label}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: done === total ? '#10B981' : C.primary,
                  background: (done === total ? '#10B981' : C.primary) + '15',
                  borderRadius: 20, padding: '3px 8px',
                }}>
                  {done}/{total}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map(item => {
                  const ticked = checked.has(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: ticked ? '#10B98108' : 'transparent',
                        border: `1.5px solid ${ticked ? '#10B98140' : C.border}`,
                        borderRadius: 12, padding: '10px 14px',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: ticked ? '#10B981' : 'transparent',
                        border: `2px solid ${ticked ? '#10B981' : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: 'white',
                        transition: 'all 0.15s',
                      }}>
                        {ticked ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: 12, marginRight: 6 }}>{item.emoji}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: ticked ? C.muted : C.navy,
                        textDecoration: ticked ? 'line-through' : 'none',
                        flex: 1,
                        transition: 'color 0.15s',
                      }}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Teacher nudge */}
      <div style={{
        padding: '12px 14px',
        background: `${C.primary}12`,
        border: `1.5px solid ${C.primary}25`,
        borderRadius: 14,
        fontSize: 12, color: dark ? '#A5B4FC' : C.primary, lineHeight: 1.5,
        marginBottom: 16,
      }}>
        🏫 <strong>Tip for teachers</strong> — share this Wellbeing Hub with your class before exams!
      </div>
    </Shell>
  )
}

const css = `
  @keyframes breatheIn   { from{transform:scale(0.85)} to{transform:scale(1.25)} }
  @keyframes breatheOut  { from{transform:scale(1.25)} to{transform:scale(0.85)} }
  @keyframes breatheHold { from{opacity:1} to{opacity:1} }
`
