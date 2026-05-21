/**
 * FlashcardDeck — stacked deck with 3D flip + Tinder-style swipe-to-dismiss.
 */

import { useState, useRef } from 'react'

const DISMISS_PX  = 80
const DISMISS_VEL = 0.4

function useSwipe({ onDismiss, onFlip }) {
  const cardRef  = useRef(null)
  const leftRef  = useRef(null)
  const rightRef = useRef(null)

  const startX   = useRef(0)
  const startY   = useRef(0)
  const startMs  = useRef(0)
  const active   = useRef(false)
  const isHoriz  = useRef(false)
  const moved    = useRef(false)
  const rafRef   = useRef(null)

  function paint(dx, withTransition) {
    const el = cardRef.current
    if (!el) return

    const angle   = Math.max(-14, Math.min(14, dx * 0.05))
    const opacity = Math.min(Math.abs(dx) / 80, 1)

    el.style.transition = withTransition
      ? 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none'
    el.style.transform = `translateX(${dx}px) rotate(${angle}deg)`

    if (leftRef.current) {
      leftRef.current.style.opacity    = dx < -10 ? opacity : 0
      leftRef.current.style.background = `rgba(239,68,68,${opacity * 0.45})`
    }
    if (rightRef.current) {
      rightRef.current.style.opacity    = dx > 10 ? opacity : 0
      rightRef.current.style.background = `rgba(16,185,129,${opacity * 0.45})`
    }
  }

  function onPointerDown(e) {
    startX.current  = e.clientX
    startY.current  = e.clientY
    startMs.current = performance.now()
    active.current  = true
    isHoriz.current = false
    moved.current   = false
    paint(0, false)
  }

  function onPointerMove(e) {
    if (!active.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    if (!isHoriz.current) {
      if (Math.abs(dx) > Math.abs(dy) + 4) {
        isHoriz.current = true
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
      } else if (Math.abs(dy) > Math.abs(dx) + 4) {
        active.current = false
        return
      } else {
        return
      }
    }

    moved.current = true
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => paint(dx, false))
  }

  function onPointerUp(e) {
    if (!active.current) return
    active.current = false
    cancelAnimationFrame(rafRef.current)

    const dx      = e.clientX - startX.current
    const elapsed = performance.now() - startMs.current
    const vel     = elapsed > 0 ? Math.abs(dx) / elapsed : 0

    if (moved.current && (Math.abs(dx) > DISMISS_PX || vel > DISMISS_VEL)) {
      const dir   = dx > 0 ? 'right' : 'left'
      const flyX  = dir === 'right' ? 640 : -640
      const angle = dir === 'right' ? 22 : -22
      paint(0, false)
      const el = cardRef.current
      if (el) {
        el.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)'
        el.style.transform  = `translateX(${flyX}px) rotate(${angle}deg)`
      }
      setTimeout(() => onDismiss(dir), 320)
    } else {
      paint(0, true)
      if (!moved.current) onFlip()
    }
  }

  return { cardRef, leftRef, rightRef, onPointerDown, onPointerMove, onPointerUp }
}

