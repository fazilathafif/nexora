/**
 * StudyPlanPage — personalised learning plan based on topic accuracy + exam date.
 * Route: /:stream/plan
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams }       from 'react-router-dom'
import { getTopicStats }                from '../lib/db.js'
import { STREAM_CONFIG, getQuestions }  from '../data/questions.js'
import { getColors, Shell, SectionLabel, Badge } from './HomePage.jsx'
import { upsertProfile }                from '../lib/db.js'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
}

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

// Build a phased study schedule from today until exam
function buildSchedule(days, weakTopics, subjects) {
  if (!days || days <= 0) return []

  const phases = []

  if (days >= 21) {
    const drilling = Math.round(days * 0.6)
    const mixed    = Math.round(days * 0.3)
    const mock     = days - drilling - mixed
    phases.push({
      phase: 'Phase 1 — Targeted Drilling',
      duration: `${drilling} days`,
      icon: '🎯',
      color: '#EF4444',
      goal: 'Eliminate weak spots',
      description: 'Focus exclusively on your lowest-scoring topics. Short, intensive sessions of 15–20 questions.',
      subjects: weakTopics.slice(0,3).map(t => t.topic),
    })
    phases.push({
      phase: 'Phase 2 — Mixed Practice',
      duration: `${mixed} days`,
      icon: '🔄',
      color: '#F59E0B',
      goal: 'Build fluency across all topics',
      description: 'Rotate through all subjects. Aim for at least one session per subject per week.',
      subjects: subjects.map(s => s.label),
    })
    phases.push({
      phase: 'Phase 3 — Mock Exams',
      duration: `${mock} day${mock === 1 ? '' : 's'}`,
      icon: '📋',
      color: '#10B981',
      goal: 'Simulate exam conditions',
      description: 'Take full timed mock papers. Review every wrong answer immediately after.',
      subjects: ['Full timed mock papers'],
    })
  } else if (days >= 7) {
    const drilling = Math.round(days * 0.5)
    const mock     = days - drilling
    phases.push({
      phase: 'Intensive Revision',
      duration: `${drilling} days`,
      icon: '🎯',
      color: '#EF4444',
      goal: 'Drill weak areas hard',
      description: 'You have limited time — hit your weakest topics every day.',
      subjects: weakTopics.slice(0,3).map(t => t.topic),
    })
    phases.push({
      phase: 'Mock & Review',
      duration: `${mock} day${mock === 1 ? '' : 's'}`,
      icon: '📋',
      color: '#10B981',
      goal: 'Exam simulation',
      description: 'One full mock per day. Review wrong answers immediately.',
      subjects: ['Full timed mock papers'],
    })
  } else {
    phases.push({
      phase: 'Final Sprint',
      duration: `${days} day${days === 1 ? '' : 's'}`,
      icon: '🚀',
      color: '#F59E0B',
      goal: 'Consolidate knowledge',
      description: "Light review of your best topics — don't cram new material. Stay calm.",
      subjects: weakTopics.slice(0,2).map(t => t.topic),
    })
  }

  return phases
}

// Compute daily session recommendation
function dailyRec(days, weakCount) {
  if (!days || days <= 0) return { sessions: 2, minutes: 20 }
  if (days > 60)  return { sessions: 1, minutes: 20 }
  if (days > 30)  return { sessions: 2, minutes: 25 }
  if (days > 14)  return { sessions: 2, minutes: 30 }
  if (days > 7)   return { sessions: 3, minutes: 30 }
  return { sessions: 4, minutes: 20 }
}

export default function StudyPlanPage({ user, profile, refreshProfile }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const C          = getColors(stream)
  const dark       = stream === 'alevel'
  const cfg        = STREAM_CONFIG[stream]

  const [topics,      setTopics]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput,   setDateInput]   = useState(profile?.exam_date ?? '')
  const [dateError,   setDateError]   = useState(null)
  const [dateSaving,  setDateSaving]  = useState(false)

  const days = daysUntil(profile?.exam_date)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getTopicStats(user.id, stream)
      .then(({ data }) => {
        const map = {}
        ;(data ?? []).forEach(a => {
          if (!map[a.topic]) map[a.topic] = { correct:0, total:0 }
          map[a.topic].total++
          if (a.is_correct) map[a.topic].correct++
        })
        const list = Object.entries(map).map(([topic, v]) => ({
          topic,
          pct:   Math.round((v.correct / v.total) * 100),
          total: v.total,
        })).sort((a, b) => a.pct - b.pct)
        setTopics(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, stream])

  // Determine which subject a topic belongs to
  function subjectForTopic(topic) {
    const t = topic.toLowerCase()
    for (const s of cfg.subjects) {
      const qs = getQuestions(stream, s.id)
      if (qs.some(q => q.topic === topic)) return s
    }
    return cfg.subjects[0]
  }

  const weakTopics   = topics.filter(t => t.pct < 70)
  const strongTopics = topics.filter(t => t.pct >= 70)
  const avgAccuracy  = topics.length
    ? Math.round(topics.reduce((s, t) => s + t.pct, 0) / topics.length)
    : null
  const schedule = useMemo(() => buildSchedule(days, weakTopics, cfg.subjects), [days, weakTopics.length])
  const rec      = dailyRec(days, weakTopics.length)

  const readinessColor = avgAccuracy == null ? C.muted
    : avgAccuracy >= 75 ? '#10B981'
    : avgAccuracy >= 50 ? '#F59E0B'
    : '#EF4444'
  const readinessLabel = avgAccuracy == null ? 'Not enough data yet'
    : avgAccuracy >= 75 ? 'On Track'
    : avgAccuracy >= 50 ? 'Needs Work'
    : 'At Risk'

  async function saveExamDate(date) {
    if (!date) { setDateError('Please select a date first.'); return }
    setDateError(null)
    setDateSaving(true)
    try {
      const { error } = await upsertProfile(user.id, { exam_date: date })
      if (error) throw error
      await refreshProfile?.()
      setEditingDate(false)
    } catch {
      setDateError('Could not save — please try again.')
    } finally {
      setDateSaving(false)
    }
  }

  return (
    <Shell C={C}>
      {/* Header */}
      <div style={{marginBottom:22}}>
        <div style={{fontSize:26,fontWeight:900,color:C.navy,fontFamily:"'Playfair Display', Georgia, serif",letterSpacing:'-0.4px'}}>Study Plan</div>
        <div style={{fontSize:11,color:C.muted,marginTop:1}}>Personalised to your performance</div>
      </div>

      {/* Exam date hero */}
      <div style={{
        background: days == null ? C.card
          : days <= 7  ? 'linear-gradient(135deg,#EF4444,#DC2626)'
          : days <= 21 ? 'linear-gradient(135deg,#F59E0B,#D97706)'
          : `linear-gradient(135deg,${C.primary},${dark?'#312E81':'#0F766E'})`,
        borderRadius:20, padding:'20px', marginBottom:16, position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}} />
        {days == null ? (
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.muted,marginBottom:8}}>📅 No exam date set</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Set your exam date to unlock a personalised week-by-week schedule.</div>
            {!editingDate ? (
              <button
                onClick={() => setEditingDate(true)}
                style={{background:C.primary,color:'white',border:'none',borderRadius:10,padding:'8px 18px',fontWeight:700,cursor:'pointer',fontSize:13}}
              >Set Exam Date →</button>
            ) : (
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <input
                  type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                  style={{padding:'7px 10px',borderRadius:8,border:`1.5px solid ${C.border}`,background:'#F8FAFC',color:C.navy,fontSize:13}}
                />
                <button onClick={() => saveExamDate(dateInput)} disabled={dateSaving} style={{background:C.primary,color:'white',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:700,cursor:dateSaving?'default':'pointer',opacity:dateSaving?0.7:1,fontSize:13}}>{dateSaving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => { setEditingDate(false); setDateError(null) }} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12}}>Cancel</button>
                {dateError && <span style={{width:'100%',fontSize:11,color:'#EF4444',fontWeight:600}}>{dateError}</span>}
              </div>
            )}
          </div>
        ) : (
          <div style={{color:'white'}}>
            <div style={{fontSize:13,opacity:0.8,marginBottom:4}}>
              {formatDate(profile.exam_date)} · {cfg.label}
            </div>
            <div style={{fontSize:42,fontWeight:900,lineHeight:1,marginBottom:6}}>
              {days > 0 ? days : 0}
              <span style={{fontSize:18,fontWeight:600,opacity:0.8}}> {days === 1 ? 'day' : 'days'} left</span>
            </div>
            <div style={{fontSize:13,opacity:0.75,marginBottom:12}}>
              {days <= 0 ? 'Exam day — good luck! 🎯'
                : days <= 7  ? 'Final week — stay calm, trust your prep'
                : days <= 21 ? 'Three weeks to go — push hard now'
                : 'You have time — build the habit daily'}
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              {avgAccuracy != null && (
                <div style={{background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700}}>
                  {avgAccuracy}% avg accuracy
                </div>
              )}
              <button
                onClick={() => { setDateInput(profile?.exam_date ?? ''); setEditingDate(true) }}
                style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,padding:'6px 14px',color:'white',fontWeight:700,cursor:'pointer',fontSize:12}}
              >
                ✏️ Edit date
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit exam date inline (when countdown is showing) */}
      {days != null && editingDate && (
        <div style={{background:C.card,border:`1.5px solid ${C.primary}40`,borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input
            type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
            style={{flex:1,minWidth:130,padding:'6px 10px',borderRadius:8,border:`1.5px solid ${C.border}`,background:'#F8FAFC',color:C.navy,fontSize:13}}
          />
          <button onClick={() => saveExamDate(dateInput)} disabled={dateSaving} style={{background:C.primary,color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:dateSaving?'default':'pointer',opacity:dateSaving?0.7:1}}>{dateSaving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => { setEditingDate(false); setDateError(null) }} style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer'}}>Cancel</button>
          {dateError && <span style={{width:'100%',fontSize:11,color:'#EF4444',fontWeight:600}}>{dateError}</span>}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{display:'flex',justifyContent:'center',padding:'32px 0'}}>
          <div style={{width:24,height:24,border:`3px solid ${C.border}`,borderTopColor:C.primary,borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
        </div>
      )}

      {/* Readiness overview */}
      {!loading && topics.length > 0 && (
        <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:16,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
          <SectionLabel C={C}>Exam Readiness</SectionLabel>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{
              width:72, height:72, borderRadius:'50%', flexShrink:0,
              background:`conic-gradient(${readinessColor} ${avgAccuracy}%, ${C.border} 0)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 0 0 4px ${C.card}, 0 0 0 6px ${readinessColor}30`,
            }}>
              <div style={{width:54,height:54,borderRadius:'50%',background:C.card,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                <div style={{fontSize:15,fontWeight:900,color:readinessColor}}>{avgAccuracy}%</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:800,color:readinessColor,marginBottom:3}}>{readinessLabel}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
                {weakTopics.length === 0
                  ? 'All topics above 70% — focus on mock exam practice.'
                  : `${weakTopics.length} topic${weakTopics.length>1?'s':''} below 70% need attention.`}
              </div>
              {days != null && days > 0 && (
                <div style={{marginTop:6,fontSize:12,color:C.muted}}>
                  Aim for <strong style={{color:C.primary}}>{rec.sessions} session{rec.sessions>1?'s':''}/day</strong> · {rec.minutes} min each
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's priority */}
      {!loading && weakTopics.length > 0 && (
        <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:16,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
          <SectionLabel C={C}>Today's Priority</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {weakTopics.slice(0,3).map((t, i) => {
              const subj = subjectForTopic(t.topic)
              return (
                <div key={t.topic} style={{display:'flex',alignItems:'center',gap:12,background:'#F8FAFC',borderRadius:12,padding:'11px 14px'}}>
                  <div style={{
                    width:28,height:28,borderRadius:'50%',flexShrink:0,
                    background: i===0 ? '#EF4444' : i===1 ? '#F59E0B' : '#6366F1',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'white',fontWeight:900,fontSize:12,
                  }}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{t.topic}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.pct}% accuracy · {t.total} answer{t.total>1?'s':''}</div>
                  </div>
                  <button
                    onClick={() => navigate(`/${stream}/quiz/${subj.id}?topic=${encodeURIComponent(t.topic)}`)}
                    style={{background:C.primary,color:'white',border:'none',borderRadius:9,padding:'6px 13px',fontWeight:700,cursor:'pointer',fontSize:12,flexShrink:0}}
                  >
                    Drill →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Phased schedule */}
      {schedule.length > 0 && (
        <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:16,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
          <SectionLabel C={C}>Study Schedule</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {schedule.map((phase, i) => (
              <div key={i} style={{display:'flex',gap:0,position:'relative'}}>
                {/* Timeline connector */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:36,flexShrink:0}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:phase.color+'20',border:`2px solid ${phase.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,zIndex:1}}>
                    {phase.icon}
                  </div>
                  {i < schedule.length - 1 && (
                    <div style={{width:2,flex:1,background:C.border,minHeight:24,marginTop:4}} />
                  )}
                </div>
                {/* Content */}
                <div style={{flex:1,paddingBottom: i < schedule.length-1 ? 20 : 0,paddingLeft:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.navy}}>{phase.phase}</div>
                    <div style={{fontSize:11,color:phase.color,fontWeight:700,background:phase.color+'18',borderRadius:6,padding:'2px 8px',flexShrink:0}}>{phase.duration}</div>
                  </div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:6}}>{phase.description}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {phase.subjects.map(s => (
                      <span key={s} style={{background:phase.color+'18',color:phase.color,borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700}}>{s || '—'}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All topics overview */}
      {!loading && topics.length > 0 && (
        <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:16,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
          <SectionLabel C={C}>All Topics</SectionLabel>
          {[...weakTopics, ...strongTopics].map(t => {
            const subj = subjectForTopic(t.topic)
            return (
              <div key={t.topic} style={{marginBottom:11}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{t.topic}</span>
                    <span style={{fontSize:10,color:C.muted,marginLeft:6}}>{subj?.emoji} {subj?.label}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {t.pct < 70 && (
                      <button
                        onClick={() => navigate(`/${stream}/quiz/${subj.id}?topic=${encodeURIComponent(t.topic)}`)}
                        style={{background:'#EF444418',border:'1px solid #EF444440',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,color:'#EF4444',cursor:'pointer'}}
                      >Drill</button>
                    )}
                    <span style={{fontSize:12,fontWeight:700,color: t.pct>=75?'#10B981':t.pct>=50?'#F59E0B':'#EF4444',minWidth:32,textAlign:'right'}}>{t.pct}%</span>
                  </div>
                </div>
                <div style={{background:C.border,borderRadius:6,height:6}}>
                  <div style={{
                    width:`${t.pct}%`,
                    background: t.pct>=75?'#10B981':t.pct>=50?'#F59E0B':'#EF4444',
                    height:'100%',borderRadius:6,transition:'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No data state */}
      {!loading && topics.length === 0 && (
        <div style={{background:C.card,borderRadius:16,padding:'28px',textAlign:'center',marginBottom:16,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:36,marginBottom:12}}>📊</div>
          <div style={{fontWeight:800,color:C.navy,fontSize:15,marginBottom:6}}>No performance data yet</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:16}}>
            Complete a few quiz sessions and your personalised plan will appear here, showing your weak spots and exactly what to study each day.
          </div>
          <button
            onClick={() => navigate(`/${stream}`)}
            style={{background:C.primary,color:'white',border:'none',borderRadius:12,padding:'11px 24px',fontWeight:700,cursor:'pointer',fontSize:14}}
          >
            Start Practising →
          </button>
        </div>
      )}

      {/* Strong topics summary */}
      {!loading && strongTopics.length > 0 && (
        <div style={{padding:'12px 16px',background:C.success+'15',border:`1px solid ${C.success}30`,borderRadius:12,marginBottom:16,fontSize:12,color:dark?'#4ADE80':C.success,lineHeight:1.6}}>
          ✅ <strong>{strongTopics.length} topic{strongTopics.length>1?'s':''} above 70%</strong> — keep these warm with one session per week each.
        </div>
      )}

      {/* Go to full mock */}
      {days != null && days > 0 && days <= 30 && (
        <button
          onClick={() => navigate(`/${stream}/mock/${cfg.subjects[0].id}`)}
          style={{width:'100%',background:`linear-gradient(135deg,${C.primary},${dark?'#312E81':'#0F766E'})`,color:'white',border:'none',borderRadius:14,padding:'14px',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 16px ${C.primary}40`}}
        >
          📋 Take a Full Mock Exam
        </button>
      )}
    </Shell>
  )
}
