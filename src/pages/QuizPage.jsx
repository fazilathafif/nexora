/**
 * QuizPage — renders questions one by one, records each answer to Supabase,
 * then navigates to ResultPage with session state via router state.
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getQuestions, TIMER_CONFIG }  from '../data/questions.js'
import { useProgress }                 from '../hooks/useProgress.js'
import { useTimer }                    from '../hooks/useTimer.js'
import { scheduleReview, sortByDue, getDueIds } from '../lib/srs.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { getColors, Shell, Badge }     from './HomePage.jsx'
import { getRandomBreak }              from '../data/breaks.js'

function CopyButton({ text, dark }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} style={{
      background: copied ? (dark?'#4ADE8020':'#DCFCE720') : 'transparent',
      border: `1px solid ${dark?'#4ADE8040':'#6366F140'}`,
      borderRadius: 8, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
      color: copied ? (dark?'#4ADE80':'#16A34A') : (dark?'#C4B5FD':'#6366F1'),
      cursor: 'pointer', transition: 'all 0.2s',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function QuizPage({ user, profile, refreshProfile }) {
  const { stream, subject } = useParams()
  const [searchParams]      = useSearchParams()
  const reviewMode          = searchParams.get('review') === '1'
  const topicFilter         = searchParams.get('topic') ?? null
  const navigate            = useNavigate()
  const C                   = getColors(stream, subject)
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
  const [aiText,        setAiText]        = useState(null)   // null | 'loading' | string
  const [aiOpen,        setAiOpen]        = useState(false)
  const [aiElaboration, setAiElaboration] = useState(null)   // null | 'loading' | string
  const aiPanelRef                        = useRef(null)
  const [breakCard,     setBreakCard]     = useState(null)  // null | { type, emoji, text, nextIndex }

  // Stable refs so timer callback never captures stale values
  const chosenRef   = useRef(null)
  const hintRef     = useRef(false)
  const currentQRef = useRef(questions[0])
  useEffect(() => { chosenRef.current   = chosen },           [chosen])
  useEffect(() => { hintRef.current     = hintShown },        [hintShown])
  useEffect(() => { currentQRef.current = questions[qIndex] }, [qIndex]) // eslint-disable-line

  // Reset AI panel when question changes
  useEffect(() => { setAiText(null); setAiOpen(false); setAiElaboration(null) }, [qIndex])

  // Synchronously clear answer state before the new question paints —
  // guards against any render frame where qIndex advanced but chosen didn't reset yet
  useLayoutEffect(() => {
    setChosen(null)
    setHintShown(false)
  }, [qIndex])

  // Scroll AI panel into view once explanation is ready
  useEffect(() => {
    if (aiOpen && aiText && aiText !== 'loading' && aiPanelRef.current) {
      aiPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [aiOpen, aiText])

  // Auto-dismiss brain break after 3.5s
  useEffect(() => {
    if (!breakCard) return
    const saved = breakCard
    const t = setTimeout(() => dismissBreak(saved), 3500)
    return () => clearTimeout(t)
  }, [breakCard]) // eslint-disable-line

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
      const nextIndex = qIndex + 1
      if (nextIndex % 5 === 0) {
        setChosen(null)
        setHintShown(false)
        setBreakCard({ ...getRandomBreak(), nextIndex })
      } else {
        setQIndex(nextIndex)
        setChosen(null)
        setHintShown(false)
      }
    } else {
      const xpEarned = await finishQuizSession(score, stream)
      navigate(`/${stream}/result`, {
        state: { answers, score, total, subject, xpEarned: xpEarned ?? score * (dark ? 15 : 10) },
      })
    }
  }

  function dismissBreak(card) {
    setBreakCard(null)
    setQIndex(card.nextIndex)
    setChosen(null)
    setHintShown(false)
  }

  async function handleAiExplain() {
    if (aiText && aiText !== 'loading') { setAiOpen(o => !o); return }
    setAiOpen(true)
    setAiText('loading')
    const fallback = 'Work through the hint step by step — the method will click with practice. 💪'
    const FN_URL = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain'
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3V2cmF4cXV4ZGpnZnhsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTQ1NzgsImV4cCI6MjA5NDY3MDU3OH0.v3f8GYT2_A7LfuKZZTeGMn2Lwy2A4AKucw6p7HyrYMg'
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(FN_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ question: currentQ, chosenIdx: chosen === -1 ? currentQ.ans : chosen, stream }),
      })
      clearTimeout(timer)
      if (!res.ok) { setAiText(fallback); return }

      // Stream text chunks — user sees text appear immediately
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      setAiText('')
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setAiText(accumulated)
      }
      if (!accumulated) setAiText(fallback)
    } catch {
      setAiText(fallback)
    }
  }

  async function handleElaborate() {
    if (aiElaboration && aiElaboration !== 'loading') return
    setAiElaboration('loading')
    const FN_URL   = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain'
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3V2cmF4cXV4ZGpnZnhsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTQ1NzgsImV4cCI6MjA5NDY3MDU3OH0.v3f8GYT2_A7LfuKZZTeGMn2Lwy2A4AKucw6p7HyrYMg'
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(FN_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ question: currentQ, chosenIdx: chosen === -1 ? currentQ.ans : chosen, stream, elaborate: true }),
      })
      clearTimeout(timer)
      if (!res.ok) { setAiElaboration(''); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      setAiElaboration('')
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setAiElaboration(accumulated)
      }
      if (!accumulated) setAiElaboration('')
    } catch {
      setAiElaboration('')
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

      {/* Question + hint + options — keyed so the whole block remounts on question change,
          clearing any browser focus, hover, or inline-style state from the previous question */}
      <div key={currentQ.id}>

      {/* Question */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:'22px 20px',marginBottom:16,minHeight:90}}>
        <p style={{fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.65,margin:0}}>{currentQ.q}</p>
      </div>

      {/* Hint */}
      {!hintShown ? (
        <button
          onClick={() => setHintShown(true)}
          disabled={chosen !== null}
          style={{width:'100%',background:'transparent',border:`1px dashed ${C.border}`,borderRadius:10,padding:'8px 14px',fontSize:12,color:C.muted,cursor:chosen!==null?'default':'pointer',marginBottom:12,opacity:chosen!==null?0.5:1,touchAction:'manipulation'}}
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
              style={{background:bg,border,borderRadius:14,padding:'14px 16px',textAlign:'left',cursor:chosen!==null?'default':'pointer',fontSize:14,fontWeight:600,color:col,transition:'all 0.2s',touchAction:'manipulation'}}
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

      </div>{/* end keyed question block */}

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

          {aiOpen && aiText !== null && aiText !== 'loading' && aiText !== '' && (
            <div ref={aiPanelRef} style={{
              marginTop:8, background:dark?'#181432':'#F8FAFF',
              border:`1px solid ${dark?'#7C3AED':'#6366F1'}30`,
              borderRadius:12, padding:'14px 16px',
              fontSize:13, color:C.navy, lineHeight:1.85,
              opacity:1, animation:'fadeIn 0.3s ease both',
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:14}}>🤖</span>
                  <span style={{fontSize:10,fontWeight:800,color:dark?'#C4B5FD':'#6366F1',letterSpacing:'0.1em'}}>AI TUTOR</span>
                </div>
                <CopyButton text={aiText} dark={dark} />
              </div>
              <div style={{
                '--md-h1': dark?'#E2E8F0':'#1E293B',
                '--md-h2': dark?'#C4B5FD':'#4F46E5',
                '--md-li': '0.4em',
              }}>
                <style>{`
                  .ai-md h1{font-size:15px;font-weight:900;margin:0 0 6px;color:${dark?'#E2E8F0':'#1E293B'}}
                  .ai-md h2{font-size:13px;font-weight:800;margin:14px 0 4px;color:${dark?'#C4B5FD':'#4F46E5'}}
                  .ai-md h3{font-size:12px;font-weight:700;margin:10px 0 3px;color:${dark?'#A78BFA':'#6366F1'}}
                  .ai-md p{margin:0 0 10px}
                  .ai-md ul,.ai-md ol{margin:4px 0 10px;padding-left:20px}
                  .ai-md li{margin-bottom:4px}
                  .ai-md strong{font-weight:800}
                  .ai-md code{background:${dark?'#2D1B69':'#EEF2FF'};padding:1px 5px;border-radius:4px;font-size:12px}
                `}</style>
                <ReactMarkdown className="ai-md">{aiText}</ReactMarkdown>
              </div>

              {/* Go deeper button — only shown once initial response is fully streamed */}
              {aiElaboration === null && (
                <button onClick={handleElaborate} style={{
                  marginTop:12, width:'100%', background:'transparent',
                  border:`1px dashed ${dark?'#7C3AED':'#6366F1'}50`,
                  borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700,
                  color: dark?'#A78BFA':'#6366F1', cursor:'pointer',
                }}>
                  🔍 Go deeper
                </button>
              )}

              {/* Elaboration loading spinner */}
              {aiElaboration === 'loading' || aiElaboration === '' ? (
                <div style={{marginTop:10,textAlign:'center',padding:'10px 0'}}>
                  <div style={{display:'inline-block',width:16,height:16,border:`2px solid ${dark?'#A78BFA':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                </div>
              ) : aiElaboration ? (
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${dark?'#7C3AED':'#6366F1'}25`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:10,fontWeight:800,color:dark?'#A78BFA':'#6366F1',letterSpacing:'0.1em'}}>🔍 DEEPER DIVE</span>
                    <CopyButton text={aiElaboration} dark={dark} />
                  </div>
                  <ReactMarkdown className="ai-md">{aiElaboration}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          )}
          {aiOpen && (aiText === 'loading' || aiText === '') && (
            <div style={{marginTop:8,background:dark?'#181432':'#F8FAFF',border:`1px solid ${dark?'#7C3AED':'#6366F1'}30`,borderRadius:12,padding:'16px',textAlign:'center'}}>
              <div style={{display:'inline-block',width:20,height:20,border:`2px solid ${dark?'#C4B5FD':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
            </div>
          )}
        </div>
      )}

      {chosen !== null && (
        <button
          onClick={handleNext}
          style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,color:'white',border:'none',borderRadius:16,padding:'15px',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`,touchAction:'manipulation'}}
        >
          {qIndex + 1 < total ? 'Next →' : 'See Results 🎉'}
        </button>
      )}

      {/* Brain Break overlay */}
      {breakCard && (
        <div style={{
          position:'fixed', inset:0, zIndex:200,
          background: dark ? 'rgba(10,8,20,0.97)' : 'rgba(248,250,252,0.97)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'32px 24px',
        }}>
          <style>{`
            @keyframes countdownShrink { from{width:100%} to{width:0%} }
            @keyframes breakFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          `}</style>
          <div style={{maxWidth:320,width:'100%',textAlign:'center',animation:'breakFadeIn 0.4s ease'}}>
            <div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:'0.12em',marginBottom:16,textTransform:'uppercase'}}>
              {breakCard.type === 'health' ? '🌿 Health Tip' : breakCard.type === 'joke' ? '😄 Brain Break' : '⚡ Motivation'}
            </div>
            <div style={{fontSize:56,marginBottom:20}}>{breakCard.emoji}</div>
            <p style={{fontSize:16,fontWeight:600,color:C.navy,lineHeight:1.75,margin:'0 0 28px'}}>
              {breakCard.text}
            </p>
            <div style={{background:C.border,borderRadius:8,height:4,marginBottom:24,overflow:'hidden'}}>
              <div style={{
                height:'100%', background:C.primary, borderRadius:8,
                animation:'countdownShrink 3.5s linear forwards',
              }} />
            </div>
            <button
              onClick={() => dismissBreak(breakCard)}
              style={{
                background:C.primary, color:'white', border:'none', borderRadius:14,
                padding:'13px 32px', fontSize:14, fontWeight:800, cursor:'pointer',
                fontFamily:'Inter,sans-serif',
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}
