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
  // A-Level (light pastel cards)
  ucat:    { primary:'#0891B2', card:'#E0F9FF', navy:'#0A4550' },
  lnat:    { primary:'#D97706', card:'#FEF3C7', navy:'#4A2506' },
  tmua:    { primary:'#6366F1', card:'#EEF2FF', navy:'#312E81' },
  esat:    { primary:'#EA580C', card:'#FFEDD5', navy:'#431407' },
  mat:     { primary:'#4F46E5', card:'#EDE9FE', navy:'#2E1065' },
  pat:     { primary:'#0E7490', card:'#CFFAFE', navy:'#164E63' },
  tara:    { primary:'#DB2777', card:'#FCE7F3', navy:'#500724' },
  tsa:     { primary:'#7C3AED', card:'#F3E8FF', navy:'#3B0764' },
  step:    { primary:'#059669', card:'#D1FAE5', navy:'#064E3B' },
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

  const [activeIdx,  setActiveIdx]  = useState(0)
  const [showHint,   setShowHint]   = useState(true)
  const [hasDragged, setHasDragged] = useState(false)
  const [wiggle,     setWiggle]     = useState(true)

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

  useEffect(() => {
    const t = setTimeout(() => setWiggle(false), 1800)
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
    if (Math.abs(dx) > 8) { wasDragRef.current = true; if (!hasDragged) setHasDragged(true) }

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
      <style>{`
        @keyframes arrowPulse {
          0%,100% { transform:translateY(-50%) scale(1);   box-shadow:0 2px 12px rgba(0,0,0,0.15); }
          50%      { transform:translateY(-50%) scale(1.12); box-shadow:0 4px 20px rgba(0,0,0,0.25); }
        }
        @keyframes fanWiggle {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-10px); }
          50%     { transform:translateX(10px); }
          75%     { transform:translateX(-5px); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow:0 0 0 0 transparent; }
          50%     { box-shadow:0 0 0 5px var(--btn-glow); }
        }
      `}</style>

      {/* ── Fan arena ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position:'relative',
          height: CARD_H + 80,
          overflow:'hidden',
          maxWidth:'100%',
          cursor:'grab',
          touchAction:'none',
          animation: wiggle ? 'fanWiggle 0.9s ease 0.5s both' : 'none',
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

          const subtitle = m.type || s.desc || ''
          const detail   = m.unis || ''
          const isActive = i === activeIdx

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
                cursor: isActive ? 'default' : 'pointer',
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

              {/* "Tap to select" nudge on adjacent cards */}
              {!isActive && (
                <div style={{
                  position:'absolute', bottom:14,
                  fontSize:9, fontWeight:800, letterSpacing:'0.08em',
                  color:`${sc.primary}80`, textTransform:'uppercase',
                }}>
                  tap to select
                </div>
              )}

              {/* Arrow hint on active card pointing down to buttons */}
              {isActive && (
                <div style={{
                  position:'absolute', bottom:12,
                  fontSize:9, fontWeight:800, letterSpacing:'0.06em',
                  color:`${sc.primary}60`, textTransform:'uppercase',
                  animation:'fadeUp 0.3s ease 0.15s both',
                }}>
                  ↓ practice below
                </div>
              )}
            </div>
          )
        })}

        {/* ── Left chevron ── */}
        {activeIdx > 0 && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { wasDragRef.current = false; jumpTo(activeIdx - 1) }}
            style={{
              position:'absolute', left:8, top:'42%',
              transform:'translateY(-50%)',
              zIndex:60, width:36, height:36, borderRadius:'50%',
              background:'rgba(255,255,255,0.92)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(0,0,0,0.08)',
              boxShadow:'0 2px 14px rgba(0,0,0,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:20, lineHeight:1, color:'#334155',
              fontFamily:'system-ui', fontWeight:300,
              animation: hasDragged ? 'none' : 'arrowPulse 2s ease-in-out 1s infinite',
            }}
          >‹</button>
        )}

        {/* ── Right chevron ── */}
        {activeIdx < N - 1 && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { wasDragRef.current = false; jumpTo(activeIdx + 1) }}
            style={{
              position:'absolute', right:8, top:'42%',
              transform:'translateY(-50%)',
              zIndex:60, width:36, height:36, borderRadius:'50%',
              background:'rgba(255,255,255,0.92)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(0,0,0,0.08)',
              boxShadow:'0 2px 14px rgba(0,0,0,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:20, lineHeight:1, color:'#334155',
              fontFamily:'system-ui', fontWeight:300,
              animation: hasDragged ? 'none' : 'arrowPulse 2s ease-in-out 1.2s infinite',
            }}
          >›</button>
        )}
      </div>

      {/* ── Swipe hint + card counter ───────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10, marginTop:4 }}>
        <div style={{
          fontSize:10, fontWeight:700, letterSpacing:'0.06em',
          color: hintColor,
          transition:'opacity 0.6s ease',
          opacity: showHint ? 1 : 0.18,
          pointerEvents:'none',
        }}>
          ← swipe to browse →
        </div>
        <div style={{
          fontSize:10, fontWeight:800, color: SC.primary,
          background:`${SC.primary}14`, border:`1px solid ${SC.primary}28`,
          borderRadius:20, padding:'2px 9px', letterSpacing:'0.03em',
          flexShrink:0,
        }}>
          {activeIdx + 1} / {N}
        </div>
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
              '--btn-glow': `${SC.primary}55`,
              background: SC.primary, color:'white',
              border:'none', borderRadius:12, padding:'13px 6px',
              fontSize:12, fontWeight:800, cursor:'pointer',
              fontFamily:'Inter,sans-serif',
              animation:'btnGlow 1.2s ease 0.3s 3',
            } }
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
