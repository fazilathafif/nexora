/**
 * QuizPage — renders questions one by one, records each answer to Supabase,
 * then navigates to ResultPage with session state via router state.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions }   from '../data/questions.js'
import { useProgress }    from '../hooks/useProgress.js'
import { getColors, Shell, Badge } from './HomePage.jsx'

export default function QuizPage({ user, profile, refreshProfile }) {
  const { stream, subject } = useParams()
  const navigate            = useNavigate()
  const C                   = getColors(stream)
  const dark                = stream === 'alevel'

  const questions = getQuestions(stream, subject)
  const { startQuizSession, submitAnswer, finishQuizSession } = useProgress(user, profile, refreshProfile)

  const [qIndex,    setQIndex]    = useState(0)
  const [chosen,    setChosen]    = useState(null)   // index chosen by student
  const [score,     setScore]     = useState(0)
  const [answers,   setAnswers]   = useState([])
  const [hintShown, setHintShown] = useState(false)
  const [started,   setStarted]   = useState(false)

  const currentQ = questions[qIndex]
  const total    = questions.length

  // Start Supabase session once
  useEffect(() => {
    if (!started && questions.length > 0) {
      startQuizSession(stream, subject, questions.length)
      setStarted(true)
    }
  }, [])  // eslint-disable-line

  if (!questions.length) {
    return (
      <Shell C={C}>
        <p style={{color:C.muted,textAlign:'center',marginTop:60}}>No questions found for this subject.</p>
        <button onClick={() => navigate(`/${stream}`)} style={{marginTop:20,color:C.primary,background:'none',border:'none',cursor:'pointer',fontWeight:700}}>← Go back</button>
      </Shell>
    )
  }

  async function handleAnswer(idx) {
    if (chosen !== null) return
    setChosen(idx)

    const correct = idx === currentQ.ans
    const entry   = { q: currentQ, chosen: idx, correct, hintUsed: hintShown }
    setAnswers(prev => [...prev, entry])
    if (correct) setScore(s => s + 1)

    // Non-blocking write to Supabase
    submitAnswer({
      questionId:   currentQ.id,
      topic:        currentQ.topic,
      chosenIndex:  idx,
      correctIndex: currentQ.ans,
      hintUsed:     hintShown,
      stream,
    })
  }

  async function handleNext() {
    if (qIndex + 1 < total) {
      setQIndex(q => q + 1)
      setChosen(null)
      setHintShown(false)
    } else {
      // Quiz done — finish session then go to result
      const xpEarned = await finishQuizSession(score + (chosen === currentQ.ans ? 0 : 0), stream)
      navigate(`/${stream}/result`, {
        state: { answers, score, total, subject, xpEarned: xpEarned ?? score * (dark ? 15 : 10) },
      })
    }
  }

  const pct = (qIndex / total) * 100

  return (
    <Shell C={C}>
      {/* Progress row */}
      <div style={{marginBottom:18}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,marginBottom:6}}>
          <span style={{fontWeight:700}}>Q{qIndex + 1} / {total}</span>
          <span style={{color:C.primary,fontWeight:700}}>Score: {score}</span>
        </div>
        <div style={{background:C.border,borderRadius:8,height:5}}>
          <div style={{width:`${pct}%`,background:`linear-gradient(90deg,${C.primary},${C.secondary ?? C.primary})`,height:'100%',borderRadius:8,transition:'width 0.4s ease'}} />
        </div>
      </div>

      {/* Badges */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        <Badge label={currentQ.topic} color={C.primary} />
        <Badge label={`Difficulty ${'★'.repeat(currentQ.difficulty)}`} color={C.muted} />
      </div>

      {/* Question */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:'22px 20px',marginBottom:16,minHeight:90}}>
        <p style={{fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.65,margin:0}}>{currentQ.q}</p>
      </div>

      {/* Hint */}
      {!hintShown ? (
        <button
          onClick={() => setHintShown(true)}
          style={{width:'100%',background:'transparent',border:`1px dashed ${C.border}`,borderRadius:10,padding:'8px 14px',fontSize:12,color:C.muted,cursor:'pointer',marginBottom:12}}
        >
          💡 Show hint (−2 XP)
        </button>
      ) : (
        <div style={{background:(dark?'#F0ABFC':'#FCD34D')+'25',border:`1px solid ${dark?'#F0ABFC':'#FCD34D'}60`,borderRadius:10,padding:'10px 14px',fontSize:13,color:dark?'#F0ABFC':'#92400E',marginBottom:12,fontWeight:600}}>
          💡 {currentQ.hint}
        </div>
      )}

      {/* Answer options */}
      <div style={{display:'grid',gap:9,marginBottom:16}}>
        {currentQ.opts.map((opt, i) => {
          let bg = C.card, border = `1.5px solid ${C.border}`, col = C.navy
          if (chosen !== null) {
            if (i === currentQ.ans)                    { bg = C.success+'20'; border = `2px solid ${C.success}`; col = dark?'#4ADE80':'#166534' }
            else if (i === chosen && i !== currentQ.ans) { bg = '#EF4444'+'20'; border = '2px solid #EF4444'; col = dark?'#F87171':'#991B1B' }
          }
          return (
            <button
              key={i} onClick={() => handleAnswer(i)}
              style={{background:bg,border,borderRadius:14,padding:'14px 16px',textAlign:'left',cursor:chosen!==null?'default':'pointer',fontSize:14,fontWeight:600,color:col,transition:'all 0.2s'}}
              onMouseEnter={e=>{ if(chosen===null) e.currentTarget.style.borderColor=C.primary }}
              onMouseLeave={e=>{ if(chosen===null) e.currentTarget.style.borderColor=C.border }}
            >
              <span style={{fontWeight:900,marginRight:10,opacity:0.4,fontSize:12}}>{['A','B','C','D'][i]}</span>
              {opt}
              {chosen !== null && i === currentQ.ans && <span style={{float:'right'}}>✓</span>}
              {chosen !== null && i === chosen && i !== currentQ.ans && <span style={{float:'right'}}>✗</span>}
            </button>
          )
        })}
      </div>

      {chosen !== null && (
        <button
          onClick={handleNext}
          style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#312E81':'#0F766E'})`,color:'white',border:'none',borderRadius:16,padding:'15px',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`}}
        >
          {qIndex + 1 < total ? 'Next →' : 'See Results 🎉'}
        </button>
      )}
    </Shell>
  )
}
