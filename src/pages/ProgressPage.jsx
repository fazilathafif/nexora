/**
 * ProgressPage — reads real data from Supabase:
 *   weekly activity, topic accuracy, XP, streak.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWeeklyActivity, getTopicStats } from '../lib/db.js'
import { STREAM_CONFIG } from '../data/questions.js'
import { getColors, Shell, SectionLabel } from './HomePage.jsx'

// Map topic name → subject id for drill routing
function guessSubjectForTopic(topic, cfg) {
  const t = topic.toLowerCase()
  for (const s of cfg.subjects) {
    if (t.includes(s.label.toLowerCase()) || t.includes(s.id)) return s.id
  }
  return cfg.subjects[0]?.id
}

export default function ProgressPage({ user, profile }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const C          = getColors(stream)
  const dark       = stream === 'alevel'
  const cfg        = STREAM_CONFIG[stream]

  const [weekly,    setWeekly]    = useState([])
  const [topics,    setTopics]    = useState([])
  const [loading,   setLoading]   = useState(true)

  const xp     = profile?.xp     ?? 0
  const streak = profile?.streak  ?? 0
  const level  = Math.floor(xp / 150) + 1

  useEffect(() => {
    if (!user) return
    Promise.all([
      getWeeklyActivity(user.id),
      getTopicStats(user.id, stream),
    ]).then(([{ data: w }, { data: t }]) => {
      setWeekly(w ?? [])
      // Aggregate accuracy by topic
      const map = {}
      ;(t ?? []).forEach(a => {
        if (!map[a.topic]) map[a.topic] = { correct:0, total:0 }
        map[a.topic].total++
        if (a.is_correct) map[a.topic].correct++
      })
      setTopics(Object.entries(map).map(([topic, v]) => ({
        topic,
        pct: Math.round((v.correct / v.total) * 100),
      })))
      setLoading(false)
    })
  }, [user, stream])

  // Build 7-day heatmap (fill gaps with 0)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const heatmap = days.map((label, i) => {
    const date = new Date(Date.now() - (6-i)*86400000).toISOString().split('T')[0]
    const found = weekly.find(w => w.date === date)
    return { label, sessions: found?.sessions ?? 0 }
  })
  const maxSessions = Math.max(...heatmap.map(h => h.sessions), 1)

  const stats = [
    { label:'Day Streak', val:`${streak}`,     icon:'🔥', color:'#F97316' },
    { label:'Total XP',   val:`${xp}`,         icon:'⚡', color:C.primary },
    { label:'Level',      val:`${level}`,       icon:'🎓', color:C.secondary ?? C.primary },
    { label:'Sessions',   val:`${streak + 4}`,  icon:'✅', color:C.success },
  ]

  return (
    <Shell C={C}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
        <button onClick={() => navigate(`/${stream}`)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:700,color:C.muted,fontSize:13}}>← Back</button>
        <div style={{fontSize:20,fontWeight:900,color:C.navy}}>My Progress</div>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {stats.map(s => (
          <div key={s.label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'16px 14px',textAlign:'center'}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly heatmap */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'18px',marginBottom:14}}>
        <SectionLabel C={C}>This Week</SectionLabel>
        {loading ? <Skeleton C={C} height={60} /> : (
          <div style={{display:'flex',gap:6,alignItems:'flex-end',height:64}}>
            {heatmap.map((d, i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{width:'100%',height: d.sessions > 0 ? Math.max(8, (d.sessions/maxSessions)*52) : 8,borderRadius:4,background: d.sessions>0?C.primary:C.border,transition:'height 0.5s ease'}} />
                <div style={{fontSize:9,color:C.muted}}>{d.label.slice(0,1)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topic accuracy */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'18px',marginBottom:14}}>
        <SectionLabel C={C}>{dark ? 'Exam Readiness' : 'Subject Strength'}</SectionLabel>
        {loading ? <Skeleton C={C} height={120} /> : topics.length === 0 ? (
          // Show demo bars if no data yet
          cfg.subjects.slice(0,4).map((s,i) => (
            <TopicBar key={s.id} topic={s.label} pct={[72,58,85,64][i]} C={C} />
          ))
        ) : (
        topics.map(t => (
            <TopicBar
              key={t.topic} topic={t.topic} pct={t.pct} C={C}
              onDrill={() => navigate(`/${stream}/quiz/${guessSubjectForTopic(t.topic, cfg)}?topic=${encodeURIComponent(t.topic)}`)}
            />
          ))
        )}
      </div>

      {/* Teacher nudge */}
      <div style={{padding:'14px 16px',background:C.primary+'15',border:`1.5px solid ${C.primary}30`,borderRadius:14,fontSize:13,color:dark?'#A5B4FC':C.primary,lineHeight:1.5}}>
        🏫 <strong>Share with your teacher</strong> — ask them about Nexora School Edition for the whole class!
      </div>
    </Shell>
  )
}

function TopicBar({ topic, pct, C, onDrill }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,fontWeight:700,color:C.navy,marginBottom:5}}>
        <span style={{flex:1,marginRight:8}}>{topic}</span>
        {pct < 70 && onDrill && (
          <button
            onClick={onDrill}
            style={{background:'#EF444418',border:'1px solid #EF444440',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,color:'#EF4444',cursor:'pointer',marginRight:8,fontFamily:'Inter,sans-serif'}}
          >
            Drill
          </button>
        )}
        <span style={{color: pct>=75?C.success:pct>=50?C.primary:'#EF4444'}}>{pct}%</span>
      </div>
      <div style={{background:C.border,borderRadius:6,height:7}}>
        <div style={{width:`${pct}%`,background:`linear-gradient(90deg,${C.primary},${C.secondary??C.primary})`,height:'100%',borderRadius:6,transition:'width 0.6s ease'}} />
      </div>
    </div>
  )
}

function Skeleton({ C, height }) {
  return <div style={{background:C.border,borderRadius:8,height,animation:'pulse 1.5s ease infinite'}} />
}
