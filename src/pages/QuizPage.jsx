/**
 * QuizPage — renders questions one by one, records each answer to Supabase,
 * then navigates to ResultPage with session state via router state.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getQuestions, TIMER_CONFIG }  from '../data/questions.js'
import { useProgress }                 from '../hooks/useProgress.js'
import { useTimer }                    from '../hooks/useTimer.js'
import { scheduleReview, sortByDue, getDueIds } from '../lib/srs.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { getColors, Shell, Badge }     from './HomePage.jsx'

export default function QuizPage({ user, profile, refreshProfile }) {
  const { stream, subject } = useParams()
  const [searchParams]      = useSearchParams()
  const reviewMode          = searchParams.get('review') === '1'
  const topicFilter         = searchParams.get('topic') ?? null
  const navigate            = useNavigate()
  const C                   = getColors(stream)
  const dark                = stream === 'alevel'

  const allQs     = getQuestions(stream, subject, topicFilter)
  const questions = reviewMode
    ? allQs.filter(q => getDueIds(allQs).includes(q.id))
    : sortByDue(allQs)
  const { startQuizSession, submitAnswer, finishQuizSession } = useProgress(user, profile, refreshProfile)

  const [qIndex,      setQIndex]      = useState(0)
  const [chosen,      setChosen]      = useState(null)   // null=unanswered | -1=timed out | ≥0=option index
  const [score,       setScore]       = useState(0)
  const [answers,     setAnswers]     = useState([])
  const [hintShown,   setHintShown]   = useState(false)
  const [started,     setStarted]     = useState(false)
  const [aiText,      setAiText]      = useState(null)   // null | 'loading' | string
  const [aiOpen,      setAiOpen]      = useState(false)

  // Stable refs so timer callback never captures stale values
  const chosenRef   = useRef(null)
  const hintRef     = useRef(false)
  const currentQRef = useRef(questions[0])
  useEffect(() => { chosenRef.current   = chosen },           [chosen])
  useEffect(() => { hintRef.current     = hintShown },        [hintShown])
  useEffect(() => { currentQRef.current = questions[qIndex] }, [qIndex]) // eslint-disable-line

  // Reset AI panel when question changes
  useEffect(() => { setAiText(null); setAiOpen(false) }, [qIndex])

  const currentQ = questions[qIndex]
  const total    = questions.length

  // Timer: 0 = untimed (e.g. STEP)
  const timerSeconds = stream === 'gcse'
    ? TIMER_CONFIG.gcse
    : (TIMER_CONFIG.alevel?.[subject] ?? 0)

  const handleTimerExpire = useCallback(() => {
    if (chosenRef.current !== null) return   // already answered
    const q = currentQRef.current
    setAnswers(prev => [...prev, { q, chosen: -1, correct: false, hintUsed: hintRef.current }])
    scheduleReview(q.id, false)
    setChosen(-1)
    submitAnswer({ questionId: q.id, topic: q.topic, chosenIndex: -1, correctIndex: q.ans, hintUsed: hintRef.current, stream })
  }, [submitAnswer, stream]) // eslint-disable-line

  const { remaining, pct: timerPct, warning, danger } = useTimer(timerSeconds, handleTimerExpire, qIndex)

  // Start Supabase session once
  useEffect(() => {
    if (!started && questions.length > 0) {
      startQuizSession(stream, subject, questions.length)
      setStarted(true)
    }
  }, []) // eslint-disable-line

  if (!questions.length) {
    return (
      <Shell C={C}>
        <p style={{color:C.muted,textAlign:'center',marginTop:60}}>
          {reviewMode ? 'No questions due for review right now — great work!' : 'No questions found for this subject.'}
        </p>
        <button onClick={() => navigate(`/${stream}`)} style={{marginTop:20,color:C.primary,background:'none',border:'none',cursor:'pointer',fontWeight:700}}>← Go back</button>
      </Shell>
    )
  }

  async function handleAnswer(idx) {
    if (chosen !== null) return
    setChosen(idx)
    const correct = idx === currentQ.ans
    scheduleReview(currentQ.id, correct)
    const entry   = { q: currentQ, chosen: idx, correct, hintUsed: hintShown }
    setAnswers(prev => [...prev, entry])
    if (correct) setScore(s => s + 1)
    submitAnswer({ questionId: currentQ.id, topic: currentQ.topic, chosenIndex: idx, correctIndex: currentQ.ans, hintUsed: hintShown, stream })
  }

  async function handleNext() {
    if (qIndex + 1 < total) {
      setQIndex(q => q + 1)
      setChosen(null)
      setHintShown(false)
    } else {
      const xpEarned = await finishQuizSession(score, stream)
      navigate(`/${stream}/result`, {
        state: { answers, score, total, subject, xpEarned: xpEarned ?? score * (dark ? 15 : 10) },
      })
    }
  }

  async function handleAiExplain() {
    if (aiText && aiText !== 'loading') { setAiOpen(o => !o); return }
    setAiOpen(true)
    setAiText('loading')
    const fallback = 'Work through the hint step by step — the method will click with practice. 💪'
    try {
      const chosenIdx = chosen === -1 ? currentQ.ans : chosen
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const request = supabase.functions.invoke('explain', {
        body: { question: currentQ, chosenIdx, stream },
      })
      const { data, error } = await Promise.race([request, timeout])
      setAiText(error ? fallback : (data?.explanation ?? fallback))
    } catch {
      setAiText(fallback)
    }
  }

  const progressPct = (qIndex / total) * 100
  const timerColor  = danger ? '#EF4444' : warning ? '#F59E0B' : C.primary

  function handleExit() {
    if (qIndex === 0 && chosen === null) { navigate(`/${stream}`); return }
    if (window.confirm('Exit quiz? Your progress in this session will be lost.')) {
      navigate(`/${stream}`)
    }
  }

  return (
    <Shell C={C}>
      {/* Progress row */}
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,color:C.muted,marginBottom:6}}>
          <button
            onClick={handleExit}
            style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'4px 10px',fontSize:11,fontWeight:700,color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
          >
            ← Exit
          </button>
          <span style={{fontWeight:700}}>Q{qIndex + 1} / {total}</span>
          <span style={{color:C.primary,fontWeight:700}}>Score: {score}</span>
        </div>
        <div style={{background:C.border,borderRadius:8,height:5}}>
          <div style={{width:`${progressPct}%`,background:`linear-gradient(90deg,${C.primary},${C.secondary ?? C.primary})`,height:'100%',borderRadius:8,transition:'width 0.4s ease'}} />
        </div>
      </div>

      {/* Countdown timer bar (hidden for untimed exams like STEP) */}
      {timerSeconds > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <span style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:'0.05em'}}>⏱ TIME</span>
            <span style={{fontSize:13,fontWeight:800,color:timerColor,transition:'color 0.5s',fontVariantNumeric:'tabular-nums'}}>
              {chosen === -1 ? "Time's up!" : `${remaining}s`}
            </span>
          </div>
          <div style={{background:C.border,borderRadius:8,height:4}}>
            <div style={{
              width:`${timerPct}%`,
              background:timerColor,
              height:'100%',
              borderRadius:8,
              transition:'width 1s linear, background 0.5s',
            }} />
          </div>
        </div>
      )}

      {/* Badges */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {(reviewMode || topicFilter) && (
          <Badge label={reviewMode ? 'Review Mode' : `Drilling: ${topicFilter}`} color={reviewMode ? '#F59E0B' : '#EF4444'} />
        )}
        <Badge label={currentQ.topic} color={C.primary} />
        <Badge label={`Difficulty ${'★'.repeat(currentQ.difficulty)}`} color={C.muted} />
      </div>

      {/* LNAT passage (shown when present) */}
      {currentQ.passage && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'14px 16px',marginBottom:12,maxHeight:190,overflowY:'auto',fontSize:13,color:C.muted,lineHeight:1.75}}>
          <p style={{margin:'0 0 8px',fontWeight:700,color:C.primary,fontSize:10,letterSpacing:'0.12em'}}>PASSAGE — READ CAREFULLY</p>
          <p style={{margin:0}}>{currentQ.passage}</p>
        </div>
      )}

      {/* Question */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:'22px 20px',marginBottom:16,minHeight:90}}>
        <p style={{fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.65,margin:0}}>{currentQ.q}</p>
      </div>

      {/* Hint */}
      {!hintShown ? (
        <button
          onClick={() => setHintShown(true)}
          disabled={chosen !== null}
          style={{width:'100%',background:'transparent',border:`1px dashed ${C.border}`,borderRadius:10,padding:'8px 14px',fontSize:12,color:C.muted,cursor:chosen!==null?'default':'pointer',marginBottom:12,opacity:chosen!==null?0.5:1}}
        >
          💡 Show hint (−2 XP)
        </button>
      ) : (
        <div style={{background:(dark?'#C4B5FD':'#FCD34D')+'25',border:`1px solid ${dark?'#C4B5FD':'#FCD34D'}60`,borderRadius:10,padding:'10px 14px',fontSize:13,color:dark?'#DDD6FE':'#92400E',marginBottom:12,fontWeight:600}}>
          💡 {currentQ.hint}
        </div>
      )}

      {/* Answer options */}
      <div style={{display:'grid',gap:9,marginBottom:16}}>
        {currentQ.opts.map((opt, i) => {
          let bg = C.card, border = `1.5px solid ${C.border}`, col = C.navy
          if (chosen !== null) {
            if (i === currentQ.ans)                              { bg = C.success+'20'; border = `2px solid ${C.success}`; col = dark?'#4ADE80':'#166534' }
            else if (chosen >= 0 && i === chosen && i !== currentQ.ans) { bg = '#EF4444'+'20'; border = '2px solid #EF4444'; col = dark?'#F87171':'#991B1B' }
          }
          return (
            <button
              key={i} onClick={() => handleAnswer(i)}
              disabled={chosen !== null}
              style={{background:bg,border,borderRadius:14,padding:'14px 16px',textAlign:'left',cursor:chosen!==null?'default':'pointer',fontSize:14,fontWeight:600,color:col,transition:'all 0.2s'}}
              onMouseEnter={e=>{ if(chosen===null) e.currentTarget.style.borderColor=C.primary }}
              onMouseLeave={e=>{ if(chosen===null) e.currentTarget.style.borderColor=C.border }}
            >
              <span style={{fontWeight:900,marginRight:10,opacity:0.4,fontSize:12}}>{['A','B','C','D'][i]}</span>
              {opt}
              {chosen !== null && i === currentQ.ans && <span style={{float:'right'}}>✓</span>}
              {chosen !== null && chosen >= 0 && i === chosen && i !== currentQ.ans && <span style={{float:'right'}}>✗</span>}
            </button>
          )
        })}
      </div>

      {/* Post-answer AI explanation */}
      {chosen !== null && isSupabaseConfigured && (
        <div style={{marginBottom:12}}>
          <button
            onClick={handleAiExplain}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background: aiOpen ? (dark?'#261E4E':'#EFF6FF') : 'transparent',
              border:`1.5px solid ${dark?'#7C3AED':'#6366F1'}40`,
              borderRadius:12, padding:'10px 14px', fontSize:13, fontWeight:700,
              color: dark?'#C4B5FD':'#4F46E5', cursor:'pointer', transition:'all 0.2s',
            }}
          >
            <span style={{fontSize:16}}>✨</span>
            {aiText === 'loading' ? 'Thinking…' : aiOpen ? 'Hide AI Explanation' : 'Explain with AI'}
          </button>

          {aiOpen && aiText && aiText !== 'loading' && (
            <div style={{
              marginTop:8, background:dark?'#181432':'#F8FAFF',
              border:`1px solid ${dark?'#7C3AED':'#6366F1'}30`,
              borderRadius:12, padding:'14px 16px',
              fontSize:13, color:C.navy, lineHeight:1.75,
              animation:'fadeIn 0.3s ease',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{fontSize:14}}>🤖</span>
                <span style={{fontSize:10,fontWeight:800,color:dark?'#C4B5FD':'#6366F1',letterSpacing:'0.1em'}}>AI TUTOR</span>
              </div>
              {aiText}
            </div>
          )}
          {aiOpen && aiText === 'loading' && (
            <div style={{marginTop:8,background:dark?'#181432':'#F8FAFF',border:`1px solid ${dark?'#7C3AED':'#6366F1'}30`,borderRadius:12,padding:'16px',textAlign:'center'}}>
              <div style={{display:'inline-block',width:20,height:20,border:`2px solid ${dark?'#C4B5FD':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
            </div>
          )}
        </div>
      )}

      {chosen !== null && (
        <button
          onClick={handleNext}
          style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,color:'white',border:'none',borderRadius:16,padding:'15px',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`}}
        >
          {qIndex + 1 < total ? 'Next →' : 'See Results 🎉'}
        </button>
      )}
    </Shell>
  )
}
