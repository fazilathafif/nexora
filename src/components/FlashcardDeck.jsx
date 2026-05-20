/**
 * FlashcardDeck — stacked deck with 3D flip + Tinder-style swipe-to-dismiss.
 *
 * Usage:
 *   <FlashcardDeck
 *     cards={[{ id, front, back, label? }]}
 *     C={colorScheme}         // { card, border, primary, navy, muted }
 *     height={260}            // optional, default 260
 *     onDismiss={(id, dir) => {}}   // 'left' | 'right', called after fly-out
 *     onComplete={() => {}}   // called when last card dismissed
 *   />
 *
 * Implementation notes:
 *   - Card position and overlay opacity are applied directly via refs (no
 *     React state during drag) so zero re-renders occur per pointer-move event.
 *   - Velocity check on pointerUp enables fast-flick dismissal below the px
 *     threshold — matches the feel of native swipe-to-dismiss UIs.
 *   - Each new top card is mounted via `key={index}` so flip state resets.
 */

import { useState, useRef } from 'react'

const DISMISS_PX  = 80    // px — commit dismiss above this
const DISMISS_VEL = 0.4   // px/ms — fast-flick always dismisses

// ── useSwipe ──────────────────────────────────────────────────────────────────
// All drag tracking lives in refs. DOM nodes (cardRef, leftRef, rightRef) are
// mutated directly so no React re-renders fire during a drag gesture.
function useSwipe({ onDismiss, onFlip }) {
  const cardRef  = useRef(null)
  const leftRef  = useRef(null)   // "skip" red overlay
  const rightRef = useRef(null)   // "know" green overlay

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
    const opacity = Math.min(Math.abs(dx) / 100, 1)

    el.style.transition = withTransition
      ? 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none'
    el.style.transform = `translateX(${dx}px) rotate(${angle}deg)`

    if (leftRef.current) {
      leftRef.current.style.opacity    = dx < -10 ? opacity : 0
      leftRef.current.style.background = `rgba(239,68,68,${opacity * 0.38})`
    }
    if (rightRef.current) {
      rightRef.current.style.opacity    = dx > 10 ? opacity : 0
      rightRef.current.style.background = `rgba(16,185,129,${opacity * 0.38})`
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
      paint(0, false)  // reset overlays immediately
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
function Flashcard({ card, C, onDismiss }) {
  const [flipped, setFlipped] = useState(false)

  const { cardRef, leftRef, rightRef, onPointerDown, onPointerMove, onPointerUp } =
    useSwipe({ onDismiss, onFlip: () => setFlipped(f => !f) })

  return (
    <div
      ref={cardRef}
      style={{ position:'absolute', inset:0, zIndex:5, touchAction:'pan-y', cursor:'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Skip overlay — fades in on left swipe */}
      <div ref={leftRef} style={{
        position:'absolute', inset:0, borderRadius:20, zIndex:10, pointerEvents:'none',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:44, color:'white', fontWeight:900, opacity:0,
      }}>✗</div>

      {/* Know overlay — fades in on right swipe */}
      <div ref={rightRef} style={{
        position:'absolute', inset:0, borderRadius:20, zIndex:10, pointerEvents:'none',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:44, color:'white', fontWeight:900, opacity:0,
      }}>✓</div>

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
            background:C.card, border:`1.5px solid ${C.border}`,
            borderRadius:20, padding:'24px', overflow:'hidden',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            <div>
              <div style={{
                fontSize:10, fontWeight:800, color:C.muted,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12,
              }}>
                {card.label ?? 'Question'}
              </div>
              <p style={{ fontSize:16, fontWeight:700, color:C.navy, lineHeight:1.65, margin:0 }}>
                {card.front}
              </p>
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:C.muted, opacity:0.6 }}>
              Tap to reveal · swipe to rate
            </div>
          </div>

          {/* Back face */}
          <div style={{
            position:'absolute', inset:0,
            backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
            transform:'rotateY(180deg)',
            background:`${C.primary}14`, border:`1.5px solid ${C.primary}50`,
            borderRadius:20, padding:'24px', overflow:'hidden',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            <div>
              <div style={{
                fontSize:10, fontWeight:800, color:C.primary,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12,
              }}>
                Answer
              </div>
              <p style={{ fontSize:16, fontWeight:800, color:C.navy, lineHeight:1.6, margin:0 }}>
                {card.back}
              </p>
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:C.muted, opacity:0.5 }}>
              Tap to flip back · swipe left/right to rate
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

export default function FlashcardDeck({ cards, C = DEFAULT_C, height = 260, onDismiss, onComplete }) {
  const [index, setIndex] = useState(0)

  if (!cards?.length || index >= cards.length) return null

  function handleDismiss(dir) {
    onDismiss?.(cards[index].id, dir)
    const next = index + 1
    if (next >= cards.length) onComplete?.()
    else setIndex(next)
  }

  return (
    <div style={{ position:'relative', height, userSelect:'none' }}>
      {/* Ghost cards — visible depth behind the top card */}
      {[2, 1].map(offset => (
        <div key={offset} style={{
          position:'absolute', inset:0,
          background:C.card, border:`1.5px solid ${C.border}`,
          borderRadius:20,
          transform:`translateY(${offset * 8}px) scale(${1 - offset * 0.04})`,
          opacity: 1 - offset * 0.35,
          zIndex: 3 - offset,
          willChange:'transform',
        }} />
      ))}

      {/* Top card — key resets flip state on each new card */}
      <Flashcard
        key={index}
        card={cards[index]}
        C={C}
        onDismiss={handleDismiss}
      />
    </div>
  )
}
