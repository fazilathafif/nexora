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
import { getColors, Shell, Badge }     from './HomePage.jsx'
import { getRandomBreak }              from '../data/breaks.js'
import { NAV_HEIGHT }                  from '../styles/tokens.js'
import { useBreakpoint }               from '../hooks/useBreakpoint.js'
import { saveNote, getNotes, NOTES_MAX } from '../lib/notes.js'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} style={{
      background: copied ? '#DCFCE720' : 'transparent',
      border: `1px solid ${copied ? '#16A34A40' : '#6366F140'}`,
      borderRadius: 8, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
      color: copied ? '#16A34A' : '#6366F1',
      cursor: 'pointer', transition: 'all 0.2s',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function SaveNoteButton({ onSave, saved, notesCount }) {
  if (saved) return (
    <span style={{fontSize:11, fontWeight:700, color:'#10B981', letterSpacing:'-0.01em'}}>✓ Saved</span>
  )
  if (notesCount >= NOTES_MAX) return (
    <span style={{fontSize:11, fontWeight:600, color:'#94A3B8'}}>Notes full</span>
  )
  return (
    <button onClick={onSave} style={{
      background:'transparent', border:'1px solid #7C3AED40',
      borderRadius:8, padding:'3px 10px',
      fontSize:11, fontWeight:700, color:'#7C3AED',
      cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s',
    }}>
      ✦ Save
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
  const { isDesktop }       = useBreakpoint()

  // Computed once on mount — never re-sorted during the session.
  // sortByDue reads localStorage; scheduleReview writes it. If questions were
  // recomputed on every render, a correct answer would cause the array to
  // re-sort mid-quiz and questions[qIndex] would silently change to a different
  // question while chosen still held the previous answer's value.
  const [questions] = useState(() => {
    const allQs = getQuestions(stream, subject, topicFilter)
    return reviewMode
      ? allQs.filter(q => getDueIds(allQs).includes(q.id))
      : sortByDue(allQs)
  })
  const { startQuizSession, submitAnswer, finishQuizSession } = useProgress(user, profile, refreshProfile)

  const [qIndex,      setQIndex]      = useState(0)
  const [chosen,      setChosen]      = useState(null)   // null=unanswered | -1=timed out | ≥0=option index
  const [inputBlocked, setInputBlocked] = useState(false) // blocks ghost taps during question transition
  const [score,       setScore]       = useState(0)
  const [answers,     setAnswers]     = useState([])
  const [hintShown,   setHintShown]   = useState(false)
  const [started,     setStarted]     = useState(false)
  const [aiText,        setAiText]        = useState(null)   // null | 'loading' | string
  const [aiOpen,        setAiOpen]        = useState(false)
  const [aiElaboration, setAiElaboration] = useState(null)   // null | 'loading' | string
  const [aiNoteSaved,   setAiNoteSaved]   = useState(false)
  const aiPanelRef                        = useRef(null)
  const [breakCard,     setBreakCard]     = useState(null)  // null | { type, emoji, text, nextIndex }

  // Synchronous ghost-tap blocker: a full-screen transparent overlay that's activated
  // via direct DOM mutation (no React render cycle) the moment the user taps Next/Continue.
  // The overlay sits above all quiz content and absorbs any OS-synthesised clicks that
  // fire at the same screen coordinates after an element disappears.
  const overlayRef   = useRef(null)
  const overlayTimer = useRef(null)
  function activateBlock() {
    if (!overlayRef.current) return
    overlayRef.current.style.display = 'block'
    clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => {
      if (overlayRef.current) overlayRef.current.style.display = 'none'
    }, 800)
  }

  // Stable refs so timer callback never captures stale values
  const chosenRef    = useRef(null)
  const hintRef      = useRef(false)
  const currentQRef  = useRef(questions[0])
  // Ghost-tap guard: record when we advance so handleAnswer ignores
  // any synthetic click that the OS fires on the new question's buttons
  const advancedAtRef = useRef(0)
  useEffect(() => { chosenRef.current   = chosen },           [chosen])
  useEffect(() => { hintRef.current     = hintShown },        [hintShown])
  useEffect(() => { currentQRef.current = questions[qIndex] }, [qIndex]) // eslint-disable-line

  // Reset AI panel when question changes
  useEffect(() => { setAiText(null); setAiOpen(false); setAiElaboration(null); setAiNoteSaved(false) }, [qIndex])

  // Synchronously clear answer state before the new question paints —
  // guards against any render frame where qIndex advanced but chosen didn't reset yet
  useLayoutEffect(() => {
    setChosen(null)
    setHintShown(false)
    // Block all pointer events on answer buttons for 600 ms so that OS-generated
    // ghost taps (synthetic click fired at the same screen coords after touchend)
    // cannot reach React's event system at all — CSS-level prevention.
    setInputBlocked(true)
    const t = setTimeout(() => setInputBlocked(false), 600)
    return () => clearTimeout(t)
  }, [qIndex])

  // Scroll AI panel into view once explanation is ready
  useEffect(() => {
    if (aiOpen && aiText && aiText !== 'loading' && aiPanelRef.current) {
      aiPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [aiOpen, aiText])

  // Keyboard navigation: 1-4 to answer, Enter/Space to advance
  useEffect(() => {
    function onKey(e) {
      if (breakCard) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return
      if (['1','2','3','4'].includes(e.key)) {
        const idx = Number(e.key) - 1
        if (idx < currentQRef.current?.opts?.length) {
          e.preventDefault()
          if (chosenRef.current === null && !inputBlocked) handleAnswer(idx)
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (chosenRef.current !== null) { e.preventDefault(); handleNext() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [breakCard, inputBlocked]) // eslint-disable-line

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
    // Drop any ghost tap that arrives within 400 ms of advancing to this question
    if (Date.now() - advancedAtRef.current < 400) return
    setChosen(idx)
    const correct = idx === currentQ.ans
    scheduleReview(currentQ.id, correct)
    const entry   = { q: currentQ, chosen: idx, correct, hintUsed: hintShown }
    setAnswers(prev => [...prev, entry])
    if (correct) setScore(s => s + 1)
    submitAnswer({ questionId: currentQ.id, topic: currentQ.topic, chosenIndex: idx, correctIndex: currentQ.ans, hintUsed: hintShown, stream })
  }

  async function handleNext() {
    activateBlock()                          // synchronous DOM block — fires before any state update
    advancedAtRef.current = Date.now()
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
    activateBlock()                          // synchronous DOM block
    advancedAtRef.current = Date.now()
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
  const notesCount  = getNotes().length

  function handleSaveNote() {
    const fullText = aiText + (aiElaboration && aiElaboration !== 'loading' && aiElaboration !== ''
      ? '\n\n---\n\n**Deeper Dive:**\n\n' + aiElaboration : '')
    const ok = saveNote({ subject, topic: currentQ.topic, question: currentQ.q, explanation: fullText, stream })
    if (ok) setAiNoteSaved(true)
  }

  function handleExit() {
    if (qIndex === 0 && chosen === null) { navigate(`/${stream}`); return }
    if (window.confirm('Exit quiz? Your progress in this session will be lost.')) {
      navigate(`/${stream}`)
    }
  }

  // ── Shared: progress row ───────────────────────────────────────────────────
  const progressRow = (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,color:C.muted,marginBottom:6}}>
        <button
          onClick={handleExit}
          style={{background:'transparent',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'6px 14px',fontSize:12,fontWeight:700,color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',boxShadow:'none'}}
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
  )

  // ── Shared: timer bar ──────────────────────────────────────────────────────
  const timerBar = timerSeconds > 0 ? (
    <div style={{marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:'0.05em'}}>⏱ TIME</span>
        <span style={{fontSize:13,fontWeight:800,color:timerColor,transition:'color 0.5s',fontVariantNumeric:'tabular-nums'}}>
          {chosen === -1 ? "Time's up!" : `${remaining}s`}
        </span>
      </div>
      <div style={{background:C.border,borderRadius:8,height:6}}>
        <div style={{
          width:`${timerPct}%`,
          background:timerColor,
          height:'100%',
          borderRadius:8,
          transition:'width 1s linear, background 0.5s',
        }} />
      </div>
    </div>
  ) : null

  // ── Shared: badges ─────────────────────────────────────────────────────────
  const badges = (
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      {(reviewMode || topicFilter) && (
        <Badge label={reviewMode ? 'Review Mode' : `Drilling: ${topicFilter}`} color={reviewMode ? '#F59E0B' : '#EF4444'} />
      )}
      <Badge label={currentQ.topic} color={C.primary} />
      <Badge label={`Difficulty ${'★'.repeat(currentQ.difficulty)}`} color={C.muted} />
    </div>
  )

  // ── Shared: question block (keyed by qIndex) ───────────────────────────────
  const questionBlock = (
    <div key={qIndex}>
      {/* Question */}
      <div style={{background:C.card,borderRadius:22,padding:'22px 20px',marginBottom:16,boxShadow:dark?'0 6px 28px rgba(0,0,0,0.40)':'0 6px 24px rgba(0,0,0,0.08)'}}>
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
          let bg = C.card, border = `1.5px solid ${C.border}50`, col = C.navy, shadow = 'none'
          if (chosen !== null) {
            if (i === currentQ.ans)                              { bg = C.success+'22'; border = `2px solid ${C.success}`; col = dark?'#4ADE80':'#166534'; shadow = `0 0 0 3px ${C.success}18` }
            else if (chosen >= 0 && i === chosen && i !== currentQ.ans) { bg = '#EF444422'; border = '2px solid #EF4444'; col = dark?'#F87171':'#991B1B'; shadow = '0 0 0 3px #EF444418' }
          }
          return (
            <button
              key={i} onClick={() => handleAnswer(i)}
              disabled={chosen !== null}
              style={{background:bg,border,borderRadius:16,padding:'14px 16px',minHeight:56,textAlign:'left',cursor:chosen!==null?'default':'pointer',fontSize:14,fontWeight:600,color:col,touchAction:'manipulation',pointerEvents:inputBlocked?'none':'auto',WebkitTapHighlightColor:'transparent',outline:'none',boxShadow:shadow,transition:'box-shadow 0.2s'}}
            >
              <span style={{fontWeight:900,marginRight:10,opacity:0.4,fontSize:12}}>{['A','B','C','D'][i]}</span>
              {isDesktop && chosen === null && <span style={{float:'right',fontSize:10,fontWeight:700,opacity:0.3,letterSpacing:'0.05em'}}>{i+1}</span>}
              {opt}
              {chosen !== null && i === currentQ.ans && <span style={{float:'right'}}>✓</span>}
              {chosen !== null && chosen >= 0 && i === chosen && i !== currentQ.ans && <span style={{float:'right'}}>✗</span>}
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Shared: AI explanation content ────────────────────────────────────────
  const aiExplainContent = (
    <>
      {(aiText === 'loading' || aiText === '') && (
        <div style={{padding:'24px 16px',textAlign:'center'}}>
          <div style={{display:'inline-block',width:20,height:20,border:`2px solid ${dark?'#C4B5FD':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
        </div>
      )}
      {aiText !== null && aiText !== 'loading' && aiText !== '' && (
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14}}>🤖</span>
              <span style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:'0.1em'}}>AI TUTOR</span>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <SaveNoteButton onSave={handleSaveNote} saved={aiNoteSaved} notesCount={notesCount} />
              <CopyButton text={aiText} />
              <button onClick={() => setAiOpen(false)} style={{background:'none',border:'none',fontSize:18,color:C.muted,cursor:'pointer',padding:'0 2px'}}>✕</button>
            </div>
          </div>
          <div>
            <style>{`
              .ai-md h1{font-size:15px;font-weight:900;margin:0 0 6px;color:#1E293B}
              .ai-md h2{font-size:13px;font-weight:800;margin:14px 0 4px;color:#7C3AED}
              .ai-md h3{font-size:12px;font-weight:700;margin:10px 0 3px;color:#A855F7}
              .ai-md p{margin:0 0 10px}
              .ai-md ul,.ai-md ol{margin:4px 0 10px;padding-left:20px}
              .ai-md li{margin-bottom:4px}
              .ai-md strong{font-weight:800}
              .ai-md code{background:#F3E8FF;padding:1px 5px;border-radius:4px;font-size:12px}
            `}</style>
            <div className="ai-md" style={{fontSize:13,color:C.navy,lineHeight:1.85}}><ReactMarkdown>{aiText}</ReactMarkdown></div>
          </div>
          {aiElaboration === null && (
            <button onClick={handleElaborate} style={{
              marginTop:12, width:'100%', background:'transparent',
              border:`1px dashed #7C3AED50`,
              borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700,
              color: '#7C3AED', cursor:'pointer',
            }}>
              🔍 Go deeper
            </button>
          )}
          {(aiElaboration === 'loading' || aiElaboration === '') && (
            <div style={{marginTop:10,textAlign:'center',padding:'10px 0'}}>
              <div style={{display:'inline-block',width:16,height:16,border:`2px solid ${dark?'#A78BFA':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
            </div>
          )}
          {aiElaboration && aiElaboration !== 'loading' && aiElaboration !== '' && (
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid #7C3AED25`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:'0.1em'}}>🔍 DEEPER DIVE</span>
                <CopyButton text={aiElaboration} />
              </div>
              <div className="ai-md"><ReactMarkdown>{aiElaboration}</ReactMarkdown></div>
            </div>
          )}
        </div>
      )}
    </>
  )

  // ── Desktop right column: question + AI inline + next ────────────────────
  const desktopRightColumn = (
    <div>
      {questionBlock}

      {/* AI explanation trigger */}
      {chosen !== null && (
        <div style={{marginBottom:12}}>
          <button
            onClick={handleAiExplain}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background: aiOpen ? '#F5F3FF' : 'transparent',
              border:`1.5px solid #7C3AED40`,
              borderRadius:12, padding:'10px 14px', fontSize:13, fontWeight:700,
              color: '#7C3AED', cursor:'pointer', transition:'all 0.2s',
            }}
          >
            <span style={{fontSize:16}}>✨</span>
            {aiText === 'loading' ? 'Thinking…' : aiOpen ? 'Hide Explanation' : 'Explain with AI'}
          </button>
        </div>
      )}

      {/* AI inline panel — desktop only */}
      {isDesktop && aiOpen && chosen !== null && (
        <div
          ref={aiPanelRef}
          style={{
            background:'#FAFAFA', border:'1.5px solid #7C3AED20',
            borderRadius:16, padding:'16px', marginBottom:12,
            boxShadow:'0 2px 16px rgba(124,58,237,0.08)',
          }}
        >
          {(aiText === 'loading' || aiText === '') && (
            <div style={{padding:'16px',textAlign:'center'}}>
              <div style={{display:'inline-block',width:20,height:20,border:`2px solid ${dark?'#C4B5FD':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
            </div>
          )}
          {aiText !== null && aiText !== 'loading' && aiText !== '' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:14}}>🤖</span>
                  <span style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:'0.1em'}}>AI TUTOR</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <SaveNoteButton onSave={handleSaveNote} saved={aiNoteSaved} notesCount={notesCount} />
                  <CopyButton text={aiText} />
                  <button onClick={() => setAiOpen(false)} style={{background:'none',border:'none',fontSize:16,color:C.muted,cursor:'pointer',padding:'0 2px'}}>✕</button>
                </div>
              </div>
              <div className="ai-md" style={{fontSize:13,color:C.navy,lineHeight:1.85}}><ReactMarkdown>{aiText}</ReactMarkdown></div>
              {aiElaboration === null && (
                <button onClick={handleElaborate} style={{
                  marginTop:12, width:'100%', background:'transparent',
                  border:`1px dashed #7C3AED50`,
                  borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700,
                  color: '#7C3AED', cursor:'pointer',
                }}>
                  🔍 Go deeper
                </button>
              )}
              {(aiElaboration === 'loading' || aiElaboration === '') && (
                <div style={{marginTop:10,textAlign:'center',padding:'8px 0'}}>
                  <div style={{display:'inline-block',width:16,height:16,border:`2px solid ${dark?'#A78BFA':'#6366F1'}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                </div>
              )}
              {aiElaboration && aiElaboration !== 'loading' && aiElaboration !== '' && (
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid #7C3AED25`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:'0.1em'}}>🔍 DEEPER DIVE</span>
                    <CopyButton text={aiElaboration} />
                  </div>
                  <div className="ai-md"><ReactMarkdown>{aiElaboration}</ReactMarkdown></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      {chosen !== null && (
        <button
          onClick={handleNext}
          style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,color:'white',border:'none',borderRadius:16,padding:'15px',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`,touchAction:'manipulation'}}
        >
          {qIndex + 1 < total ? 'Next →' : 'See Results 🎉'}
        </button>
      )}
    </div>
  )

  return (
    <Shell C={C} contentMax={isDesktop ? 1100 : undefined}>

      {isDesktop ? (
        /* ─────────── DESKTOP: 2-column layout ─────────── */
        <>
          {progressRow}
          {timerBar}

          {currentQ.passage ? (
            /* Passage present: sticky left + question right */
            <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:28, alignItems:'start'}}>

              {/* LEFT — sticky passage + badges */}
              <div style={{position:'sticky', top:24}}>
                {badges}
                <div style={{fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', marginBottom:10}}>
                  PASSAGE — READ CAREFULLY
                </div>
                <div style={{
                  background:C.card,
                  border:`1px solid ${C.border}30`,
                  borderRadius:16, padding:'18px 20px',
                  fontSize:13, color:C.muted, lineHeight:1.85,
                  maxHeight:'calc(100dvh - 220px)', overflowY:'auto',
                  boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.06)',
                }}>
                  {currentQ.passage}
                </div>
              </div>

              {/* RIGHT — question + hint + options + AI inline + next */}
              {desktopRightColumn}
            </div>
          ) : (
            /* No passage: single centered column */
            <div style={{maxWidth:640, margin:'0 auto'}}>
              {badges}
              {desktopRightColumn}
            </div>
          )}
        </>

      ) : (
        /* ─────────── MOBILE: original single-column layout ─────────── */
        <>
          {progressRow}
          {timerBar}

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
            <div style={{background:C.card,border:`1px solid ${C.border}30`,borderRadius:16,padding:'14px 16px',marginBottom:12,maxHeight:190,overflowY:'auto',fontSize:13,color:C.muted,lineHeight:1.75,boxShadow:dark?'0 4px 16px rgba(0,0,0,0.3)':'0 4px 12px rgba(0,0,0,0.06)'}}>
              <p style={{margin:'0 0 8px',fontWeight:700,color:C.primary,fontSize:10,letterSpacing:'0.12em'}}>PASSAGE — READ CAREFULLY</p>
              <p style={{margin:0}}>{currentQ.passage}</p>
            </div>
          )}

          {/* Question + hint + options — keyed by qIndex so the whole block remounts on every
              question advance, wiping all DOM state (focus, inline styles) from the previous question */}
          <div key={qIndex}>

          {/* Question */}
          <div style={{background:C.card,borderRadius:22,padding:'22px 20px',marginBottom:16,boxShadow:dark?'0 6px 28px rgba(0,0,0,0.40)':'0 6px 24px rgba(0,0,0,0.08)'}}>
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
              let bg = C.card, border = `1.5px solid ${C.border}50`, col = C.navy, shadow = 'none'
              if (chosen !== null) {
                if (i === currentQ.ans)                              { bg = C.success+'22'; border = `2px solid ${C.success}`; col = dark?'#4ADE80':'#166534'; shadow = `0 0 0 3px ${C.success}18` }
                else if (chosen >= 0 && i === chosen && i !== currentQ.ans) { bg = '#EF444422'; border = '2px solid #EF4444'; col = dark?'#F87171':'#991B1B'; shadow = '0 0 0 3px #EF444418' }
              }
              return (
                <button
                  key={i} onClick={() => handleAnswer(i)}
                  disabled={chosen !== null}
                  style={{background:bg,border,borderRadius:16,padding:'14px 16px',minHeight:56,textAlign:'left',cursor:chosen!==null?'default':'pointer',fontSize:14,fontWeight:600,color:col,touchAction:'manipulation',pointerEvents:inputBlocked?'none':'auto',WebkitTapHighlightColor:'transparent',outline:'none',boxShadow:shadow,transition:'box-shadow 0.2s'}}
                >
                  <span style={{fontWeight:900,marginRight:10,opacity:0.4,fontSize:12}}>{['A','B','C','D'][i]}</span>
                  {isDesktop && chosen === null && <span style={{float:'right',fontSize:10,fontWeight:700,opacity:0.3,letterSpacing:'0.05em'}}>{i+1}</span>}
                  {opt}
                  {chosen !== null && i === currentQ.ans && <span style={{float:'right'}}>✓</span>}
                  {chosen !== null && chosen >= 0 && i === chosen && i !== currentQ.ans && <span style={{float:'right'}}>✗</span>}
                </button>
              )
            })}
          </div>

          </div>{/* end keyed question block */}

          {/* Post-answer AI explanation trigger */}
          {chosen !== null && (
            <div style={{marginBottom:12}}>
              <button
                onClick={handleAiExplain}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  background: aiOpen ? '#F5F3FF' : 'transparent',
                  border:`1.5px solid #7C3AED40`,
                  borderRadius:12, padding:'10px 14px', fontSize:13, fontWeight:700,
                  color: '#7C3AED', cursor:'pointer', transition:'all 0.2s',
                }}
              >
                <span style={{fontSize:16}}>✨</span>
                {aiText === 'loading' ? 'Thinking…' : aiOpen ? 'Hide Explanation' : 'Explain with AI'}
              </button>
            </div>
          )}

          {/* AI Tutor bottom sheet — mobile only */}
          {aiOpen && chosen !== null && (
            <>
              <div onClick={() => setAiOpen(false)} style={{position:'fixed',inset:0,zIndex:155,background:'rgba(0,0,0,0.4)'}} />
              <div
                ref={aiPanelRef}
                className="animate-slide-up"
                style={{
                  position:'fixed', bottom:NAV_HEIGHT, left:0, right:0, zIndex:160,
                  background: '#FFFFFF',
                  borderRadius:'20px 20px 0 0',
                  maxHeight:'62dvh',
                  overflowY:'auto',
                  boxShadow:'0 -8px 32px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px'}}>
                  <div style={{width:36,height:4,borderRadius:2,background:C.border}} />
                </div>
                <div style={{padding:'4px 16px 24px'}}>
                  {aiExplainContent}
                </div>
              </div>
            </>
          )}

          {chosen !== null && (
            <button
              onClick={handleNext}
              style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,color:'white',border:'none',borderRadius:16,padding:'15px',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`,touchAction:'manipulation'}}
            >
              {qIndex + 1 < total ? 'Next →' : 'See Results 🎉'}
            </button>
          )}
        </>
      )}

      {/* Ghost-tap blocker: transparent full-screen overlay activated synchronously
          (direct DOM ref, no React render cycle) when the user advances to the next question.
          Sits above all quiz content (z:150) but below brain-break overlay (z:200).
          Absorbs any OS-synthesised clicks at stale coordinates for 800 ms. */}
      <div
        ref={overlayRef}
        style={{position:'fixed',inset:0,zIndex:150,display:'none'}}
        onClick={e=>{e.stopPropagation();e.preventDefault()}}
        onTouchStart={e=>e.stopPropagation()}
        onTouchEnd={e=>{e.stopPropagation();e.preventDefault()}}
      />

      {/* Brain Break overlay */}
      {breakCard && (
        <div style={{
          position:'fixed', inset:0, zIndex:200,
          background: 'rgba(255,255,255,0.97)',
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