// ── Flashcard ─────────────────────────────────────────────────────────────────
function Flashcard({ card, C, onDismiss, onFlipChange }) {
  const [flipped, setFlipped] = useState(false)

  const { cardRef, leftRef, rightRef, onPointerDown, onPointerMove, onPointerUp } =
    useSwipe({
      onDismiss,
      onFlip: () => setFlipped(f => {
        const next = !f
        onFlipChange?.(next)
        return next
      }),
    })

  return (
    <div
      ref={cardRef}
      style={{
        position:'absolute', inset:0, zIndex:5, touchAction:'pan-y', cursor:'grab',
        animation:'cardEntrance 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Skip overlay */}
      <div ref={leftRef} style={{
        position:'absolute', inset:0, borderRadius:20, zIndex:10, pointerEvents:'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:6, opacity:0,
      }}>
        <span style={{ fontSize:52, lineHeight:1 }}>✗</span>
        <span style={{ fontSize:18, fontWeight:900, color:'white', letterSpacing:'0.08em' }}>SKIP</span>
      </div>

      {/* Know overlay */}
      <div ref={rightRef} style={{
        position:'absolute', inset:0, borderRadius:20, zIndex:10, pointerEvents:'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:6, opacity:0,
      }}>
        <span style={{ fontSize:52, lineHeight:1 }}>✓</span>
        <span style={{ fontSize:18, fontWeight:900, color:'white', letterSpacing:'0.08em' }}>KNOW</span>
      </div>

      {/* 3D flip scene */}
      <div style={{ perspective:'900px', height:'100%' }}>
        <div style={{
          height:'100%',
          transformStyle:'preserve-3d',
          transition:'transform 0.45s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* Front face */}
          <div style={{
            position:'absolute', inset:0,
            backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
            background: C.soft,
            border:`1.5px solid ${C.primary}25`,
            borderRadius:20, padding:'20px 20px 16px', overflow:'hidden',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
            boxShadow:'0 8px 28px rgba(0,0,0,0.09)',
          }}>
            {/* Edge direction cues */}
            <div style={{
              position:'absolute', left:0, top:0, bottom:0, width:32,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(to right,rgba(239,68,68,0.07),transparent)',
              borderRadius:'20px 0 0 20px', pointerEvents:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#EF4444', opacity:0.5, writingMode:'vertical-rl', transform:'rotate(180deg)', letterSpacing:'0.1em' }}>SKIP</span>
            </div>
            <div style={{
              position:'absolute', right:0, top:0, bottom:0, width:32,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(to left,rgba(16,185,129,0.07),transparent)',
              borderRadius:'0 20px 20px 0', pointerEvents:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#10B981', opacity:0.5, writingMode:'vertical-rl', letterSpacing:'0.1em' }}>KNOW</span>
            </div>

            <div style={{ padding:'0 12px' }}>
              <div style={{
                fontSize:11, fontWeight:800, color:C.muted,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12,
              }}>
                {card.label ?? 'Question'}
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:C.navy, lineHeight:1.65, margin:0 }}>
                {card.front}
              </p>
            </div>

            {/* Tap hint */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:`${C.primary}10`, border:`1px solid ${C.primary}20`,
              borderRadius:12, padding:'10px 14px', margin:'0 12px',
            }}>
              <span style={{ fontSize:16 }}>👆</span>
              <span style={{ fontSize:14, fontWeight:700, color:C.muted }}>Tap to reveal answer</span>
            </div>
          </div>

          {/* Back face */}
          <div style={{
            position:'absolute', inset:0,
            backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
            transform:'rotateY(180deg)',
            background:`${C.primary}14`, border:`1.5px solid ${C.primary}50`,
            borderRadius:20, padding:'20px 20px 16px', overflow:'hidden',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            {/* Edge direction cues */}
            <div style={{
              position:'absolute', left:0, top:0, bottom:0, width:32,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(to right,rgba(239,68,68,0.1),transparent)',
              borderRadius:'20px 0 0 20px', pointerEvents:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#EF4444', opacity:0.7, writingMode:'vertical-rl', transform:'rotate(180deg)', letterSpacing:'0.1em' }}>SKIP</span>
            </div>
            <div style={{
              position:'absolute', right:0, top:0, bottom:0, width:32,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(to left,rgba(16,185,129,0.1),transparent)',
              borderRadius:'0 20px 20px 0', pointerEvents:'none',
            }}>
              <span style={{ fontSize:11, fontWeight:900, color:'#10B981', opacity:0.7, writingMode:'vertical-rl', letterSpacing:'0.1em' }}>KNOW</span>
            </div>

            <div style={{ padding:'0 12px' }}>
              <div style={{
                fontSize:11, fontWeight:800, color:C.primary,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12,
              }}>
                Answer
              </div>
              <p style={{ fontSize:17, fontWeight:800, color:C.navy, lineHeight:1.6, margin:0 }}>
                {card.back}
              </p>
            </div>

            {/* Swipe hint */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:`${C.primary}14`, border:`1px solid ${C.primary}30`,
              borderRadius:12, padding:'10px 14px', margin:'0 12px',
            }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#EF4444' }}>← Skip</span>
              <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>·</span>
              <span style={{ fontSize:14, fontWeight:800, color:C.muted }}>swipe to rate</span>
              <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>·</span>
              <span style={{ fontSize:14, fontWeight:800, color:'#10B981' }}>Know →</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── FlashcardDeck (default export) ────────────────────────────────────────────
const DEFAULT_C = {
  card:'#FFFFFF', border:'#E5E7EB', primary:'#0F766E',
  navy:'#134E4A', muted:'#6B7280',
}

export default function FlashcardDeck({ cards, C = DEFAULT_C, height = 260, onDismiss, onFlipChange, onComplete }) {
  const [index, setIndex] = useState(0)

  if (!cards?.length || index >= cards.length) return null

  function handleDismiss(dir) {
    onDismiss?.(cards[index].id, dir)
    onFlipChange?.(false)
    const next = index + 1
    if (next >= cards.length) onComplete?.()
    else setIndex(next)
  }

  return (
    <div style={{ position:'relative', height, userSelect:'none' }}>
      <style>{`
        @keyframes cardEntrance {
          from { transform: scale(0.94) translateY(8px); opacity:0; }
          to   { transform: scale(1)    translateY(0);   opacity:1; }
        }
      `}</style>

      {/* Ghost stack */}
      {[2, 1].map(offset => (
        <div key={offset} style={{
          position:'absolute', inset:0,
          background:C.soft, border:`1.5px solid ${C.primary}20`,
          borderRadius:20,
          transform:`translateY(${offset * 8}px) scale(${1 - offset * 0.04})`,
          opacity: 1 - offset * 0.35,
          zIndex: 3 - offset,
          willChange:'transform',
        }} />
      ))}

      <Flashcard
        key={index}
        card={cards[index]}
        C={C}
        onDismiss={handleDismiss}
        onFlipChange={onFlipChange}
      />
    </div>
  )
}
