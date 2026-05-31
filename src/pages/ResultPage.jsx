/**
 * ResultPage — shows score, per-answer breakdown, and AI explanation modal.
 * Receives state from QuizPage via React Router state.
 */

import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { fetchExplanation } from '../lib/ai.js'
import { getColors, Shell } from './HomePage.jsx'
import { getIGCSEGrade } from '../lib/igcseGrades.js'
import { useIGCSEScheme } from '../components/IGCSEGradeToggle.jsx'

export default function ResultPage({ user, profile, isDark }) {
  const { stream }  = useParams()
  const navigate    = useNavigate()
  const { state }   = useLocation()
  const subject     = state?.subject
  const C           = getColors(stream, subject, isDark)
  const dark        = isDark

  const { answers = [], score = 0, total = 1, xpEarned = 0 } = state ?? {}

  const [igcseScheme] = useIGCSEScheme()

  const [explaining, setExplaining]   = useState(null)   // answer entry being explained
  const [explanation, setExplanation] = useState('')
  const [aiLoading, setAiLoading]     = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [challengeCopied, setChallengeCopied] = useState(false)

  const pct = Math.round((score / total) * 100)
  const igcseGrade = stream === 'igcse' ? getIGCSEGrade(Math.round((score / total) * 100), igcseScheme) : null
  const medal = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💡'
  const msg   = pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Well done!' : 'Keep going!'

  async function openExplain(entry) {
    setExplaining(entry)
    setExplanation('')
    setAiLoading(true)
    setModalOpen(true)
    const text = await fetchExplanation(entry.q, entry.chosen, stream)
    setExplanation(text)
    setAiLoading(false)
  }

  return (
    <Shell C={C} isDark={isDark}>
      {/* Hero */}
      <div style={{textAlign:'center',padding:'16px 0 20px'}}>
        <div style={{fontSize:52,marginBottom:8}}>{medal}</div>
        <div style={{fontSize:22,fontWeight:800,color:C.navy,letterSpacing:'-0.5px'}}>{msg}</div>
        <div style={{fontSize:14,color:C.muted,marginTop:4}}>
          {score}/{total} correct · <span style={{color:C.primary,fontWeight:700}}>+{xpEarned} XP</span>
        </div>
      </div>

      {/* Score ring */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:22}}>
        <ScoreRing pct={pct} color={pct>=60 ? C.primary : '#F97316'} size={120} />
      </div>

      {/* IGCSE grade badge */}
      {igcseGrade && (
        <div style={{display:'flex',justifyContent:'center',marginBottom:22}}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#0D948815', border: '1.5px solid #0D948840',
            borderRadius: 12, padding: '6px 16px', marginTop: 8,
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0D9488' }}>{igcseGrade}</span>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
              {igcseScheme === 'A*-G' ? 'IGCSE Grade' : 'IGCSE Grade (9-1)'}
            </span>
          </div>
        </div>
      )}

      {/* Answer breakdown */}
      <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Review</div>
      <div style={{display:'grid',gap:10,marginBottom:20}}>
        {answers.map((a, i) => (
          <div key={i} style={{
            background: a.correct ? C.successBg : C.errorBg,
            border: a.correct ? `1.5px solid ${C.success}30` : `1.5px solid ${C.error}30`,
            borderLeft: a.correct ? `4px solid ${C.success}` : `4px solid ${C.error}`,
            borderRadius:8, padding:'14px 16px',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:a.correct?C.success:'#EF4444'}}>
                {a.correct ? '✓ Correct' : '✗ Wrong'}
              </div>
              <div style={{fontSize:12,color:C.navy,marginTop:2,fontWeight:600}}>{a.q.topic}</div>
              {!a.correct && (
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>→ {a.q.opts[a.q.ans]}</div>
              )}
            </div>
            {!a.correct && (
              <button
                onClick={() => openExplain(a)}
                style={{background:C.primary,color:'white',border:'none',borderRadius:10,padding:'9px 16px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}
              >
                Ask AI 🤖
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Challenge a Friend */}
      {subject && (
        <div style={{
          background: `${C.primary}10`, border: `1.5px solid ${C.primary}30`,
          borderRadius: 16, padding: '16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>Challenge a Friend</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Beat your score of {score}/{total}!
            </div>
          </div>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/${stream}/quiz/${subject}?challenge=1&target=${score}`
              if (navigator.share) {
                try { await navigator.share({ title: 'Beat my Nexora score!', url }) } catch {}
              } else {
                await navigator.clipboard.writeText(url)
                setChallengeCopied(true)
                setTimeout(() => setChallengeCopied(false), 2000)
              }
            }}
            style={{
              background: challengeCopied ? '#DCFCE7' : `linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,
              color: challengeCopied ? '#16A34A' : 'white',
              border: challengeCopied ? '1.5px solid #16A34A40' : 'none',
              borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter,sans-serif',
            }}
          >
            {challengeCopied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      <button
        onClick={() => navigate(`/${stream}`)}
        style={{width:'100%',background:C.primary,color:'white',border:'none',borderRadius:8,padding:'15px',height:52,fontSize:15,fontWeight:700,cursor:'pointer'}}
      >
        Choose Another Subject 🎯
      </button>

      {/* AI Modal */}
      {modalOpen && explaining && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}} onClick={() => setModalOpen(false)}>
          <div style={{background:'white',borderRadius:'24px 24px 0 0',padding:'28px 22px 40px',width:'100%',maxWidth:430,maxHeight:'75vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:'0 auto 20px'}} />

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:900,color:C.navy}}>AI Explanation</div>
              <button onClick={() => setModalOpen(false)} style={{background:'none',border:'none',fontSize:20,color:C.muted,cursor:'pointer'}}>✕</button>
            </div>

            {/* Q + answers */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:'14px',marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Question · {explaining.q.topic}</div>
              <p style={{fontSize:13,fontWeight:600,color:C.navy,margin:0,lineHeight:1.6}}>{explaining.q.q}</p>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              <div style={{background:'#EF4444'+'18',border:'1.5px solid #EF444440',borderRadius:12,padding:'10px'}}>
                <div style={{fontSize:10,color:'#EF4444',fontWeight:800,textTransform:'uppercase',marginBottom:4}}>Your Answer</div>
                <div style={{fontSize:13,fontWeight:700,color:dark?'#F87171':'#991B1B'}}>{explaining.q.opts[explaining.chosen]}</div>
              </div>
              <div style={{background:C.success+'18',border:`1.5px solid ${C.success}40`,borderRadius:12,padding:'10px'}}>
                <div style={{fontSize:10,color:C.success,fontWeight:800,textTransform:'uppercase',marginBottom:4}}>Correct</div>
                <div style={{fontSize:13,fontWeight:700,color:dark?'#4ADE80':'#166534'}}>{explaining.q.opts[explaining.q.ans]}</div>
              </div>
            </div>

            {/* AI response */}
            <div style={{background:'linear-gradient(135deg,#7C3AED,#EC4899)',borderRadius:16,padding:'18px',color:'white'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🤖</div>
                <span style={{fontWeight:800,fontSize:14}}>Nexora AI Tutor</span>
              </div>
              {aiLoading ? (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,opacity:0.6}}>Thinking</span>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'white',opacity:0.6,animation:'pulse 1s infinite',animationDelay:`${i*0.2}s`}} />
                  ))}
                </div>
              ) : (
                <p style={{margin:0,lineHeight:1.75,fontSize:14,opacity:0.95}}>{explanation}</p>
              )}
            </div>

            <div style={{marginTop:12,padding:'10px 12px',background:C.primary+'18',border:`1px solid ${C.primary}30`,borderRadius:10,fontSize:12,color:dark?'#A5B4FC':C.primary,fontWeight:600}}>
              💡 Hint: {explaining.q.hint}
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

function ScoreRing({ pct, color, size=120 }) {
  const stroke=10, r=(size-stroke)/2
  const circ = 2 * Math.PI * r
  return (
    <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',filter:`drop-shadow(0 4px 16px ${color}50)`}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ}
          strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 0.8s ease'}}/>
      </svg>
      <div style={{position:'absolute',textAlign:'center'}}>
        <div style={{fontSize:26,fontWeight:900,color}}>{pct}%</div>
      </div>
    </div>
  )
}
