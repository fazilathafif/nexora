import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../data/questions.js'
import { getColors, Shell } from './HomePage.jsx'
import { scheduleReview } from '../lib/srs.js'
import { canAccess } from '../lib/subscription.js'

const WRONG_CAP = 3

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function LearnPage({ profile, isDark }) {
  const { stream, subject } = useParams()
  const navigate            = useNavigate()
  const C                   = getColors(stream, null, isDark)
  const dark                = isDark

  // Explore mode gate
  if (sessionStorage.getItem('nx_explore') === '1') { navigate('/', { replace: true }); return null }
  // Free plan gate — Learn mode (deepDive) not included
  if (!canAccess(profile, 'deepDive')) { navigate(`/${stream}/subscription`, { replace: true }); return null }

  const allQuestions = getQuestions(stream, subject)

  const [queue,       setQueue]       = useState(() => shuffle(allQuestions))
  const [idx,         setIdx]         = useState(0)
  const [learned,     setLearned]     = useState(0)
  const [wrongCounts, setWrongCounts] = useState({})
  const [phase,       setPhase]       = useState('question') // 'question' | 'feedback'
  const [selected,    setSelected]    = useState(null)

  const total   = allQuestions.length
  const done    = idx >= queue.length
  const current = queue[idx]

  // Shuffle options once per card (stable across re-renders while idx stays same)
  const [shuffledOpts, setShuffledOpts] = useState([])

  useEffect(() => {
    if (!current) return
    const opts = current.opts.map((text, i) => ({ text, original: i }))
    setShuffledOpts(shuffle(opts))
    setPhase('question')
    setSelected(null)
  }, [idx]) // eslint-disable-line

  const handleSelect = useCallback((optOriginalIndex) => {
    if (phase !== 'question') return
    setSelected(optOriginalIndex)
    setPhase('feedback')

    const correct = optOriginalIndex === current.ans
    scheduleReview(current.id, correct)

    if (correct) {
      setLearned(l => l + 1)
    } else {
      // Re-queue unless over cap
      const wc = wrongCounts[current.id] ?? 0
      if (wc < WRONG_CAP) {
        setWrongCounts(prev => ({ ...prev, [current.id]: wc + 1 }))
        setQueue(q => [...q, current])
      }
    }
  }, [phase, current, wrongCounts])

  function advance() {
    setIdx(i => i + 1)
  }

  if (!allQuestions.length) {
    return (
      <Shell C={C} isDark={isDark}>
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <div style={{fontSize:38, marginBottom:12}}>📭</div>
          <div style={{fontSize:16, fontWeight:700, color:C.navy}}>No questions available</div>
          <button onClick={() => navigate(-1)} style={backBtnS(C)}>← Go Back</button>
        </div>
      </Shell>
    )
  }

  if (done) {
    const pct = Math.round((learned / total) * 100)
    return (
      <Shell C={C} isDark={isDark}>
        <style>{`@keyframes learnPop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{textAlign:'center', padding:'40px 20px', animation:'learnPop 0.4s ease'}}>
          <div style={{fontSize:64, marginBottom:8}}>🎓</div>
          <div style={{fontSize:26, fontWeight:900, color:C.navy, letterSpacing:'-0.5px', marginBottom:6}}>
            Session Complete!
          </div>
          <div style={{fontSize:14, color:C.muted, marginBottom:28}}>
            You learned <strong style={{color:C.primary}}>{learned}</strong> of {total} cards
          </div>

          {/* Progress ring approximation via text */}
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:120, height:120, borderRadius:60,
            background:`conic-gradient(${C.primary} ${pct}%, ${C.border} 0)`,
            marginBottom:28,
          }}>
            <div style={{
              width:92, height:92, borderRadius:46, background:C.card,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            }}>
              <div style={{fontSize:28, fontWeight:900, color:C.primary}}>{pct}%</div>
              <div style={{fontSize:9, color:C.muted, fontWeight:700}}>MASTERED</div>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:10, maxWidth:280, margin:'0 auto'}}>
            <button
              onClick={() => { setQueue(shuffle(allQuestions)); setIdx(0); setLearned(0); setWrongCounts({}) }}
              style={{...primaryBtnS(C), padding:'13px'}}
            >
              🔁 Study Again
            </button>
            <button
              onClick={() => navigate(`/${stream}/flashcards/${subject}`)}
              style={{...secondaryBtnS(C)}}
            >
              🃏 Switch to Flashcards
            </button>
            <button onClick={() => navigate(-1)} style={backBtnS(C)}>← Back</button>
          </div>
        </div>
      </Shell>
    )
  }

  const isCorrect = selected !== null && selected === current.ans

  const remaining = queue.length - idx - 1

  return (
    <Shell C={C} isDark={isDark}>
      <style>{`
        @keyframes learnShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes learnBounce { 0%{transform:scale(1)} 50%{transform:scale(1.04)} 100%{transform:scale(1)} }
      `}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:18}}>
        <button onClick={() => navigate(-1)} style={{background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:20, padding:0, lineHeight:1}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:800, color:C.navy}}>Learn Mode</div>
          <div style={{fontSize:11, color:C.muted, marginTop:1}}>
            {learned} learned · {remaining} remaining
          </div>
        </div>
        <div style={{fontSize:11, fontWeight:700, color:C.primary}}>
          {idx + 1} / {queue.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:5, background:C.border, borderRadius:3, marginBottom:20, overflow:'hidden'}}>
        <div style={{
          height:'100%', borderRadius:3,
          background:`linear-gradient(90deg,${C.primary},${C.secondary??C.primary})`,
          width:`${(learned / total) * 100}%`,
          transition:'width 0.4s ease',
        }} />
      </div>

      {/* Question card */}
      <div style={{
        background: C.card,
        borderRadius:20,
        padding:'24px 20px',
        marginBottom:16,
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.09)',
        minHeight:120,
        display:'flex', alignItems:'center', justifyContent:'center',
        animation: phase === 'feedback' && !isCorrect ? 'learnShake 0.4s ease' : 'none',
      }}>
        <p style={{
          fontSize:15, fontWeight:700, color:C.navy,
          lineHeight:1.65, textAlign:'center', margin:0,
        }}>
          {current.q}
        </p>
      </div>

      {/* Topic chip */}
      {current.topic && (
        <div style={{textAlign:'center', marginBottom:14}}>
          <span style={{fontSize:10, fontWeight:700, color:C.muted, background:C.soft, borderRadius:20, padding:'3px 10px'}}>
            {current.topic}
          </span>
        </div>
      )}

      {/* MC options */}
      <div style={{display:'flex', flexDirection:'column', gap:9, marginBottom:20}}>
        {shuffledOpts.map(opt => {
          const chosen    = selected === opt.original
          const isAns     = opt.original === current.ans
          const showRight = phase === 'feedback' && isAns
          const showWrong = phase === 'feedback' && chosen && !isAns

          return (
            <button
              key={opt.original}
              onClick={() => handleSelect(opt.original)}
              disabled={phase !== 'question'}
              style={{
                width:'100%', textAlign:'left',
                padding:'13px 16px',
                borderRadius:14,
                border: `2px solid ${
                  showRight ? '#10B981'
                  : showWrong ? '#EF4444'
                  : phase === 'feedback' && !chosen ? `${C.border}`
                  : C.border
                }`,
                background: showRight ? '#10B98112'
                  : showWrong ? '#EF444412'
                  : 'white',
                fontSize:13, fontWeight:600, color:C.navy,
                cursor: phase === 'question' ? 'pointer' : 'default',
                fontFamily:'Inter,sans-serif',
                transition:'all 0.15s ease',
                animation: showRight ? 'learnBounce 0.3s ease' : 'none',
                display:'flex', alignItems:'center', gap:10,
              }}
            >
              <span style={{
                width:22, height:22, borderRadius:11, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800,
                background: showRight ? '#10B981' : showWrong ? '#EF4444' : C.soft,
                color: (showRight || showWrong) ? 'white' : C.muted,
                transition:'all 0.15s',
              }}>
                {showRight ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + shuffledOpts.indexOf(opt))}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Feedback banner + Continue */}
      {phase === 'feedback' && (
        <div style={{
          background: isCorrect ? '#10B98112' : '#EF444412',
          border: `1.5px solid ${isCorrect ? '#10B98140' : '#EF444440'}`,
          borderRadius:14, padding:'12px 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12,
        }}>
          <div>
            <div style={{fontSize:13, fontWeight:800, color: isCorrect ? '#10B981' : '#EF4444'}}>
              {isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </div>
            {!isCorrect && (
              <div style={{fontSize:11, color:C.muted, marginTop:2}}>
                Correct: <strong style={{color:C.navy}}>{current.opts[current.ans]}</strong>
              </div>
            )}
          </div>
          <button onClick={advance} style={primaryBtnS(C)}>
            {idx + 1 >= queue.length ? 'Finish' : 'Continue →'}
          </button>
        </div>
      )}
    </Shell>
  )
}

function primaryBtnS(C) {
  return {
    background:`linear-gradient(135deg,${C.primary},${C.secondary??C.primary})`,
    color:'white', border:'none', borderRadius:10,
    padding:'10px 18px', fontSize:13, fontWeight:700,
    cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0,
  }
}

function secondaryBtnS(C) {
  return {
    background:C.soft, color:C.primary,
    border:`1.5px solid ${C.primary}30`,
    borderRadius:10, padding:'10px 18px',
    fontSize:13, fontWeight:700, cursor:'pointer',
    fontFamily:'Inter,sans-serif',
  }
}

function backBtnS(C) {
  return {
    background:'none', border:'none',
    color:C.muted, fontSize:13, fontWeight:600,
    cursor:'pointer', fontFamily:'Inter,sans-serif', padding:'8px 0',
  }
}
