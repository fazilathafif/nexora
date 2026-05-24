import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../data/questions.js'
import { getColors, Shell } from './HomePage.jsx'

const PAIR_COUNT = 4

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clip(text, max = 72) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export default function MatchPage({ isDark }) {
  const { stream, subject } = useParams()
  const navigate = useNavigate()
  const C    = getColors(stream, subject, isDark)
  const dark = isDark

  const questions = useMemo(() => {
    const all = getQuestions(stream, subject)
    return shuffle(all).slice(0, PAIR_COUNT)
  }, [stream, subject])

  const tiles = useMemo(() => shuffle([
    ...questions.map(q => ({ id: q.id + '_q', text: clip(q.q), pairId: q.id })),
    ...questions.map(q => ({ id: q.id + '_a', text: q.opts[q.ans],  pairId: q.id })),
  ]), [questions])

  const [states,   setStates]   = useState(() =>
    Object.fromEntries(tiles.map(t => [t.id, 'idle']))
  )
  const [selected, setSelected] = useState(null)
  const [matched,  setMatched]  = useState(new Set())
  const [elapsed,  setElapsed]  = useState(0)
  const [misses,   setMisses]   = useState(0)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    if (done) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [done])

  function tap(tile) {
    if (matched.has(tile.pairId)) return
    if (states[tile.id] === 'wrong') return

    if (!selected) {
      setSelected(tile.id)
      setStates(s => ({ ...s, [tile.id]: 'selected' }))
      return
    }

    if (selected === tile.id) {
      setSelected(null)
      setStates(s => ({ ...s, [tile.id]: 'idle' }))
      return
    }

    const selTile = tiles.find(t => t.id === selected)

    if (selTile.pairId === tile.pairId) {
      const newMatched = new Set([...matched, tile.pairId])
      setMatched(newMatched)
      setStates(s => ({ ...s, [selected]: 'matched', [tile.id]: 'matched' }))
      setSelected(null)
      if (newMatched.size >= PAIR_COUNT) setTimeout(() => setDone(true), 500)
    } else {
      setMisses(m => m + 1)
      const ids = [selected, tile.id]
      setStates(s => ({ ...s, [selected]: 'wrong', [tile.id]: 'wrong' }))
      setSelected(null)
      setTimeout(() => {
        setStates(s => {
          const next = { ...s }
          ids.forEach(id => { if (next[id] !== 'matched') next[id] = 'idle' })
          return next
        })
      }, 650)
    }
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) {
    const timeLabel = elapsed < 60 ? `${elapsed}s` : `${mins}:${secs}`
    const rating = misses === 0 ? '🏆 Perfect!' : misses <= 2 ? '⭐ Great!' : '💪 Keep going!'
    return (
      <Shell C={C} isDark={isDark}>
        <style>{css}</style>
        <div style={{textAlign:'center', paddingTop:48, fontFamily:'Inter,sans-serif'}}>
          <div style={{fontSize:52, marginBottom:12}}>🎯</div>
          <div style={{fontSize:22, fontWeight:900, color:C.navy, marginBottom:4}}>{rating}</div>
          <div style={{fontSize:13, color:C.muted, marginBottom:28}}>
            {PAIR_COUNT} pairs matched
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28}}>
            <div style={{background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'16px 10px', textAlign:'center'}}>
              <div style={{fontSize:22, fontWeight:900, color:C.primary}}>⏱ {timeLabel}</div>
              <div style={{fontSize:11, color:C.muted, marginTop:3}}>Time</div>
            </div>
            <div style={{background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'16px 10px', textAlign:'center'}}>
              <div style={{fontSize:22, fontWeight:900, color: misses===0?'#10B981':'#F59E0B'}}>{misses}</div>
              <div style={{fontSize:11, color:C.muted, marginTop:3}}>Misses</div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,
              color:'white', border:'none', borderRadius:14, padding:'14px',
              fontSize:14, fontWeight:800, cursor:'pointer', width:'100%',
              marginBottom:10, fontFamily:'Inter,sans-serif',
            }}
          >
            Play Again 🔄
          </button>
          <button
            onClick={() => navigate(`/${stream}`)}
            style={{
              background:'transparent', border:`1.5px solid ${C.border}`,
              borderRadius:14, padding:'13px', fontSize:13, fontWeight:700,
              color:C.muted, cursor:'pointer', width:'100%', fontFamily:'Inter,sans-serif',
            }}
          >
            ← Back to subjects
          </button>
        </div>
      </Shell>
    )
  }

  // ── Game board ───────────────────────────────────────────────────────────────
  return (
    <Shell C={C} isDark={isDark}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
        <button
          onClick={() => navigate(`/${stream}/flashcards/${subject}`)}
          style={{
            background:'transparent', border:`1.5px solid ${C.border}`, borderRadius:8,
            padding:'5px 12px', fontSize:11, fontWeight:700, color:C.muted,
            cursor:'pointer', fontFamily:'Inter,sans-serif',
          }}
        >← Cards</button>
        <div style={{fontWeight:900, color:C.navy, fontSize:16}}>🔗 Match Mode</div>
        <span style={{fontWeight:900, color:C.primary, fontSize:16, fontVariantNumeric:'tabular-nums'}}>
          {mins}:{secs}
        </span>
      </div>

      {/* Progress */}
      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:C.muted, marginBottom:6}}>
        <span>{matched.size}/{PAIR_COUNT} matched</span>
        <span style={{color: misses > 0 ? '#F59E0B' : C.muted}}>
          {misses} miss{misses !== 1 ? 'es' : ''}
        </span>
      </div>
      <div style={{background:C.border, borderRadius:8, height:5, marginBottom:20}}>
        <div style={{
          width:`${(matched.size/PAIR_COUNT)*100}%`,
          background:`linear-gradient(90deg,${C.primary},${C.secondary??C.primary})`,
          height:'100%', borderRadius:8, transition:'width 0.4s ease',
        }}/>
      </div>

      {/* Tile grid — 2 columns */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        {tiles.map(tile => {
          const st = states[tile.id]
          const isMatched = matched.has(tile.pairId)
          return (
            <button
              key={tile.id}
              onClick={() => tap(tile)}
              disabled={isMatched}
              style={{
                background: st==='selected' ? `${C.primary}20`
                  : st==='matched'          ? '#10B98115'
                  : st==='wrong'            ? '#EF444415'
                  : C.card,
                border: st==='selected' ? `2px solid ${C.primary}`
                  : st==='matched'      ? '2px solid #10B981'
                  : st==='wrong'        ? '2px solid #EF4444'
                  : `1.5px solid ${C.border}`,
                borderRadius:14, padding:'12px 10px',
                minHeight:82, cursor: isMatched ? 'default' : 'pointer',
                textAlign:'left', fontSize:12, fontWeight:600,
                color: st==='matched' ? '#10B981'
                  : st==='selected'   ? C.primary
                  : C.navy,
                fontFamily:'Inter,sans-serif',
                display:'flex', alignItems:'center',
                opacity: isMatched ? 0.35 : 1,
                lineHeight:1.45, wordBreak:'break-word',
                transition:'background 0.15s, border-color 0.15s, opacity 0.4s',
                animation: st==='wrong' ? 'matchShake 0.4s ease' : 'none',
              }}
            >
              {tile.text}
            </button>
          )
        })}
      </div>

      <div style={{textAlign:'center', marginTop:18, fontSize:11, color:C.muted, lineHeight:1.5}}>
        Tap a question tile, then its correct answer
      </div>
    </Shell>
  )
}

const css = `
  @keyframes matchShake {
    0%,100%{transform:translateX(0)}
    20%,60%{transform:translateX(-5px)}
    40%,80%{transform:translateX(5px)}
  }
`
