/**
 * MockPage — timed full-paper mock exam.
 * Navigator grid is hidden behind a tappable Q-pill that opens a bottom sheet.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions, MOCK_CONFIG } from '../data/questions.js'
import { useProgress }               from '../hooks/useProgress.js'
import { scheduleReview }            from '../lib/srs.js'
import { getColors, Shell, Badge }   from './HomePage.jsx'
import { NAV_HEIGHT }                from '../styles/tokens.js'

function fmt(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function MockPage({ user, profile, refreshProfile }) {
  const { stream, subject } = useParams()
  const navigate             = useNavigate()
  const C                    = getColors(stream, subject)
  const dark                 = stream === 'alevel'

  const cfg = stream === 'gcse'
    ? MOCK_CONFIG.gcse
    : MOCK_CONFIG.alevel?.[subject]

  const questions = getQuestions(stream, subject)
  const { startQuizSession, submitAnswer, finishQuizSession } = useProgress(user, profile, refreshProfile)

  const [answers,      setAnswers]      = useState(() => Array(questions.length).fill(null))
  const [qIndex,       setQIndex]       = useState(0)
  const [remaining,    setRemaining]    = useState(cfg?.duration ?? 3600)
  const [started,      setStarted]      = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [showNav,      setShowNav]      = useState(false)
  const [showExit,     setShowExit]     = useState(false)

  const intervalRef = useRef(null)
  const answersRef  = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  const timerColor = remaining < 300 ? '#EF4444' : remaining < 600 ? '#F59E0B' : C.primary
  const timerPct   = cfg ? (remaining / cfg.duration) * 100 : 100
  const answered   = answers.filter(a => a !== null).length

  useEffect(() => {
    if (started || !questions.length) return
    startQuizSession(stream, subject, questions.length).then(() => setSessionReady(true))
    setStarted(true)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!sessionReady || submitted || !cfg?.duration) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); handleSubmit(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [sessionReady]) // eslint-disable-line

  function chooseAnswer(idx) {
    setAnswers(prev => {
      const next = [...prev]
      next[qIndex] = idx
      return next
    })
  }

  function jumpTo(i) {
    setQIndex(i)
    setShowNav(false)
  }

  async function handleSubmit(fromTimer = false) {
    if (submitted) return
    setSubmitted(true)
    clearInterval(intervalRef.current)
    setShowNav(false)

    const finalAnswers = answersRef.current
    let score = 0
    const entries = questions.map((q, i) => {
      const chosen  = finalAnswers[i] ?? -1
      const correct = chosen === q.ans
      if (correct) score++
      scheduleReview(q.id, correct)
      submitAnswer({ questionId: q.id, topic: q.topic, chosenIndex: chosen, correctIndex: q.ans, hintUsed: false, stream })
      return { q, chosen, correct, hintUsed: false }
    })

    const xpEarned = await finishQuizSession(score, stream)
    navigate(`/${stream}/result`, {
      state: { answers: entries, score, total: questions.length, subject, xpEarned: xpEarned ?? score * (dark ? 15 : 10), mockMode: true },
    })
  }

  const currentQ = questions[qIndex]

  if (!cfg || !questions.length) {
    return (
      <Shell C={C}>
        <p style={{color:C.muted,textAlign:'center',marginTop:60}}>Mock exam not available for this subject.</p>
        <button onClick={() => navigate(`/${stream}`)} style={{marginTop:20,color:C.primary,background:'none',border:'none',cursor:'pointer',fontWeight:700}}>← Go back</button>
      </Shell>
    )
  }

  return (
    <Shell C={C}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>

        {/* Exit */}
        <button
          onClick={() => setShowExit(true)}
          style={{
            width:36, height:36, borderRadius:10,
            border:`1px solid ${C.border}`, background:'transparent',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, color:C.muted, cursor:'pointer', flexShrink:0,
          }}
        >✕</button>

        {/* Q pill — tappable navigator trigger */}
        <button
          onClick={() => setShowNav(true)}
          style={{
            background: C.card,
            border: `1.5px solid ${C.primary}35`,
            borderRadius: 20,
            padding: '7px 18px',
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          }}
        >
          <span style={{fontSize:15, fontWeight:900, color:C.navy}}>Q {qIndex + 1}</span>
          <span style={{fontSize:12, color:C.muted, fontWeight:600}}>/ {questions.length}</span>
          <span style={{fontSize:9, color:C.primary, marginLeft:2, opacity:0.7}}>▾</span>
        </button>

        {/* Timer */}
        {cfg.duration > 0 ? (
          <div style={{textAlign:'right', minWidth:56}}>
            <div style={{fontSize:19, fontWeight:900, color:timerColor, fontVariantNumeric:'tabular-nums', lineHeight:1}}>
              {fmt(remaining)}
            </div>
            <div style={{fontSize:9, color:C.muted, marginTop:1}}>remaining</div>
          </div>
        ) : (
          <div style={{width:36}} />
        )}
      </div>

      {/* Timer bar */}
      {cfg.duration > 0 && (
        <div style={{background:C.border, borderRadius:8, height:4, marginBottom:16, overflow:'hidden'}}>
          <div style={{
            width:`${timerPct}%`, background:timerColor, height:'100%',
            borderRadius:8, transition:'width 1s linear, background 0.5s',
          }} />
        </div>
      )}

      {/* Topic + difficulty */}
      <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
        <Badge label={currentQ.topic} color={C.primary} />
        <Badge label={`Difficulty ${'★'.repeat(currentQ.difficulty)}`} color={C.muted} />
      </div>

      {/* Passage */}
      {currentQ.passage && (
        <div style={{background:C.card, border:`1px solid ${C.border}30`, borderRadius:16, padding:'14px 16px', marginBottom:12, maxHeight:190, overflowY:'auto', fontSize:13, color:C.muted, lineHeight:1.75, boxShadow: dark?'0 4px 16px rgba(0,0,0,0.3)':'0 4px 12px rgba(0,0,0,0.06)'}}>
          <p style={{margin:'0 0 8px', fontWeight:700, color:C.primary, fontSize:10, letterSpacing:'0.12em'}}>PASSAGE — READ CAREFULLY</p>
          <p style={{margin:0}}>{currentQ.passage}</p>
        </div>
      )}

      {/* Question */}
      <div style={{background:C.card, borderRadius:22, padding:'22px 20px', marginBottom:14, boxShadow:dark?'0 6px 28px rgba(0,0,0,0.40)':'0 6px 24px rgba(0,0,0,0.08)'}}>
        <p style={{fontSize:16, fontWeight:700, color:C.navy, lineHeight:1.65, margin:0}}>{currentQ.q}</p>
      </div>

      {/* Answer options */}
      <div style={{display:'grid', gap:9, marginBottom:18}}>
        {currentQ.opts.map((opt, i) => {
          const chosen   = answers[qIndex]
          const selected = chosen === i
          return (
            <button
              key={i} onClick={() => chooseAnswer(i)}
              style={{
                background: selected ? C.primary+'25' : C.card,
                border: selected ? `2px solid ${C.primary}` : `1.5px solid ${C.border}40`,
                borderRadius:16, padding:'14px 16px', minHeight:56,
                textAlign:'left', cursor:'pointer',
                fontSize:14, fontWeight:600, color:C.navy, transition:'all 0.2s',
                boxShadow: selected ? `0 0 0 3px ${C.primary}18` : (dark ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)'),
              }}
            >
              <span style={{fontWeight:900, marginRight:10, opacity:0.4, fontSize:12}}>{['A','B','C','D'][i]}</span>
              {opt}
              {selected && <span style={{float:'right', color:C.primary}}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Prev / Next */}
      <div style={{display:'flex', gap:8}}>
        {qIndex > 0 ? (
          <button
            onClick={() => setQIndex(q => q - 1)}
            style={{flex:1, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'15px', fontSize:14, fontWeight:700, color:C.muted, cursor:'pointer'}}
          >← Prev</button>
        ) : <div style={{flex:1}} />}

        {qIndex < questions.length - 1 ? (
          <button
            onClick={() => setQIndex(q => q + 1)}
            style={{flex:2, background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`, color:'white', border:'none', borderRadius:14, padding:'15px', fontSize:14, fontWeight:800, cursor:'pointer'}}
          >Next →</button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            style={{flex:2, background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:14, padding:'15px', fontSize:15, fontWeight:800, cursor:'pointer'}}
          >Submit 🎉</button>
        )}
      </div>

      {/* ── Navigator bottom sheet ──────────────────────────────────────────── */}
      {showNav && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowNav(false)}
            style={{position:'fixed', inset:0, zIndex:110, background:'rgba(0,0,0,0.45)'}}
          />

          {/* Sheet */}
          <div
            className="animate-slide-up"
            style={{
              position:'fixed', bottom:0, left:0, right:0, zIndex:120,
              background: C.card,
              borderRadius: '20px 20px 0 0',
              paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              maxHeight: '80dvh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{display:'flex', justifyContent:'center', padding:'12px 0 4px'}}>
              <div style={{width:36, height:4, borderRadius:2, background:C.border}} />
            </div>

            {/* Header row */}
            <div style={{padding:'8px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{fontSize:17, fontWeight:800, color:C.navy}}>All Questions</div>
              <div style={{fontSize:12, color:C.muted}}>
                <span style={{color:C.success, fontWeight:800}}>{answered}</span> answered · {questions.length - answered} left
              </div>
            </div>

            {/* Legend */}
            <div style={{display:'flex', gap:16, padding:'0 20px 14px', fontSize:11, color:C.muted, fontWeight:600}}>
              <span style={{display:'flex', alignItems:'center', gap:5}}>
                <span style={{width:12, height:12, borderRadius:3, background:C.primary, display:'inline-block'}} />
                Current
              </span>
              <span style={{display:'flex', alignItems:'center', gap:5}}>
                <span style={{width:12, height:12, borderRadius:3, background:C.success+'40', border:`1.5px solid ${C.success}`, display:'inline-block'}} />
                Answered
              </span>
              <span style={{display:'flex', alignItems:'center', gap:5}}>
                <span style={{width:12, height:12, borderRadius:3, background: dark ? '#1a1530' : '#F1F5F9', border:`1px solid ${C.border}`, display:'inline-block'}} />
                Unanswered
              </span>
            </div>

            {/* Number grid */}
            <div style={{display:'flex', flexWrap:'wrap', gap:8, padding:'0 20px 20px'}}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  style={{
                    width:44, height:44, borderRadius:10, border:'none', cursor:'pointer',
                    fontSize:13, fontWeight:800, fontFamily:'Inter,sans-serif',
                    background: i === qIndex
                      ? C.primary
                      : answers[i] !== null
                        ? C.success+'30'
                        : '#F1F5F9',
                    color: i === qIndex
                      ? 'white'
                      : answers[i] !== null
                        ? C.success
                        : C.muted,
                    outline: i === qIndex ? `2.5px solid ${C.primary}` : 'none',
                    outlineOffset: 2,
                  }}
                >{i + 1}</button>
              ))}
            </div>

            {/* Submit from sheet */}
            <div style={{padding:'0 20px 8px'}}>
              <button
                onClick={() => handleSubmit(false)}
                style={{width:'100%', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:14, padding:'14px', fontSize:14, fontWeight:800, cursor:'pointer'}}
              >
                Submit Paper 🎉 ({answered}/{questions.length})
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Exit confirmation modal ─────────────────────────────────────────── */}
      {showExit && (
        <div
          onClick={() => setShowExit(false)}
          style={{position:'fixed', inset:0, zIndex:150, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 24px'}}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{background:'white', borderRadius:20, padding:'28px 22px 24px', width:'100%', maxWidth:340, boxShadow:'0 24px 60px rgba(0,0,0,0.25)'}}
          >
            <div style={{fontSize:32, textAlign:'center', marginBottom:12}}>🚪</div>
            <div style={{fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8, textAlign:'center'}}>Exit mock exam?</div>
            <div style={{fontSize:14, color:'#64748B', marginBottom:24, lineHeight:1.6, textAlign:'center'}}>
              Your progress will be lost and the exam will not be submitted.
            </div>
            <div style={{display:'flex', gap:10}}>
              <button
                onClick={() => setShowExit(false)}
                style={{flex:1, background:'#F1F5F9', border:'none', borderRadius:14, padding:'14px', fontSize:14, fontWeight:700, color:'#64748B', cursor:'pointer'}}
              >Keep going</button>
              <button
                onClick={() => navigate(`/${stream}`)}
                style={{flex:1, background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none', borderRadius:14, padding:'14px', fontSize:14, fontWeight:800, color:'white', cursor:'pointer'}}
              >Exit exam</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
