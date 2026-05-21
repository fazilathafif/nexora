/**
 * FanDeck — physical fan of exam/subject cards with angular-momentum drag.
 * Works for both dark A-Level cards and light GCSE cards.
 * Ref-based: zero React re-renders during drag/decel.
 */

import { useState, useRef, useEffect } from 'react'

// ── Card geometry ─────────────────────────────────────────────────────────────
const CARD_W      = 226   // 181 × 1.25
const CARD_H      = 320   // 256 × 1.25
const PIVOT_EXT   = 106   // 85 × 1.25 — keeps fan spread proportional
const SPREAD      = 18    // degrees between adjacent cards

// ── Physics ───────────────────────────────────────────────────────────────────
const SENSITIVITY = 0.26  // degrees per horizontal pixel of drag
const DECEL_60    = 0.87  // velocity multiplier per 16 ms frame
const SNAP_THRESH = 0.04  // deg/ms — snap once velocity drops below this
const RUBBER_K    = 0.28  // fraction of out-of-bound displacement applied

// ── Per-subject colours ───────────────────────────────────────────────────────
const EXAM_COLORS = {
  // A-Level (dark cards)
  ucat:    { primary:'#06B6D4', card:'#071B2C', navy:'#E0F9FF' },
  lnat:    { primary:'#F59E0B', card:'#1C0E00', navy:'#FEFCE8' },
  tmua:    { primary:'#818CF8', card:'#131029', navy:'#EEF2FF' },
  esat:    { primary:'#F97316', card:'#201000', navy:'#FFF4E8' },
  mat:     { primary:'#6366F1', card:'#100E28', navy:'#EEF2FF' },
  pat:     { primary:'#22D3EE', card:'#041A2A', navy:'#E0FBFF' },
  tara:    { primary:'#EC4899', card:'#1C0A16', navy:'#FCE7F3' },
  tsa:     { primary:'#A855F7', card:'#180A32', navy:'#F5F3FF' },
  step:    { primary:'#10B981', card:'#041E1B', navy:'#ECFDF5' },
  // GCSE (light cards)
  maths:   { primary:'#3B82F6', card:'#EFF6FF', navy:'#1E3A5F' },
  english: { primary:'#D97706', card:'#FFFBEB', navy:'#78350F' },
  science: { primary:'#0F766E', card:'#F0FDFA', navy:'#134E4A' },
  verbal:  { primary:'#DB2777', card:'#FDF2F8', navy:'#500724' },
}

