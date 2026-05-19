/**
 * MockPage — timed full-paper mock exam.
 * Shows all questions for the subject with a global countdown.
 * At time-up or finish, navigates to ResultPage with full breakdown.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions, MOCK_CONFIG } from '../data/questions.js'
import { useProgress }               from '../hooks/useProgress.js'
import { scheduleReview }            from '../lib/srs.js'
import { getColors, Shell, Badge, SectionLabel } from './HomePage.jsx'

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
  const C                    = getColors(stream)
  const dark                 = stream === 'alevel'

  const cfg = stream === 'gcse'
    ? MOCK_CONFIG.gcse
    : MOCK_CONFIG.alevel?.[subject]

  const questions = getQuestions(stream, subject)
  const { startQuizSession, submitAnswer, finishQuizSession } = useProgress(user, profile, refreshProfile)

  const [answers,     setAnswers]     = useState(() => Array(questions.length).fill(null))
  const [qIndex,      setQIndex]      = useState(0)
  const [remaining,   setRemaining]   = useState(cfg?.duration ?? 3600)
  const [started,     setStarted]     = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [submitted,   setSubmitted]   = useState(false)

  const intervalRef = useRef(null)
  const answersRef  = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  const timerColor = remaining < 300 ? '#EF4444' : remaining < 600 ? '#F59E0B' : C.primary
  const timerPct   = cfg ? (remaining / cfg.duration) * 100 : 100

  // Start session
  useEffect(() => {
    if (started || !questions.length) return
    startQuizSession(stream, subject, questions.length).then(() => setSessionReady(true))
    setStarted(true)
  }, []) // eslint-disable-line

  // Global countdown (only when session is ready and duration > 0)
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

  async function handleSubmit(fromTimer = false) {
    if (submitted) return
    setSubmitted(true)
    clearInterval(intervalRef.current)

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

  const currentQ  = questions[qIndex]
  const answered  = answers.filter(a => a !== null).length

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
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button
            onClick={() => {
              if (window.confirm('Exit mock exam? All answers will be lost.')) navigate(`/${stream}`)
            }}
            style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'4px 10px',fontSize:11,fontWeight:700,color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
          >
            ← Exit
          </button>
          <div>
            <div style={{fontWeight:900,color:C.navy,fontSize:15}}>{cfg.label}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{answered}/{questions.length} answered</div>
          </div>
        </div>
        {cfg.duration > 0 && (
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:900,color:timerColor,fontVariantNumeric:'tabular-nums'}}>
              {fmt(remaining)}
            </div>
            <div style={{fontSize:10,color:C.muted}}>remaining</div>
          </div>
        )}
      </div>

      {/* Timer bar */}
      {cfg.duration > 0 && (
        <div style={{background:C.border,borderRadius:6,height:4,marginBottom:16}}>
          <div style={{width:`${timerPct}%`,background:timerColor,height:'100%',borderRadius:6,transition:'width 1s linear, background 0.5s'}} />
        </div>
      )}

      {/* Question navigator */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:14}}>
        {questions.map((_, i) => (
          <button
            key={i} onClick={() => setQIndex(i)}
            style={{
              width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'Inter,sans-serif',
              background: i === qIndex ? C.primary : answers[i] !== null ? C.success+'40' : C.border,
              color: i === qIndex ? 'white' : answers[i] !== null ? C.success : C.muted,
            }}
          >{i+1}</button>
        ))}
      </div>

      {/* Badge */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <Badge label={`Q${qIndex+1} — ${currentQ.topic}`} color={C.primary} />
        <Badge label={`Difficulty ${'★'.repeat(currentQ.difficulty)}`} color={C.muted} />
      </div>

      {/* Passage */}
      {currentQ.passage && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'14px 16px',marginBottom:12,maxHeight:190,overflowY:'auto',fontSize:13,color:C.muted,lineHeight:1.75}}>
          <p style={{margin:'0 0 8px',fontWeight:700,color:C.primary,fontSize:10,letterSpacing:'0.12em'}}>PASSAGE — READ CAREFULLY</p>
          <p style={{margin:0}}>{currentQ.passage}</p>
        </div>
      )}

      {/* Question */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:'22px 20px',marginBottom:14,minHeight:80}}>
        <p style={{fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.65,margin:0}}>{currentQ.q}</p>
      </div>

      {/* Answer options */}
      <div style={{display:'grid',gap:9,marginBottom:18}}>
        {currentQ.opts.map((opt, i) => {
          const chosen = answers[qIndex]
          const selected = chosen === i
          return (
            <button
              key={i} onClick={() => chooseAnswer(i)}
              style={{
                background: selected ? C.primary+'25' : C.card,
                border: selected ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`,
                borderRadius:14, padding:'14px 16px', textAlign:'left', cursor:'pointer',
                fontSize:14, fontWeight:600, color:C.navy, transition:'all 0.2s',
              }}
              onMouseEnter={e=>{ if(!selected) e.currentTarget.style.borderColor=C.primary }}
              onMouseLeave={e=>{ if(!selected) e.currentTarget.style.borderColor=C.border }}
            >
              <span style={{fontWeight:900,marginRight:10,opacity:0.4,fontSize:12}}>{['A','B','C','D'][i]}</span>
              {opt}
              {selected && <span style={{float:'right',color:C.primary}}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Navigation + submit */}
      <div style={{display:'flex',gap:8}}>
        {qIndex > 0 && (
          <button onClick={() => setQIndex(q => q-1)} style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:'13px',fontSize:14,fontWeight:700,color:C.muted,cursor:'pointer'}}>
            ← Prev
          </button>
        )}
        {qIndex < questions.length - 1 ? (
          <button onClick={() => setQIndex(q => q+1)} style={{flex:2,background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,color:'white',border:'none',borderRadius:14,padding:'13px',fontSize:14,fontWeight:800,cursor:'pointer'}}>
            Next →
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            style={{flex:2,background:`linear-gradient(135deg,#10B981,#059669)`,color:'white',border:'none',borderRadius:14,padding:'13px',fontSize:14,fontWeight:800,cursor:'pointer'}}
          >
            Submit Paper 🎉 ({answered}/{questions.length})
          </button>
        )}
      </div>
    </Shell>
  )
}
