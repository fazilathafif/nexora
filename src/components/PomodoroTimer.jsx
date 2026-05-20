import { useState, useEffect, useRef } from 'react'
import { NAV_HEIGHT } from '../styles/tokens.js'

const WORK_SECS  = 25 * 60
const BREAK_SECS = 5  * 60

export default function PomodoroTimer({ active, setActive }) {
  const [phase,     setPhase]     = useState('work')
  const [remaining, setRemaining] = useState(WORK_SECS)
  const [mini,      setMini]      = useState(false)
  const [done,      setDone]      = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!active || done) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); setDone(true); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active, done, phase])

  function advance() {
    const next = phase === 'work' ? 'break' : 'work'
    setPhase(next)
    setRemaining(next === 'work' ? WORK_SECS : BREAK_SECS)
    setDone(false)
  }

  function stop() {
    clearInterval(intervalRef.current)
    setActive(false)
    setPhase('work')
    setRemaining(WORK_SECS)
    setDone(false)
    setMini(false)
  }

  if (!active) return null

  const isWork = phase === 'work'
  const total  = isWork ? WORK_SECS : BREAK_SECS
  const pct    = (remaining / total) * 100
  const color  = isWork ? '#7C3AED' : '#10B981'
  const mins   = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs   = String(remaining % 60).padStart(2, '0')

  // ── Phase-end alert ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{`@keyframes pomoPop{from{opacity:0;transform:scale(0.82)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{
          background: isWork ? '#1a1740' : '#042f2e',
          border: `2px solid ${color}60`, borderRadius:24,
          padding:'32px 28px', textAlign:'center', maxWidth:300, width:'90%',
          animation:'pomoPop 0.3s ease', fontFamily:'Inter,sans-serif',
        }}>
          <div style={{fontSize:52, marginBottom:12}}>{isWork ? '☕' : '🍅'}</div>
          <div style={{fontSize:20, fontWeight:900, color:'white', marginBottom:6}}>
            {isWork ? 'Time for a break!' : "Break's over!"}
          </div>
          <div style={{fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.6}}>
            {isWork
              ? 'Great focus session. Rest your eyes for 5 minutes.'
              : "Ready to get back into it? Let's go!"}
          </div>
          <button onClick={advance} style={{
            background:color, color:'white', border:'none', borderRadius:14,
            padding:'13px', fontSize:14, fontWeight:800, cursor:'pointer',
            width:'100%', fontFamily:'Inter,sans-serif',
          }}>
            {isWork ? 'Start Break ☕' : 'Start Focus 🍅'}
          </button>
          <button onClick={stop} style={{
            background:'none', border:'none', color:'rgba(255,255,255,0.35)',
            fontSize:12, cursor:'pointer', marginTop:14, fontFamily:'Inter,sans-serif',
          }}>
            End session
          </button>
        </div>
      </div>
    )
  }

  // ── Minimised pill ───────────────────────────────────────────────────────────
  if (mini) {
    return (
      <button onClick={() => setMini(false)} style={{
        position:'fixed', bottom:`calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`, right:16, zIndex:200,
        background: isWork ? '#1a1740' : '#042f2e',
        border: `1.5px solid ${color}50`, borderRadius:20,
        padding:'7px 14px', display:'flex', alignItems:'center', gap:7,
        cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.35)',
        fontFamily:'Inter,sans-serif',
      }}>
        <span style={{fontSize:15}}>{isWork ? '🍅' : '☕'}</span>
        <span style={{fontWeight:900, color:'white', fontSize:14, fontVariantNumeric:'tabular-nums'}}>
          {mins}:{secs}
        </span>
      </button>
    )
  }

  // ── Full floating widget ─────────────────────────────────────────────────────
  const SZ = 78, R = (SZ - 8) / 2, CIRC = 2 * Math.PI * R
  return (
    <div style={{
      position:'fixed', bottom:`calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`, right:16, zIndex:200,
      background: isWork ? '#13113a' : '#042f2e',
      border: `1.5px solid ${color}40`, borderRadius:20,
      padding:'12px 14px', display:'flex', flexDirection:'column',
      alignItems:'center', gap:6, boxShadow:'0 8px 32px rgba(0,0,0,0.45)',
      minWidth:112, fontFamily:'Inter,sans-serif',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
        <span style={{fontSize:10, fontWeight:800, color, letterSpacing:'0.08em'}}>
          {isWork ? '🍅 FOCUS' : '☕ BREAK'}
        </span>
        <button onClick={() => setMini(true)} style={{
          background:'none', border:'none', color:'rgba(255,255,255,0.35)',
          cursor:'pointer', fontSize:13, padding:'0 0 0 8px', lineHeight:1,
        }}>—</button>
      </div>

      <div style={{position:'relative', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <svg width={SZ} height={SZ} style={{transform:'rotate(-90deg)'}}>
          <circle cx={SZ/2} cy={SZ/2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7}/>
          <circle cx={SZ/2} cy={SZ/2} r={R} fill="none" stroke={color}
            strokeWidth={7} strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-pct/100)}
            strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}}/>
        </svg>
        <div style={{position:'absolute', textAlign:'center'}}>
          <div style={{fontWeight:900, color:'white', fontSize:18, fontVariantNumeric:'tabular-nums'}}>
            {mins}:{secs}
          </div>
        </div>
      </div>

      <button onClick={stop} style={{
        background:'transparent', border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:8, padding:'4px 0', fontSize:10, fontWeight:700,
        color:'rgba(255,255,255,0.35)', cursor:'pointer', width:'100%',
      }}>
        Stop
      </button>
    </div>
  )
}