// A-Level exam metadata; GCSE subjects fall back to subject.desc
const EXAM_META = {
  ucat: { type:'Medicine & Dentistry',       unis:'Oxford · Imperial · UCL · Sheffield' },
  lnat: { type:'Law',                        unis:'Oxford · Cambridge · LSE · UCL' },
  tmua: { type:'Maths & Computer Science',   unis:'Cambridge · UCL · Durham · Warwick · Bath' },
  esat: { type:'Engineering & Sciences',     unis:'Cambridge · Imperial · Oxford' },
  mat:  { type:'Mathematics (Oxford & Imperial)', unis:'Oxford · Imperial' },
  pat:  { type:'Physics Aptitude Test',      unis:'Oxford (Physics, Engineering, Materials)' },
  tara: { type:'Critical Thinking & Problem Solving', unis:'Oxford (PPE, E&M, History) · UCL' },
  tsa:  { type:'PPE, Economics & Philosophy',unis:'Legacy — replaced by TARA from 2026' },
  step: { type:'Cambridge Mathematics',      unis:'Cambridge — conditional on offer (June)' },
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// Detect whether a hex card background is dark (R channel < 50)
function isDarkCard(hex) {
  if (!hex || hex[0] !== '#') return true
  return parseInt(hex.slice(1, 3), 16) < 50
}

export default function FanDeck({ subjects, stream, navigate, C }) {
  const N = subjects.length

  const [activeIdx, setActiveIdx] = useState(0)
  const [showHint,  setShowHint]  = useState(true)

  const fanOffsetRef  = useRef(0)
  const velocityRef   = useRef(0)
  const activeIdxRef  = useRef(0)
  const isDraggingRef = useRef(false)
  const wasDragRef    = useRef(false)
  const startXRef     = useRef(0)
  const startOffRef   = useRef(0)
  const prevXRef      = useRef(0)
  const prevTimeRef   = useRef(0)
  const rafRef        = useRef(null)
  const cardRefs      = useRef([])

  useEffect(() => { activeIdxRef.current = activeIdx }, [activeIdx])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2800)
    return () => clearTimeout(t)
  }, [])

  // ── DOM-direct transform application ──────────────────────────────────────
  function applyTransforms(offset, withTransition = false) {
    const snapped = clamp(Math.round(offset / SPREAD), 0, N - 1)
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const angle   = i * SPREAD - offset
      const dist    = Math.abs(i - snapped)
      const scale   = Math.max(0.76, 1 - dist * 0.06)
      const opacity = Math.max(0.3,  1 - dist * 0.2)
      el.style.transition = withTransition
        ? 'transform 0.36s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.36s ease'
        : 'none'
      el.style.transform = `rotate(${angle}deg) scale(${scale})`
      el.style.opacity   = String(opacity)
      el.style.zIndex    = String(N - dist + (i === snapped ? 4 : 0))
    })
  }

  function snap() {
    const idx = clamp(Math.round(fanOffsetRef.current / SPREAD), 0, N - 1)
    fanOffsetRef.current = idx * SPREAD
    applyTransforms(idx * SPREAD, true)
    if (idx !== activeIdxRef.current) {
      setActiveIdx(idx)
      activeIdxRef.current = idx
    }
  }

  function decelLoop(prevT) {
    const now = performance.now()
    const dt  = Math.min(now - prevT, 64)
    velocityRef.current  *= Math.pow(DECEL_60, dt / 16)
    fanOffsetRef.current += velocityRef.current * dt

    const lo = 0, hi = (N - 1) * SPREAD
    if (fanOffsetRef.current < lo) {
      fanOffsetRef.current = lo + (fanOffsetRef.current - lo) * RUBBER_K
      velocityRef.current  = Math.abs(velocityRef.current) * 0.25
    } else if (fanOffsetRef.current > hi) {
      fanOffsetRef.current = hi + (fanOffsetRef.current - hi) * RUBBER_K
      velocityRef.current  = -Math.abs(velocityRef.current) * 0.25
    }

    applyTransforms(fanOffsetRef.current)

    if (Math.abs(velocityRef.current) < SNAP_THRESH) {
      snap()
    } else {
      rafRef.current = requestAnimationFrame(() => decelLoop(now))
    }
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────
  function handlePointerDown(e) {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    isDraggingRef.current = true
    wasDragRef.current    = false
    startXRef.current     = e.clientX
    startOffRef.current   = fanOffsetRef.current
    prevXRef.current      = e.clientX
    prevTimeRef.current   = performance.now()
    velocityRef.current   = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!isDraggingRef.current) return
    const now = performance.now()
    const dx  = e.clientX - startXRef.current
    if (Math.abs(dx) > 8) wasDragRef.current = true

    const dxInst = e.clientX - prevXRef.current
    const dt     = now - prevTimeRef.current
    if (dt > 0) velocityRef.current = -(dxInst * SENSITIVITY) / dt

    prevXRef.current    = e.clientX
    prevTimeRef.current = now

    const lo = 0, hi = (N - 1) * SPREAD
    let off = startOffRef.current - dx * SENSITIVITY
    if (off < lo) off = lo + (off - lo) * RUBBER_K
    if (off > hi) off = hi + (off - hi) * RUBBER_K
    fanOffsetRef.current = off
    applyTransforms(off)
  }

  function handlePointerUp() {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    rafRef.current = requestAnimationFrame(() => decelLoop(performance.now()))
  }

  function jumpTo(i) {
    if (wasDragRef.current) { wasDragRef.current = false; return }
    if (i === activeIdxRef.current) return
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    fanOffsetRef.current = i * SPREAD
    applyTransforms(i * SPREAD, true)
    setActiveIdx(i)
    activeIdxRef.current = i
  }

  useEffect(() => { applyTransforms(0) }, []) // eslint-disable-line

  // ── Active card data ───────────────────────────────────────────────────────
  const subj       = subjects[activeIdx]
  const meta       = EXAM_META[subj?.id] || {}
  const SC         = EXAM_COLORS[subj?.id] || { primary:'#7C3AED', card:'#181432', navy:'#F0F4FF' }
  const dark       = stream === 'alevel'
  const hintColor  = dark ? 'rgba(255,255,255,0.28)' : (C?.muted ?? 'rgba(0,0,0,0.3)')
  const dotInColor = dark ? 'rgba(255,255,255,0.15)' : (C?.border ?? 'rgba(0,0,0,0.15)')

  return (
    <div style={{ userSelect:'none', marginBottom:4 }}>

      {/* ── Fan arena ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position:'relative',
          height: CARD_H + 80,
          overflow:'hidden',
          cursor:'grab',
          touchAction:'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {subjects.map((s, i) => {
          const m    = EXAM_META[s.id]   || {}
          const sc   = EXAM_COLORS[s.id] || { primary:'#7C3AED', card:'#181432', navy:'#F0F4FF' }
          const dark = isDarkCard(sc.card)

          const cardShadow = dark
            ? '0 14px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)'
            : '0 6px 28px rgba(0,0,0,0.12), inset 0 -1px 0 rgba(0,0,0,0.05)'
          const cardBorder = `2px solid ${sc.primary}${dark ? '30' : '50'}`
          const subtleText = dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.42)'

          // Subtitle: exam type for A-Level, desc for GCSE
          const subtitle = m.type || s.desc || ''
          // Bottom detail: unis for A-Level, empty for GCSE (desc already used above)
          const detail   = m.unis || ''

          return (
            <div
              key={s.id}
              ref={el => { cardRefs.current[i] = el }}
              onClick={() => jumpTo(i)}
              style={{
                position:'absolute',
                left:'50%', top:28,
                width: CARD_W, height: CARD_H,
                marginLeft: -CARD_W / 2,
                transformOrigin: `center calc(100% + ${PIVOT_EXT}px)`,
                borderRadius: 20,
                background: sc.card,
                border: cardBorder,
                boxShadow: cardShadow,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                padding:'22px 16px',
                willChange:'transform',
                cursor: i === activeIdx ? 'default' : 'pointer',
              }}
            >
              <div style={{fontSize:40, marginBottom:10}}>{s.emoji}</div>
              {s.deprecated && (
                <div style={{
                  background:'#F59E0B', color:'#1C0E00',
                  fontSize:8, fontWeight:900, letterSpacing:'0.12em',
                  padding:'2px 8px', borderRadius:6, marginBottom:6,
                }}>
                  LEGACY
                </div>
              )}
              <div style={{
                fontSize:15, fontWeight:900, color:sc.navy,
                textAlign:'center', letterSpacing:'-0.3px', marginBottom:4,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize:10, fontWeight:700, color:sc.primary,
                textAlign:'center', marginBottom: detail ? 10 : 0,
              }}>
                {subtitle}
              </div>
              {detail && (
                <div style={{
                  fontSize:9, color: subtleText,
                  textAlign:'center', lineHeight:1.65,
                  borderTop:`1px solid ${sc.primary}18`,
                  paddingTop:8, width:'100%',
                }}>
                  {detail}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Swipe hint ─────────────────────────────────────────────────────── */}
      <div style={{
        textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:'0.06em',
        color: hintColor,
        marginBottom:10, marginTop:4,
        transition:'opacity 0.6s ease',
        opacity: showHint ? 1 : 0,
        pointerEvents:'none',
      }}>
        ← SWIPE TO BROWSE →
      </div>

      {/* ── Dot nav ────────────────────────────────────────────────────────── */}
      <div style={{display:'flex', justifyContent:'center', gap:5, marginBottom:16}}>
        {subjects.map((_, i) => (
          <div
            key={i}
            onClick={() => jumpTo(i)}
            style={{
              width: i === activeIdx ? 20 : 6, height:6,
              borderRadius:3,
              background: i === activeIdx ? SC.primary : dotInColor,
              transition:'all 0.3s ease',
              cursor:'pointer',
            }}
          />
        ))}
      </div>

      {/* ── Action buttons (re-mounts on active change for fade-in) ─────────── */}
      <div key={activeIdx} style={{animation:'fadeUp 0.22s ease'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
          <button
            onClick={() => navigate(`/${stream}/quiz/${subj.id}`)}
            style={{
              background: SC.primary, color:'white',
              border:'none', borderRadius:12, padding:'13px 6px',
              fontSize:12, fontWeight:800, cursor:'pointer',
              fontFamily:'Inter,sans-serif',
            }}
          >Practice →</button>
          <button
            onClick={() => navigate(`/${stream}/mock/${subj.id}`)}
            style={{
              background:'transparent',
              border:`1.5px solid ${SC.primary}50`,
              borderRadius:12, padding:'13px 6px',
              fontSize:12, fontWeight:800,
              color: SC.primary, cursor:'pointer',
              fontFamily:'Inter,sans-serif',
            }}
          >Mock Exam</button>
          <button
            onClick={() => navigate(`/${stream}/flashcards/${subj.id}`)}
            style={{
              background:'transparent',
              border:`1.5px solid ${SC.primary}50`,
              borderRadius:12, padding:'13px 6px',
              fontSize:12, fontWeight:800,
              color: SC.primary, cursor:'pointer',
              fontFamily:'Inter,sans-serif',
            }}
          >Cards 🃏</button>
        </div>
      </div>
    </div>
  )
}
