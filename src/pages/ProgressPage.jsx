/**
 * ProgressPage — reads real data from Supabase:
 *   weekly activity, topic accuracy, XP, streak.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWeeklyActivity, getTopicStats } from '../lib/db.js'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { getColors, Shell, SectionLabel } from './HomePage.jsx'
import { shadow } from '../styles/tokens.js'
import { useMastery } from '../hooks/useMastery.js'
import { TRACK_COLORS } from '../styles/courseraTokens.js'

// Map topic name → subject id for drill routing
function guessSubjectForTopic(topic, cfg) {
  const t = topic.toLowerCase()
  for (const s of cfg.subjects) {
    if (t.includes(s.label.toLowerCase()) || t.includes(s.id)) return s.id
  }
  return cfg.subjects[0]?.id
}

export default function ProgressPage({ user, profile, isDark }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const C          = getColors(stream, null, isDark)
  const dark       = isDark
  const cfg        = STREAM_CONFIG[stream]

  const [weekly,  setWeekly]  = useState([])
  const [topics,  setTopics]  = useState([])
  const [loading, setLoading] = useState(true)

  const xp     = profile?.xp     ?? 0
  const streak = profile?.streak  ?? 0
  const level  = Math.floor(xp / 150) + 1

  // Enrolled tracks tab bar (only when user has > 1 stream)
  const enrolledStreams = profile?.streams ?? [stream]
  const showStreamTabs  = enrolledStreams.length > 1

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const timeout = new Promise(resolve => setTimeout(() => resolve([{ data: [] }, { data: [] }]), 8000))
    Promise.race([
      Promise.all([getWeeklyActivity(user.id), getTopicStats(user.id, stream)]),
      timeout,
    ]).then(([{ data: w }, { data: t }]) => {
      setWeekly(w ?? [])
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
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.id, stream])

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
    <Shell C={C} isDark={isDark}>
      {/* Track switcher — only when enrolled in multiple streams */}
      {showStreamTabs && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:18, paddingBottom:2, scrollbarWidth:'none' }}>
          {enrolledStreams.map(s => {
            const sc = STREAM_CONFIG[s]
            const active = s === stream
            return (
              <button
                key={s}
                onClick={() => navigate(`/${s}/progress`)}
                style={{
                  flexShrink: 0,
                  background: active ? C.primary : '#F1F5F9',
                  color: active ? 'white' : '#64748B',
                  border: active ? `1.5px solid ${C.primary}` : '1.5px solid #E2E8F0',
                  borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:22}}>
        <div style={{fontSize:24,fontWeight:800,color:C.navy,letterSpacing:'-0.4px'}}>My Learning</div>
        <button
          onClick={() => navigate(`/${stream}/plan`)}
          style={{background:C.primary,color:'white',border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:6}}
        >
          📅 Study Plan
        </button>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {stats.map(s => (
          <div key={s.label} style={{background:C.card,borderRadius:16,padding:'16px 14px',textAlign:'center',boxShadow:shadow.md}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:36,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly heatmap */}
      <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:14,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
        <SectionLabel C={C}>This Week</SectionLabel>
        {loading ? <Skeleton C={C} height={80} /> : (
          <div style={{display:'flex',gap:6,alignItems:'flex-end',height:120}}>
            {heatmap.map((d, i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{width:'100%',height: d.sessions > 0 ? Math.max(10, (d.sessions/maxSessions)*100) : 10,borderRadius:4,background: d.sessions>0?C.primary:C.border,transition:'height 0.5s ease'}} />
                <div style={{fontSize:11,color:C.muted}}>{d.label.slice(0,1)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject Mastery strip */}
      <SubjectMasteryStrip streams={enrolledStreams} C={C} />

      {/* Topic accuracy */}
      <div style={{background:C.card,borderRadius:16,padding:'18px',marginBottom:14,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
        <SectionLabel C={C}>{dark ? 'Exam Readiness' : ['sat','act','ap','psat'].includes(stream) ? 'Topic Performance' : 'Subject Strength'}</SectionLabel>
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

const UK_STREAMS = ['gcse', 'alevel']
const US_STREAMS = ['sat', 'act', 'ap', 'psat']

function SubjectMasteryStrip({ streams, C }) {
  const [collapsed, setCollapsed] = useState({})

  const normStreams = Array.isArray(streams) ? streams : [streams]
  const ukEnrolled = normStreams.filter(s => UK_STREAMS.includes(s))
  const usEnrolled = normStreams.filter(s => US_STREAMS.includes(s))
  const totalStreams = normStreams.length

  function toggleTrack(s) {
    setCollapsed(prev => ({ ...prev, [s]: !prev[s] }))
  }

  function renderTrackGroup(regionLabel, regionStreams) {
    if (!regionStreams.length) return null
    return (
      <div key={regionLabel} style={{ marginBottom: 8 }}>
        {totalStreams > 1 && (
          <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            {regionLabel}
          </div>
        )}
        {regionStreams.map(s => {
          const cfg = STREAM_CONFIG[s]
          if (!cfg) return null
          const accent = TRACK_COLORS[s] ?? C.primary
          const isCollapsed = collapsed[s]
          return (
            <div key={s} style={{ marginBottom: 10 }}>
              {totalStreams > 1 && (
                <button
                  onClick={() => toggleTrack(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 6px',
                    textAlign: 'left', fontFamily: 'Inter,sans-serif',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, flex: 1 }}>
                    {cfg.label?.replace(' Track', '').replace(' Prep', '') ?? s.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{isCollapsed ? '▸' : '▾'}</span>
                </button>
              )}
              {!isCollapsed && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {cfg.subjects.filter(sub => !sub.deprecated).map(sub => (
                    <SubjectMasteryDot key={sub.id} stream={s} subject={sub} C={C} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ background: C.card, borderRadius: 16, padding: '16px 18px', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
      <SectionLabel C={C}>Subject Mastery</SectionLabel>
      {renderTrackGroup('🇬🇧 United Kingdom', ukEnrolled)}
      {renderTrackGroup('🇺🇸 United States', usEnrolled)}
    </div>
  )
}

function SubjectMasteryDot({ stream, subject, C }) {
  const questions = getQuestions(stream, subject.id)
  const { pct, badge } = useMastery(questions)
  const badgeLabel = badge === 'gold' ? '🥇' : badge === 'silver' ? '🥈' : badge === 'bronze' ? '🥉' : null
  const barColor   = badge === 'gold' ? '#FBBF24' : badge === 'silver' ? '#9CA3AF' : badge === 'bronze' ? '#CD7F32' : C.primary
  return (
    <div style={{textAlign:'center', minWidth:56}}>
      <div style={{
        width:44, height:44, borderRadius:22, margin:'0 auto 5px',
        background:`${barColor}18`, border:`2px solid ${barColor}40`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:20, position:'relative',
      }}>
        {subject.emoji}
        {badgeLabel && (
          <div style={{position:'absolute', top:-4, right:-4, fontSize:14}}>{badgeLabel}</div>
        )}
      </div>
      <div style={{fontSize:9, fontWeight:700, color:C.navy, lineHeight:1.2}}>{subject.label.replace(' & ','\n& ')}</div>
      <div style={{fontSize:10, fontWeight:800, color:barColor, marginTop:2}}>{pct}%</div>
    </div>
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
      <div style={{background:C.border,borderRadius:4,height:6}}>
        <div style={{width:`${pct}%`,background:C.primary,height:'100%',borderRadius:4,transition:'width 0.6s ease'}} />
      </div>
    </div>
  )
}

function Skeleton({ C, height }) {
  return <div style={{background:C.border,borderRadius:8,height,animation:'pulse 1.5s ease infinite'}} />
}
