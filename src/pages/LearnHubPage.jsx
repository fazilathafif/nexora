/**
 * LearnHubPage — merges Today + Progress + Study Plan into one hub
 * Route: /:stream/learn-hub
 *
 * Mobile/Tablet : 3-tab bar — Today | Progress | Plan
 * Desktop       : 3-column split — all panels visible simultaneously
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getTopicStats, getWeeklyActivity, addXp, updateProfile, getExamDates, setExamDate } from '../lib/db.js'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { getDueCount } from '../lib/srs.js'
import { getNotes, deleteNote, exportNotesText, NOTES_MAX } from '../lib/notes.js'
import { getColors, Shell, SectionLabel } from './HomePage.jsx'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { useMastery } from '../hooks/useMastery.js'
import { TRACK_COLORS, COURSERA_BLUE } from '../styles/courseraTokens.js'
import IBPointsCalculator   from '../components/IBPointsCalculator.jsx'
import IGCSEGradeToggle     from '../components/IGCSEGradeToggle.jsx'
import IAChecklist          from '../components/IAChecklist.jsx'
import { getEffectivePlan } from '../lib/subscription.js'
import { getDayPlan, getWeekCalendar, groupTopicsBySubject } from '../lib/studySchedule.js'
import { checkAndUnlockCertificates } from '../lib/certificates.js'

// ── Shared helpers ────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

function dailyRec(days) {
  if (!days || days <= 0) return { sessions:2, minutes:20 }
  if (days > 60) return { sessions:1, minutes:20 }
  if (days > 30) return { sessions:2, minutes:25 }
  if (days > 14) return { sessions:2, minutes:30 }
  if (days > 7)  return { sessions:3, minutes:30 }
  return { sessions:4, minutes:20 }
}

function getTodayStr() { return new Date().toISOString().split('T')[0] }

function readDailyChallenge(stream) {
  try {
    const raw = localStorage.getItem(`nx_daily_${stream}`)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d.date === getTodayStr() ? d : null
  } catch { return null }
}

function getDailySubject(subjects) {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime()
  const day   = Math.floor((Date.now() - start) / 86400000)
  return subjects[day % subjects.length]
}

function guessSubjectForTopic(topic, cfg) {
  const t = topic.toLowerCase()
  for (const s of cfg.subjects) {
    if (t.includes(s.label.toLowerCase()) || t.includes(s.id)) return s.id
  }
  return cfg.subjects[0]?.id
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function Card({ children, accent, C, style }) {
  return (
    <div style={{
      background:'white',
      border:`1.5px solid ${accent ? accent+'28' : C.border}`,
      borderRadius:18,
      padding:'16px 18px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SH({ label, C }) {
  return (
    <div style={{
      fontSize:11, fontWeight:800, color:C.muted,
      letterSpacing:'0.08em', textTransform:'uppercase',
      marginBottom:10, marginTop:4,
    }}>
      {label}
    </div>
  )
}

function Skeleton({ C, height=60 }) {
  return <div style={{ background:C.border, borderRadius:8, height, animation:'pulse 1.5s ease infinite' }} />
}

// ── TODAY sub-components ──────────────────────────────────────────────────────

function DailyChallengeCard({ stream, subjects, C, navigate }) {
  const data      = readDailyChallenge(stream)
  const completed = !!data
  const subject   = getDailySubject(subjects)
  return (
    <div style={{
      marginBottom:12,
      background: completed
        ? 'linear-gradient(135deg,#DCFCE7,#F0FDF4)'
        : `linear-gradient(135deg,${C.primary}15,${C.primary}08)`,
      border:`1.5px solid ${completed ? '#10B98140' : C.primary+'40'}`,
      borderRadius:18, padding:'16px 18px',
      display:'flex', alignItems:'center', gap:14,
    }}>
      <div style={{
        width:48, height:48, borderRadius:13, flexShrink:0,
        background: completed ? '#10B98120' : `${C.primary}20`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
      }}>
        {completed ? '✅' : '🎯'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:900, color: completed ? '#065F46' : C.navy, letterSpacing:'-0.2px' }}>
          Daily Challenge
        </div>
        <div style={{ fontSize:12, color: completed ? '#059669' : C.muted, marginTop:2 }}>
          {completed
            ? `Completed · ${data.score}/${data.total} correct — come back tomorrow!`
            : `Today: ${subject.emoji} ${subject.label} · 10 questions`}
        </div>
      </div>
      {!completed && (
        <button
          onClick={() => navigate(`/${stream}/quiz/${subject.id}?daily=1`)}
          style={{
            background:`linear-gradient(135deg,${C.primary},${C.secondary ?? C.primary})`,
            color:'white', border:'none', borderRadius:11,
            padding:'9px 16px', fontSize:13, fontWeight:800,
            cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0,
          }}
        >Start →</button>
      )}
    </div>
  )
}

function GoalCard({ rec, days, studiedToday, C }) {
  const urgency = days !== null && days <= 7 ? '#EF4444' : days !== null && days <= 30 ? '#F59E0B' : C.primary
  return (
    <Card C={C} accent={urgency} style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'stretch', gap:0 }}>
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:40, fontWeight:900, lineHeight:1, color:urgency }}>{rec.sessions}</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:3 }}>session{rec.sessions>1?'s':''}</div>
        </div>
        <div style={{ width:1, background:C.border, margin:'4px 14px', flexShrink:0 }} />
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:40, fontWeight:900, lineHeight:1, color:urgency }}>{rec.minutes}</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:3 }}>mins each</div>
        </div>
        <div style={{ width:1, background:C.border, margin:'4px 14px', flexShrink:0 }} />
        <div style={{ flex:2, display:'flex', flexDirection:'column', justifyContent:'center', gap:3 }}>
          <div style={{ fontSize:13, fontWeight:800, color:urgency }}>
            {days !== null && days > 0 ? `${days} day${days===1?'':'s'} to go` : days===0 ? 'Exam day! 🎯' : 'Keep going'}
          </div>
          <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>
            {days !== null && days > 0 ? 'Based on your exam date' : 'Set exam date in Settings'}
          </div>
        </div>
      </div>
      {!studiedToday && (
        <div style={{
          marginTop:12, padding:'9px 12px',
          background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)',
          border:'1px solid #F59E0B40', borderRadius:11,
          fontSize:12, color:'#92400E', fontWeight:600,
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span>🔥</span><span>Start a session today to keep your streak alive!</span>
        </div>
      )}
    </Card>
  )
}

function PriorityDrillCard({ topics, stream, C, navigate }) {
  if (!topics.length) return null
  return (
    <div style={{ marginBottom:12 }}>
      <SH label="Priority Drill" C={C} />
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {topics.map(t => (
          <div key={t.topic} style={{
            display:'flex', alignItems:'center', gap:12,
            background:'white', border:`1px solid ${C.border}`,
            borderRadius:14, padding:'12px 14px',
            boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              width:36, height:36, borderRadius:10, flexShrink:0,
              background: t.pct < 40 ? '#EF444415' : '#F59E0B15',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
            }}>{t.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1E293B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {t.topic}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <div style={{ width:72, height:4, background:'#F1F5F9', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${t.pct}%`, height:'100%', borderRadius:2, background: t.pct<40?'#EF4444':'#F59E0B' }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color: t.pct<40?'#EF4444':'#F59E0B' }}>{t.pct}%</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/${stream}/quiz/${t.subjectId}`)}
              style={{
                background:C.primary, color:'white', border:'none',
                borderRadius:10, padding:'7px 14px',
                fontSize:12, fontWeight:800, cursor:'pointer',
                fontFamily:'Inter,sans-serif', flexShrink:0,
              }}
            >Drill →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SrsDueCard({ srsData, totalDue, stream, C, navigate }) {
  if (!totalDue) return null
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <SH label="Review Due" C={C} />
        <span style={{ fontSize:12, fontWeight:800, color:C.primary, background:`${C.primary}15`, borderRadius:20, padding:'2px 10px', marginBottom:10 }}>
          {totalDue} due
        </span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {srsData.map(s => (
          <div key={s.id} style={{
            display:'flex', alignItems:'center', gap:10,
            background:'white', border:`1px solid ${C.border}`,
            borderRadius:12, padding:'10px 14px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize:18 }}>{s.emoji}</span>
            <div style={{ flex:1, fontSize:13, fontWeight:700, color:'#1E293B' }}>{s.label}</div>
            <span style={{ fontSize:11, fontWeight:700, color:C.primary, background:`${C.primary}12`, borderRadius:20, padding:'2px 8px', marginRight:6 }}>
              {s.dueCount}
            </span>
            <button
              onClick={() => navigate(`/${stream}/flashcards/${s.id}?review=1`)}
              style={{
                background:'none', border:`1.5px solid ${C.primary}40`,
                color:C.primary, borderRadius:8, padding:'5px 11px',
                fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}
            >Review →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickStartGrid({ subjects, stream, C, cols }) {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(null)

  const MODES = [
    { label:'Flashcards', icon:'🃏', desc:'Spaced repetition', key:'flashcards' },
    { label:'Mock Exam',  icon:'📋', desc:'Timed full paper',  key:'mock' },
    { label:'Learn',      icon:'🧠', desc:'AI explanations',   key:'learn' },
  ]

  function getPath(subjectId, mode) {
    const base = `/${stream}/${mode}/${subjectId}`
    return base
  }

  return (
    <div style={{ marginBottom:12 }}>
      <SH label="Quick Start" C={C} />
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {subjects.map(s => (
          <div key={s.id} style={{ position:'relative' }}>
            <div style={{
              background:'white', border:`1.5px solid ${C.border}`,
              borderRadius:14, overflow:'visible',
              boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
              display:'flex', alignItems:'center', gap:12,
            }}>
              {/* Emoji */}
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0, marginLeft:12,
                background:`${C.primary}15`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
              }}>{s.emoji}</div>

              {/* Label */}
              <div style={{ flex:1, minWidth:0, padding:'12px 0' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#1E293B', lineHeight:1.2 }}>{s.label}</div>
                {s.desc && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.desc}</div>}
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => navigate(`/${stream}/quiz/${s.id}`)}
                style={{
                  background:C.primary, color:'white',
                  border:'none', borderRadius:10,
                  padding:'8px 14px', fontSize:12, fontWeight:800,
                  cursor:'pointer', fontFamily:'Inter,sans-serif',
                  whiteSpace:'nowrap', flexShrink:0,
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                Practice →
              </button>

              {/* More button */}
              <button
                onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  marginRight:8, background:'transparent',
                  border:`1.5px solid ${C.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:16, color:C.muted,
                  WebkitTapHighlightColor:'transparent',
                  fontFamily:'Inter,sans-serif',
                }}
                aria-label="More modes"
              >
                ⋯
              </button>
            </div>

            {/* Popover */}
            {openMenu === s.id && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setOpenMenu(null)}
                  style={{ position:'fixed', inset:0, zIndex:50 }}
                />
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0,
                  background:'white', border:`1.5px solid ${C.border}`,
                  borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                  zIndex:51, minWidth:200, overflow:'hidden',
                }}>
                  {MODES.map((m, i) => (
                    <button
                      key={m.key}
                      onClick={() => { setOpenMenu(null); navigate(getPath(s.id, m.key)) }}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:12,
                        background:'white', border:'none',
                        borderBottom: i < MODES.length - 1 ? `1px solid ${C.border}` : 'none',
                        padding:'11px 14px', cursor:'pointer',
                        fontFamily:'Inter,sans-serif', textAlign:'left',
                        WebkitTapHighlightColor:'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${C.primary}08`}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{ fontSize:18, flexShrink:0 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{m.label}</div>
                        <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BrainBreakRow({ stream, C, navigate }) {
  return (
    <button
      onClick={() => navigate(`/${stream}/wellbeing`)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        background:'white', border:`1.5px solid ${C.border}`,
        borderRadius:14, padding:'12px 16px', marginBottom:12,
        cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left',
        boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background:'#A7F3D015', border:'1px solid #10B98130',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
      }}>🧘</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Brain Break</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Box breathing · music · wellbeing tips</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ── PROGRESS sub-components ───────────────────────────────────────────────────

function StatStrip({ streak, xp, level, C }) {
  const stats = [
    { icon:'🔥', val:streak, label:'Streak'  },
    { icon:'⚡', val:xp,     label:'XP'      },
    { icon:'🎓', val:level,  label:'Level'   },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background:'white', border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:'12px 8px', textAlign:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
          <div style={{ fontSize:26, fontWeight:900, color:C.primary, lineHeight:1 }}>{s.val}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function WeeklyHeatmap({ heatmap, maxSessions, loading, C }) {
  return (
    <Card C={C} style={{ marginBottom:12 }}>
      <SH label="This Week" C={C} />
      {loading ? <Skeleton C={C} height={80} /> : (
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:80 }}>
          {heatmap.map((d,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:'100%',
                height: d.sessions > 0 ? Math.max(10, (d.sessions/maxSessions)*64) : 8,
                borderRadius:4,
                background: d.sessions > 0 ? C.primary : C.border,
                transition:'height 0.5s ease',
              }} />
              <div style={{ fontSize:10, color:C.muted }}>{d.label.slice(0,1)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

const UK_STREAMS = ['gcse','alevel']
const US_STREAMS = ['sat','act','ap','psat']

function SubjectMasteryStrip({ streams, C, navigate, activeTrack }) {
  const norm  = Array.isArray(streams) ? streams : [streams]
  const total = norm.length

  // Group streams by region
  const uk    = norm.filter(s => UK_STREAMS.includes(s))
  const us    = norm.filter(s => US_STREAMS.includes(s))
  const intl  = norm.filter(s => !UK_STREAMS.includes(s) && !US_STREAMS.includes(s))

  function renderTrack(s) {
    const cfg    = STREAM_CONFIG[s]
    if (!cfg) return null
    const accent = TRACK_COLORS[s] ?? C.primary
    const isActive = s === activeTrack
    return (
      <div key={s} style={{ marginBottom: total > 1 ? 20 : 0 }}>
        {total > 1 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:10, height:10, borderRadius:5, background:accent, flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:800, color:C.navy }}>
              {cfg.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
            </span>
            {isActive && (
              <span style={{ fontSize:9, fontWeight:800, color:accent, background:`${accent}15`, border:`1px solid ${accent}30`, borderRadius:20, padding:'1px 7px', letterSpacing:'0.04em' }}>
                ACTIVE
              </span>
            )}
          </div>
        )}
        <MasteryList stream={s} subjects={cfg.subjects.filter(sub => !sub.deprecated)} accent={accent} C={C} navigate={navigate} />
      </div>
    )
  }

  function renderGroup(label, regionStreams) {
    if (!regionStreams.length) return null
    return (
      <div key={label} style={{ marginBottom:4 }}>
        {total > 1 && regionStreams.length > 0 && (
          <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
            {label}
          </div>
        )}
        {regionStreams.map(renderTrack)}
      </div>
    )
  }

  return (
    <Card C={C} style={{ marginBottom:12 }}>
      <SH label="Subject Mastery" C={C} />
      {renderGroup('🇬🇧 United Kingdom', uk)}
      {renderGroup('🇺🇸 United States', us)}
      {renderGroup('🌍 International', intl)}
    </Card>
  )
}

function MasteryList({ stream, subjects, accent, C, navigate }) {
  // Collect pct for all subjects then sort weakest first
  const rows = subjects.map(sub => {
    const questions = getQuestions(stream, sub.id)
    return { sub, questions }
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {rows.map(({ sub, questions }) => (
        <MasteryRow
          key={sub.id}
          stream={stream}
          subject={sub}
          questions={questions}
          accent={accent}
          C={C}
          navigate={navigate}
        />
      ))}
    </div>
  )
}

function MasteryRow({ stream, subject, questions, accent, C, navigate }) {
  const { pct, badge } = useMastery(questions)
  const badgeLabel = badge==='gold'?'🥇':badge==='silver'?'🥈':badge==='bronze'?'🥉':null

  const barColor = pct >= 75 ? '#10B981'
    : pct >= 50 ? '#F59E0B'
    : pct > 0   ? '#EF4444'
    : C.border.replace('#','') !== '' ? '#E2E8F0' : '#E2E8F0'

  const textColor = pct >= 75 ? '#065F46'
    : pct >= 50 ? '#92400E'
    : pct > 0   ? '#991B1B'
    : C.muted

  const bgColor = pct >= 75 ? '#ECFDF5'
    : pct >= 50 ? '#FFFBEB'
    : pct > 0   ? '#FEF2F2'
    : '#F8FAFC'

  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => navigate && navigate(`/${stream}/quiz/${subject.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        background: hovered ? `${accent}06` : 'transparent',
        border:`1px solid ${hovered ? accent+'30' : C.border}`,
        borderRadius:12, padding:'10px 12px',
        cursor: navigate ? 'pointer' : 'default',
        fontFamily:'Inter,sans-serif', textAlign:'left',
        transition:'all 0.15s ease',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      {/* Emoji */}
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background:`${accent}15`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>
        {subject.emoji}
      </div>

      {/* Label + bar */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.navy, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {subject.label}
          </span>
          {badgeLabel && <span style={{ fontSize:12, lineHeight:1, flexShrink:0 }}>{badgeLabel}</span>}
        </div>
        {/* Progress bar */}
        <div style={{ height:5, background:'#E2E8F0', borderRadius:999, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:999,
            width:`${pct}%`,
            background: barColor,
            transition:'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Percentage badge */}
      <div style={{
        flexShrink:0, minWidth:40, textAlign:'center',
        background: pct === 0 ? 'transparent' : bgColor,
        border: pct === 0 ? 'none' : `1px solid ${barColor}30`,
        borderRadius:8, padding:'3px 7px',
      }}>
        <span style={{
          fontSize:12, fontWeight:800,
          color: pct === 0 ? C.muted : textColor,
        }}>
          {pct === 0 ? '—' : `${pct}%`}
        </span>
      </div>
    </button>
  )
}

function TopicBar({ topic, pct, C, onDrill }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:700, color:C.navy, marginBottom:5 }}>
        <span style={{ flex:1, marginRight:8 }}>{topic}</span>
        {pct < 70 && onDrill && (
          <button
            onClick={onDrill}
            style={{ background:'#EF444418', border:'1px solid #EF444440', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700, color:'#EF4444', cursor:'pointer', marginRight:8, fontFamily:'Inter,sans-serif' }}
          >Drill</button>
        )}
        <span style={{ color: pct>=75?C.success:pct>=50?C.primary:'#EF4444' }}>{pct}%</span>
      </div>
      <div style={{ background:C.border, borderRadius:4, height:6 }}>
        <div style={{ width:`${pct}%`, background:C.primary, height:'100%', borderRadius:4, transition:'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Week Calendar component ───────────────────────────────────────────────────

function WeekCalendar({ weeks, C, navigate, activeTrack }) {
  const [openWeeks, setOpenWeeks] = useState(() => {
    // current week open by default
    const init = {}
    weeks.forEach((w, i) => { if (w.isCurrentWeek || w.containsToday) init[i] = true })
    return init
  })

  function toggle(i) { setOpenWeeks(p => ({ ...p, [i]: !p[i] })) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {weeks.map((week, wi) => {
        const isOpen    = !!openWeeks[wi]
        const mainColor = week.phaseColors?.[0] ?? C.primary
        return (
          <div key={wi}>
            {/* Week header — tap to expand/collapse */}
            <button
              onClick={() => toggle(wi)}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                background: isOpen ? `${mainColor}10` : C.card,
                border:`1.5px solid ${isOpen ? mainColor+'40' : C.border}`,
                borderRadius: isOpen ? '12px 12px 0 0' : 12,
                padding:'10px 14px', cursor:'pointer',
                fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
                transition:'all 0.15s',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {week.containsToday && <span style={{ fontSize:9, fontWeight:800, color:mainColor, background:`${mainColor}15`, borderRadius:20, padding:'1px 7px', letterSpacing:'0.04em' }}>NOW</span>}
                {week.containsExam && <span style={{ fontSize:9, fontWeight:800, color:'#0056D2', background:'#0056D215', borderRadius:20, padding:'1px 7px' }}>EXAM</span>}
                <span style={{ fontSize:12, fontWeight:800, color:isOpen ? mainColor : C.navy }}>{week.weekLabel}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {/* Phase colour dots */}
                <div style={{ display:'flex', gap:3 }}>
                  {[...new Set(week.days.map(d => d.phaseColor))].map(col => (
                    <div key={col} style={{ width:6, height:6, borderRadius:3, background:col }} />
                  ))}
                </div>
                <span style={{ fontSize:12, color:C.muted, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
              </div>
            </button>

            {/* Week days — shown when expanded */}
            {isOpen && (
              <div style={{
                background:'white', border:`1.5px solid ${mainColor}40`, borderTop:'none',
                borderRadius:'0 0 12px 12px', overflow:'hidden',
              }}>
                {week.days.map((d, di) => (
                  <div key={d.date} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    background: d.isToday ? `${d.phaseColor}08` : d.isExamDay ? '#EFF6FF' : 'white',
                    borderBottom: di < week.days.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    {/* Date */}
                    <div style={{ flexShrink:0, textAlign:'center', minWidth:34 }}>
                      <div style={{ fontSize:9, fontWeight:700, color:d.isToday ? d.phaseColor : C.muted, textTransform:'uppercase' }}>{d.dayOfWeek}</div>
                      <div style={{ fontSize:15, fontWeight:900, color:d.isToday ? d.phaseColor : d.isExamDay ? '#0056D2' : C.navy, lineHeight:1 }}>{d.dayNum}</div>
                      <div style={{ fontSize:9, color:C.muted }}>{d.monthLabel}</div>
                    </div>
                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:d.topics.length ? 4 : 0 }}>
                        <span style={{ fontSize:12 }}>{d.phaseIcon}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:d.isExamDay ? '#0056D2' : d.phaseColor }}>{d.phaseLabel}</span>
                        {d.isToday && <span style={{ fontSize:8, fontWeight:800, color:d.phaseColor, background:`${d.phaseColor}20`, borderRadius:20, padding:'1px 6px' }}>TODAY</span>}
                      </div>
                      {d.topics.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {d.topics.map(t => (
                            <button
                              key={t.topic}
                              onClick={() => navigate(`/${activeTrack}/quiz/${t.subjectId}?topic=${encodeURIComponent(t.topic)}`)}
                              style={{ fontSize:10, fontWeight:700, color:d.phaseColor, background:`${d.phaseColor}12`, border:`1px solid ${d.phaseColor}30`, borderRadius:20, padding:'2px 8px', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                            >
                              {t.emoji} {t.topic} {t.pct < 50 ? '🔴' : t.pct < 70 ? '🟡' : '🟢'} {t.pct}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Plan helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
}

function buildSchedule(days, weakTopics, subjects) {
  if (!days || days <= 0) return []
  const phases = []
  if (days >= 21) {
    const drilling = Math.round(days * 0.6)
    const mixed    = Math.round(days * 0.3)
    const mock     = days - drilling - mixed
    phases.push({ phase:'Phase 1 — Targeted Drilling', duration:`${drilling} days`, icon:'🎯', color:'#EF4444', goal:'Eliminate weak spots', description:'Focus exclusively on your lowest-scoring topics. Short, intensive sessions of 15–20 questions.', subjects:weakTopics.slice(0,3).map(t => t.topic) })
    phases.push({ phase:'Phase 2 — Mixed Practice',    duration:`${mixed} days`,    icon:'🔄', color:'#F59E0B', goal:'Build fluency',       description:'Rotate through all subjects. Aim for at least one session per subject per week.',          subjects:subjects.map(s => s.label) })
    phases.push({ phase:'Phase 3 — Mock Exams',        duration:`${mock} day${mock===1?'':'s'}`, icon:'📋', color:'#10B981', goal:'Simulate exam conditions', description:'Take full timed mock papers. Review every wrong answer immediately after.',   subjects:['Full timed mock papers'] })
  } else if (days >= 7) {
    const drilling = Math.round(days * 0.5)
    const mock     = days - drilling
    phases.push({ phase:'Intensive Revision', duration:`${drilling} days`,            icon:'🎯', color:'#EF4444', goal:'Drill weak areas', description:'You have limited time — hit your weakest topics every day.', subjects:weakTopics.slice(0,3).map(t => t.topic) })
    phases.push({ phase:'Mock & Review',      duration:`${mock} day${mock===1?'':'s'}`, icon:'📋', color:'#10B981', goal:'Exam simulation',  description:'One full mock per day. Review wrong answers immediately.',   subjects:['Full timed mock papers'] })
  } else {
    phases.push({ phase:'Final Sprint', duration:`${days} day${days===1?'':'s'}`, icon:'🚀', color:'#F59E0B', goal:'Consolidate', description:"Light review of your best topics — don't cram new material. Stay calm.", subjects:weakTopics.slice(0,2).map(t => t.topic) })
  }
  return phases
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange, C }) {
  return (
    <div style={{
      display:'flex', gap:4,
      background:'#F1F5F9', borderRadius:14,
      padding:4, marginBottom:20,
    }}>
      {[
        { id:'today',    label:'Today',    icon:'🎯' },
        { id:'progress', label:'Progress', icon:'📈' },
        { id:'plan',     label:'Study Plan', icon:'📅' },
      ].map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            padding:'9px 0',
            background: active===t.id ? 'white' : 'transparent',
            border:'none',
            borderRadius:10,
            fontSize:12, fontWeight: active===t.id ? 800 : 600,
            color: active===t.id ? C.primary : '#94A3B8',
            cursor:'pointer',
            fontFamily:'Inter,sans-serif',
            boxShadow: active===t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition:'all 0.18s ease',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          <span style={{ fontSize:14 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LearnHubPage({ user, profile, isDark, signOut }) {
  const { stream }             = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate               = useNavigate()
  const { isDesktop, isTablet } = useBreakpoint()

  const enrolledStreams = profile?.streams?.length ? profile.streams : profile?.stream ? [profile.stream] : [stream]

  // Active track — can be switched independently of URL
  const [activeTrack, setActiveTrackState] = useState(() => {
    const saved = sessionStorage.getItem('nx_learnhub_track')
    if (saved && enrolledStreams.includes(saved)) return saved
    return enrolledStreams.includes(stream) ? stream : (enrolledStreams[0] ?? stream)
  })

  function setActiveTrack(t) {
    setActiveTrackState(t)
    sessionStorage.setItem('nx_learnhub_track', t)
    navigate(`/${t}/learn-hub`, { replace: true })
  }

  const C   = getColors(activeTrack, null, isDark)
  const cfg = STREAM_CONFIG[activeTrack]

  const validTabs = ['today','progress','plan']
  const initialTab = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'today'
  const [tab,      setTab]      = useState(initialTab)
  const [topics,   setTopics]   = useState([])
  const [weekly,   setWeekly]   = useState([])
  const [loading,  setLoading]  = useState(true)

  // Notes — all notes, filtered by active track for display
  const [allNotes,      setAllNotes]      = useState(() => getNotes())
  const [expandedNote,  setExpandedNote]  = useState(null)
  const [notesCopyDone, setNotesCopyDone] = useState(false)
  const trackNotes = allNotes.filter(n => n.stream === activeTrack)

  // Plan state
  const [examDates,   setExamDates]   = useState({})
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput,   setDateInput]   = useState('')
  const [dateError,   setDateError]   = useState(null)
  const [dateSaving,  setDateSaving]  = useState(false)

  const examDate = examDates[activeTrack] ?? profile?.exam_date ?? null
  const days  = daysUntil(examDate)
  const rawRec = dailyRec(days)

  // De-stress Target Adjuster — reads stress index from localStorage (set by sandbox)
  const sandboxStress = (() => {
    try { return parseInt(localStorage.getItem(`nx_sandbox_stress_${user?.id}`) ?? '0', 10) } catch { return 0 }
  })()
  const stressMode = sandboxStress > 8
  const rec = stressMode
    ? { sessions: Math.max(1, Math.round(rawRec.sessions * 0.5)), minutes: rawRec.minutes }
    : rawRec
  const xp    = profile?.xp    ?? 0
  const streak = profile?.streak ?? 0
  const level  = Math.floor(xp / 150) + 1

  // Reset data when active track changes
  useEffect(() => {
    setTopics([]); setWeekly([]); setLoading(true)
    setEditingDate(false); setDateError(null)
  }, [activeTrack])

  const srsData = useMemo(() => {
    if (!cfg) return []
    return cfg.subjects
      .map(s => ({ ...s, dueCount: getDueCount(getQuestions(activeTrack, s.id)) }))
      .filter(s => s.dueCount > 0)
  }, [activeTrack, cfg])
  const totalDue = srsData.reduce((n,s) => n + s.dueCount, 0)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const timeout = new Promise(resolve => setTimeout(() => resolve([{data:[]},{data:[]}]), 8000))
    Promise.race([
      Promise.all([getTopicStats(user.id, activeTrack), getWeeklyActivity(user.id)]),
      timeout,
    ]).then(([tRes, aRes]) => {
      const map = {}
      ;(tRes.data ?? []).forEach(a => {
        if (!map[a.topic]) map[a.topic] = { correct:0, total:0 }
        map[a.topic].total++
        if (a.is_correct) map[a.topic].correct++
      })
      const list = Object.entries(map).map(([topic, v]) => {
        let subjectId = cfg.subjects[0].id
        let emoji     = cfg.subjects[0].emoji
        for (const s of cfg.subjects) {
          if (getQuestions(activeTrack, s.id).some(q => q.topic === topic)) {
            subjectId = s.id; emoji = s.emoji; break
          }
        }
        return { topic, pct: Math.round((v.correct/v.total)*100), total:v.total, subjectId, emoji }
      }).sort((a,b) => a.pct - b.pct)
      setTopics(list)
      setWeekly(aRes.data ?? [])
      // Check for newly unlocked certificates after stats load
      checkAndUnlockCertificates(profile, list, cfg.subjects).catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.id, activeTrack])

  // Load per-track exam dates
  useEffect(() => {
    if (!user?.id) return
    getExamDates(user.id).then(({ data }) => { if (data) setExamDates(data) })
  }, [user?.id])

  // Keep dateInput in sync with selected track's exam date
  useEffect(() => {
    setDateInput(examDates[activeTrack] ?? profile?.exam_date ?? '')
    setEditingDate(false); setDateError(null)
  }, [activeTrack, examDates])

  if (!cfg) { navigate('/'); return null }

  async function savePlanDate(date) {
    if (!date) { setDateError('Please select a date.'); return }
    setDateError(null); setDateSaving(true)
    try {
      const { error } = await setExamDate(user.id, activeTrack, date)
      if (error) throw error
      setExamDates(prev => ({ ...prev, [activeTrack]: date }))
      setEditingDate(false)
    } catch (e) {
      setDateError(`Could not save — ${e?.message ?? 'please try again.'}`)
    } finally { setDateSaving(false) }
  }

  function subjectForTopic(topic) {
    for (const s of cfg.subjects) {
      if (getQuestions(activeTrack, s.id).some(q => q.topic === topic)) return s
    }
    return cfg.subjects[0]
  }

  // Heatmap
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const heatmap = dayLabels.map((label, i) => {
    const date  = new Date(Date.now() - (6-i)*86400000).toISOString().split('T')[0]
    const found = weekly.find(w => w.date === date)
    return { label, sessions: found?.sessions ?? 0 }
  })
  const maxSessions = Math.max(...heatmap.map(h => h.sessions), 1)

  const today             = new Date().toISOString().split('T')[0]
  const yesterday         = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const studiedToday      = weekly.some(a => a.date === today)
  const weakTopics        = topics.filter(t => t.pct < 70).slice(0, 3)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? 'Scholar'

  // ── Hero ────────────────────────────────────────────────────────────────────
  const multiTrack = enrolledStreams.length > 1 && getEffectivePlan(profile) !== 'free'

  const heroEl = isDesktop && multiTrack ? (
    /* Desktop bookmark-tab hero */
    <div style={{ display:'flex', flexDirection:'column' }}>
      {/* Top strip: page label + stats + actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.7)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Learn Hub</span>
          {days !== null && days > 0 && (
            <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.9)', background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'2px 8px' }}>
              {days}d to exam
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {[{ icon:'🔥', val:streak },{ icon:'⚡', val:xp },{ icon:'🎓', val:level }].map(s => (
              <div key={s.icon} style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'3px 8px' }}>
                <span style={{ fontSize:11 }}>{s.icon}</span>
                <span style={{ fontSize:11, fontWeight:800, color:'white' }}>{s.val}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {user?.email && (
              <button onClick={() => { signOut?.(); navigate('/') }} title="Sign Out"
                style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="white" strokeWidth={2} strokeLinecap="round"/></svg>
              </button>
            )}
            <button onClick={() => navigate(`/${activeTrack}/settings?contact=1`)} title="Contact Us"
              style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => navigate('/landing')} title="Manage tracks"
              style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/></svg>
            </button>
          </div>
        </div>
      </div>
      {/* Bookmark tabs */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:0, padding:'8px 20px 0', overflowX:'auto', scrollbarWidth:'none' }}>
        {enrolledStreams.map(s => {
          const sc     = STREAM_CONFIG[s]
          const active = s === activeTrack
          const accent = TRACK_COLORS[s] ?? COURSERA_BLUE
          return (
            <button key={s} onClick={() => setActiveTrack(s)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px 10px', marginRight:2, background: active ? 'white' : 'rgba(255,255,255,0.12)', border: active ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius:'10px 10px 0 0', cursor: active ? 'default' : 'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent', transition:'all 0.15s' }}>
              <div style={{ width:8, height:8, borderRadius:4, background: active ? accent : 'rgba(255,255,255,0.6)', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight: active ? 800 : 600, color: active ? accent : 'rgba(255,255,255,0.85)', whiteSpace:'nowrap' }}>
                {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
              </span>
              {active && <span style={{ fontSize:7, color:accent }}>●</span>}
            </button>
          )
        })}
      </div>
    </div>
  ) : (
    /* Mobile / single-track hero */
    <div style={{ padding:'max(14px, env(safe-area-inset-top, 14px)) 16px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
          <div style={{ fontSize:16, fontWeight:900, color:'white', letterSpacing:'-0.3px' }}>
            {cfg?.label?.replace(' Track','').replace(' Prep','') ?? activeTrack.toUpperCase()}
          </div>
          {days !== null && days > 0 && (
            <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.9)', background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>
              {days}d
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          <button onClick={() => navigate('/landing')} title="Manage tracks"
            style={{ width:32, height:32, borderRadius:9, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/></svg>
          </button>
          {user?.email && (
            <button onClick={() => { signOut?.(); navigate('/') }} title="Sign Out"
              style={{ width:32, height:32, borderRadius:9, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="white" strokeWidth={2} strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
      </div>
      {multiTrack && (
        <div style={{ display:'flex', gap:5, marginTop:10, flexWrap:'wrap' }}>
          {enrolledStreams.map(s => {
            const sc = STREAM_CONFIG[s]; const accent = TRACK_COLORS[s] ?? COURSERA_BLUE; const active = s === activeTrack
            return (
              <button key={s} onClick={() => setActiveTrack(s)}
                style={{ display:'flex', alignItems:'center', gap:4, background: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.18)', border:`1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.3)'}`, borderRadius:20, padding:'4px 10px', fontSize:10, fontWeight:800, color: active ? accent : 'white', cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent', transition:'all 0.15s' }}>
                {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
                {active && <span style={{ fontSize:7, marginLeft:1 }}>●</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Content panels ──────────────────────────────────────────────────────────

  const todayPanel = (
    <div>
      {/* De-stress interceptor warning */}
      {stressMode && (
        <div style={{ background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)', border:'1.5px solid #F59E0B50', borderRadius:14, padding:'12px 14px', marginBottom:12, display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>⚡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#92400E', marginBottom:2 }}>De-stress Mode Active</div>
            <div style={{ fontSize:11, color:'#B45309', lineHeight:1.5 }}>Stress index {sandboxStress}/10. Daily target reduced to protect your wellbeing.</div>
          </div>
        </div>
      )}
      <DailyChallengeCard stream={activeTrack} subjects={cfg.subjects} C={C} navigate={navigate} />
      <GoalCard rec={rec} days={days} studiedToday={studiedToday} C={C} />
      {/* Schedule-aware today card */}
      {examDate && days > 0 && (() => {
        const tp = getDayPlan(topics, examDate)
        if (!tp || !tp.todayTopics.length) return null
        return (
          <div style={{ marginBottom:12, background:'white', border:`1.5px solid ${tp.phaseColor}40`, borderRadius:14, padding:'12px 14px', boxShadow:'0 1px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:11, fontWeight:800, color:tp.phaseColor, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>
              {tp.phaseIcon} {tp.phaseLabel} — Day {tp.dayOfPlan + 1} of {tp.totalDays}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {tp.todayTopics.map(t => (
                <button key={t.topic} onClick={() => navigate(`/${activeTrack}/quiz/${t.subjectId}?topic=${encodeURIComponent(t.topic)}`)}
                  style={{ display:'flex', alignItems:'center', gap:10, background:'white', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 12px', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left', WebkitTapHighlightColor:'transparent' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{t.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#1E293B' }}>{t.topic}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{t.pct}% accuracy</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:tp.phaseColor, flexShrink:0 }}>Start →</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}
      <PriorityDrillCard topics={weakTopics} stream={activeTrack} C={C} navigate={navigate} />
      {!loading && !weakTopics.length && (
        <div style={{ marginBottom:12, background:'#F0FDF4', border:'1px solid #10B98130', borderRadius:16, padding:'14px 18px' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#065F46' }}>Strong across the board! 🎉</div>
          <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>No weak spots — keep drilling to maintain your scores.</div>
        </div>
      )}
      <SrsDueCard srsData={srsData} totalDue={totalDue} stream={activeTrack} C={C} navigate={navigate} />
      <BrainBreakRow stream={activeTrack} C={C} navigate={navigate} />
      <QuickStartGrid
        subjects={cfg.subjects} stream={activeTrack} C={C}
        cols={isDesktop ? 3 : isTablet ? 3 : 2}
      />
    </div>
  )

  const progressPanel = (
    <div>
      {activeTrack === 'igcse' && (
        <div style={{ marginBottom:12 }}>
          <IGCSEGradeToggle C={C} />
        </div>
      )}
      <StatStrip streak={streak} xp={xp} level={level} C={C} />
      <WeeklyHeatmap heatmap={heatmap} maxSessions={maxSessions} loading={loading} C={C} />
      <SubjectMasteryStrip streams={[activeTrack]} C={C} navigate={navigate} activeTrack={activeTrack} />

      {/* Combined Topics Card — grouped by subject, replaces old flat TopicBar list */}
      <Card C={C} style={{ marginBottom:12 }}>
        <SH label={['sat','act','ap','psat'].includes(activeTrack) ? 'Topic Performance' : 'My Topics'} C={C} />
        {loading ? <Skeleton C={C} height={120} /> : topics.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:C.muted, fontSize:12 }}>
            Complete a few quiz sessions to see your topic breakdown.
          </div>
        ) : (
          groupTopicsBySubject(topics, cfg).map(subj => (
            <div key={subj.subjectId} style={{ marginBottom:16 }}>
              {/* Subject header */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>{subj.emoji}</span>
                <span style={{ fontSize:12, fontWeight:800, color:C.navy }}>{subj.label}</span>
                <div style={{ flex:1, height:1, background:C.border }} />
                <span style={{ fontSize:11, fontWeight:700,
                  color: subj.avgPct >= 75 ? '#10B981' : subj.avgPct >= 50 ? '#F59E0B' : '#EF4444'
                }}>{subj.avgPct}% avg</span>
              </div>
              {/* Topics within subject */}
              {subj.topics.map(t => (
                <div key={t.topic} style={{ marginBottom:8, paddingLeft:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:C.navy, flex:1, marginRight:8 }}>{t.topic}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {t.pct < 70 && (
                        <button
                          onClick={() => navigate(`/${activeTrack}/quiz/${t.subjectId}?topic=${encodeURIComponent(t.topic)}`)}
                          style={{ background:'#EF444418', border:'1px solid #EF444440', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700, color:'#EF4444', cursor:'pointer' }}
                        >Drill</button>
                      )}
                      <span style={{ fontSize:12, fontWeight:700, minWidth:32, textAlign:'right',
                        color: t.pct >= 75 ? '#10B981' : t.pct >= 50 ? '#F59E0B' : '#EF4444'
                      }}>{t.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:4, background:C.border, borderRadius:999, overflow:'hidden' }}>
                    <div style={{ width:`${t.pct}%`, height:'100%', borderRadius:999,
                      background: t.pct >= 75 ? '#10B981' : t.pct >= 50 ? '#F59E0B' : '#EF4444',
                      transition:'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </Card>

      <div style={{ padding:'14px 16px', background:`${C.primary}12`, border:`1.5px solid ${C.primary}28`, borderRadius:14, fontSize:13, color:C.primary, lineHeight:1.5, marginBottom:12 }}>
        🏫 <strong>Share with your teacher</strong> — ask them about Nexora School Edition for the whole class!
      </div>

      {/* AI Notes — filtered to active track */}
      {/* Moved to Study Plan panel */}

      {/* IBPointsCalculator — moved to Study Plan panel */}
    </div>
  )

  // ── Plan panel ────────────────────────────────────────────────────────────
  const allWeak    = topics.filter(t => t.pct < 70)
  const allStrong  = topics.filter(t => t.pct >= 70)
  const avgAccuracy = topics.length ? Math.round(topics.reduce((s,t) => s+t.pct,0)/topics.length) : null
  const schedule   = buildSchedule(days, allWeak, cfg.subjects)
  const readinessColor = avgAccuracy == null ? C.muted : avgAccuracy >= 75 ? '#10B981' : avgAccuracy >= 50 ? '#F59E0B' : '#EF4444'
  const readinessLabel = avgAccuracy == null ? 'Not enough data yet' : avgAccuracy >= 75 ? 'On Track' : avgAccuracy >= 50 ? 'Needs Work' : 'At Risk'

  // Exam date card — only for the active track
  const examDatesCard = (
    <Card C={C} style={{ marginBottom:12 }}>
      <SH label="Exam Date" C={C} />
      {(() => {
        const s       = activeTrack
        const sc      = STREAM_CONFIG[s]
        const accent  = TRACK_COLORS[s] ?? C.primary
        const dateVal = examDates[s] ?? ''
        const dl      = dateVal ? Math.max(0, Math.ceil((new Date(dateVal) - new Date()) / 86400000)) : null
        return (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:4, background:accent, flexShrink:0 }} />
              <div style={{ fontSize:12, fontWeight:800, color:C.navy }}>
                {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
              </div>
              {dl !== null && dl <= 30 && (
                <span style={{ fontSize:10, fontWeight:800, color: dl <= 7 ? '#EF4444' : '#F59E0B', background: dl <= 7 ? '#FEF2F2' : '#FFFBEB', borderRadius:20, padding:'1px 8px' }}>
                  {dl === 0 ? 'Today!' : `${dl}d`}
                </span>
              )}
            </div>
            <input
              type="date"
              value={dateVal}
              onChange={async e => {
                const date = e.target.value
                setExamDates(prev => ({ ...prev, [s]: date }))
                if (user?.id) {
                  try { await setExamDate(user.id, s, date) } catch {}
                }
              }}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:10,
                border:`1.5px solid ${dateVal ? accent+'60' : C.border}`,
                fontSize:13, fontWeight:600, color:C.navy,
                background: dateVal ? `${accent}08` : C.card,
                cursor:'pointer', outline:'none', boxSizing:'border-box',
              }}
            />
            {dl !== null && (
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1, background:C.border, borderRadius:6, height:4, overflow:'hidden' }}>
                  <div style={{
                    width:`${Math.min(100, Math.max(2, 100 - (dl / 365 * 100)))}%`,
                    height:'100%', borderRadius:6,
                    background: dl <= 7 ? '#EF4444' : dl <= 30 ? '#F59E0B' : accent,
                    transition:'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color: dl <= 7 ? '#EF4444' : dl <= 30 ? '#F59E0B' : accent, flexShrink:0 }}>
                  {dl > 0 ? `${dl} day${dl===1?'':'s'}` : 'Exam day!'}
                </span>
              </div>
            )}
            {/* Hint to check official dates */}
            <button
              onClick={() => navigate(`/${activeTrack}/resources`)}
              style={{
                marginTop:10, width:'100%', display:'flex', alignItems:'center', gap:8,
                background:`${accent}08`, border:`1px solid ${accent}25`,
                borderRadius:9, padding:'8px 12px', cursor:'pointer',
                fontFamily:'Inter,sans-serif', textAlign:'left',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              <span style={{ fontSize:14, flexShrink:0 }}>📅</span>
              <span style={{ fontSize:11, color:C.navy, lineHeight:1.4 }}>
                <strong>Not sure of your date?</strong> Check official exam dates in the{' '}
                <span style={{ color:accent, fontWeight:700 }}>Resources tab</span>.
              </span>
            </button>
          </div>
        )
      })()}
    </Card>
  )

  const planPanel = (
    <div>
      {/* IB Survival Sandbox — first item in Study Plan for IB users */}
      {activeTrack === 'ib' && import.meta.env.VITE_IB_SANDBOX_ENABLED === 'true' && (
        <button onClick={() => navigate('/ib/sandbox')}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:12, background:'linear-gradient(135deg,rgba(91,33,182,0.10),rgba(91,33,182,0.06))', border:'1.5px solid rgba(91,33,182,0.3)', borderRadius:14, padding:'14px 16px', cursor:'pointer', marginBottom:14, fontFamily:'Inter,sans-serif', textAlign:'left', WebkitTapHighlightColor:'transparent' }}>
          <div style={{ width:40, height:40, borderRadius:11, background:'#5B21B6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🧪</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#5B21B6', letterSpacing:'-0.2px' }}>IB Survival Sandbox</div>
            <div style={{ fontSize:11, color:'#7C3AED', marginTop:2, opacity:0.8 }}>IA blueprinting · CAS linker · Deadline tracker</div>
          </div>
          <span style={{ fontSize:18, color:'#5B21B6' }}>›</span>
        </button>
      )}
      {examDatesCard}

      {/* Readiness ring */}
      {!loading && topics.length > 0 && (
        <Card C={C} style={{ marginBottom:12, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', flexShrink:0, background:`conic-gradient(${readinessColor} ${avgAccuracy}%, ${C.border} 0)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 3px white, 0 0 0 5px ${readinessColor}30` }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:13, fontWeight:900, color:readinessColor }}>{avgAccuracy}%</div>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:readinessColor, marginBottom:3 }}>{readinessLabel}</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
              {allWeak.length === 0 ? 'All topics above 70% — focus on mock practice.' : `${allWeak.length} topic${allWeak.length>1?'s':''} below 70% need attention.`}
            </div>
            {days != null && days > 0 && (
              <div style={{ marginTop:5, fontSize:11, color:C.muted }}>
                Aim for <strong style={{ color:C.primary }}>{rec.sessions} session{rec.sessions>1?'s':''}/day</strong> · {rec.minutes} min each
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Date-aware week calendar — all weeks, collapsible */}
      {!loading && examDate && days > 0 && (() => {
        // When no quiz data yet, use subjects as fallback topics (treat all as needing work)
        const calendarTopics = topics.length > 0
          ? topics
          : cfg.subjects.filter(s => !s.deprecated).map(s => ({
              topic: s.label, subjectId: s.id, emoji: s.emoji, pct: 0, total: 0,
            }))
        const weeks = getWeekCalendar(calendarTopics, examDate)
        return (
          <div style={{ marginBottom:12 }}>
            <SH label={`Study Calendar — ${days} days to exam`} C={C} />
            <WeekCalendar weeks={weeks} C={C} navigate={navigate} activeTrack={activeTrack} />
          </div>
        )
      })()}

      {/* Generic phase schedule when no performance data */}
      {!loading && topics.length === 0 && examDate && days > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:`${C.primary}10`, border:`1.5px solid ${C.primary}30`, borderRadius:14, padding:'12px 14px', marginBottom:12 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🤖</span>
            <div style={{ fontSize:12, color:C.navy, lineHeight:1.6 }}>
              <strong>Generic plan</strong> — based on your exam date only. Refines as you practice.
            </div>
          </div>
          <SH label="Suggested Study Schedule" C={C} />
          <Card C={C} style={{ padding:'14px 16px', marginBottom:12 }}>
            {buildSchedule(days, [], cfg.subjects).map((phase, i, arr) => (
              <div key={i} style={{ display:'flex', gap:0, position:'relative' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:32, flexShrink:0 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:`${phase.color}20`, border:`2px solid ${phase.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, zIndex:1 }}>{phase.icon}</div>
                  {i < arr.length-1 && <div style={{ width:2, flex:1, background:C.border, minHeight:20, marginTop:4 }} />}
                </div>
                <div style={{ flex:1, paddingBottom:i<arr.length-1?18:0, paddingLeft:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:C.navy }}>{phase.phase}</div>
                    <div style={{ fontSize:10, color:phase.color, fontWeight:700, background:`${phase.color}18`, borderRadius:6, padding:'2px 8px' }}>{phase.duration}</div>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{phase.description}</div>
                </div>
              </div>
            ))}
          </Card>
          <div style={{ marginBottom:12 }}>
            <SH label={`${cfg.subjects.filter(s => !s.deprecated).length} Subjects to Cover`} C={C} />
            <Card C={C} style={{ marginBottom:12 }}>
              {cfg.subjects.filter(s => !s.deprecated).map(s => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:`${C.primary}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{s.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{s.label}</div>
                  </div>
                  <button onClick={() => navigate(`/${activeTrack}/quiz/${s.id}`)} style={{ background:`${C.primary}15`, border:`1px solid ${C.primary}30`, color:C.primary, borderRadius:8, padding:'5px 11px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Start →</button>
                </div>
              ))}
            </Card>
          </div>
          <button onClick={() => setTab('today')} style={{ width:'100%', padding:'12px 0', background:C.primary, color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif', marginBottom:12 }}>
            🎯 Start practising to unlock your personalised plan
          </button>
        </div>
      )}

      {/* No exam date set */}
      {!examDate && topics.length === 0 && (
        <Card C={C} style={{ textAlign:'center', padding:'24px' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
          <div style={{ fontWeight:800, color:C.navy, fontSize:14, marginBottom:6 }}>Set an exam date to get started</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:14 }}>Add your exam date above and complete a few quiz sessions — your personalised plan will appear here.</div>
          <button onClick={() => setTab('today')} style={{ background:C.primary, color:'white', border:'none', borderRadius:12, padding:'10px 22px', fontWeight:700, cursor:'pointer', fontSize:13 }}>Go to Today →</button>
        </Card>
      )}

      {days != null && days > 0 && days <= 30 && topics.length > 0 && (
        <button onClick={() => navigate(`/${activeTrack}/mock/${cfg.subjects[0].id}`)} style={{ width:'100%', background:`linear-gradient(135deg,${C.primary},${C.primary}BB)`, color:'white', border:'none', borderRadius:14, padding:'13px', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${C.primary}40`, marginTop:4 }}>
          📋 Take a Full Mock Exam
        </button>
      )}

      {/* IB Projected Score — IB track only */}
      {activeTrack === 'ib' && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Projected IB Score</div>
          <IBPointsCalculator topicStats={topics} C={C} />
        </div>
      )}

      {/* AI Notes — all tracks */}
      <div style={{ marginTop:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            My AI Notes · {trackNotes.length}/{NOTES_MAX}
          </div>
          {trackNotes.length > 0 && (
            <button
              onClick={() => { navigator.clipboard.writeText(exportNotesText(trackNotes)).then(() => { setNotesCopyDone(true); setTimeout(() => setNotesCopyDone(false), 2000) }) }}
              style={{ background: notesCopyDone ? '#DCFCE7' : 'transparent', border:`1px solid ${notesCopyDone ? '#16A34A40' : '#7C3AED30'}`, borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, color: notesCopyDone ? '#16A34A' : '#7C3AED', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            >
              {notesCopyDone ? '✓ Copied' : '📋 Copy All'}
            </button>
          )}
        </div>
        {trackNotes.length === 0 ? (
          <Card C={C} style={{ textAlign:'center', padding:'24px' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📝</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:4 }}>No notes for this track yet</div>
            <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>After the AI tutor explains a question, tap <strong style={{ color:'#7C3AED' }}>✦ Save</strong> to add it here.</div>
          </Card>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {trackNotes.map(note => {
              const savedDate = new Date(note.savedAt).toLocaleDateString('en-GB', {day:'numeric', month:'short'})
              const expanded  = expandedNote === note.id
              return (
                <div key={note.id} style={{ background:'white', border:`1px solid ${C.border}`, borderLeft:'3px solid #7C3AED', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px 10px', display:'flex', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6, alignItems:'center' }}>
                        <span style={{ background:'#7C3AED12', border:'1px solid #7C3AED25', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#7C3AED' }}>{note.topic || note.subject || 'Note'}</span>
                        <span style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600 }}>{savedDate}</span>
                      </div>
                      <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:0, lineHeight:1.55, ...(!expanded ? { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } : {}) }}>
                        {note.question}
                      </p>
                    </div>
                    <button onClick={() => { deleteNote(note.id); setAllNotes(getNotes()) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', fontSize:18, padding:'0 2px', flexShrink:0, lineHeight:1 }}>×</button>
                  </div>
                  <button onClick={() => setExpandedNote(p => p === note.id ? null : note.id)} style={{ width:'100%', background:C.bg, border:'none', borderTop:`1px solid ${C.border}`, padding:'7px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontSize:11, fontWeight:700, color:'#7C3AED', fontFamily:'Inter,sans-serif' }}>
                    <span>{expanded ? 'Hide explanation' : 'Show AI explanation'}</span>
                    <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
                  </button>
                  {expanded && (
                    <div style={{ padding:'12px 14px 14px', borderTop:`1px solid ${C.border}`, background:C.bg, fontSize:12, color:C.muted, lineHeight:1.75 }}>
                      {note.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )


  // ── Desktop: 3-column ─────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <Shell C={C} isDark={isDark} heroContent={heroEl} contentMax={1300} noHomeBtn>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, alignItems:'start', paddingTop:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.navy, letterSpacing:'-0.2px', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>🎯 Today</div>
            {todayPanel}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.navy, letterSpacing:'-0.2px', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>📈 Progress</div>
            {progressPanel}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.navy, letterSpacing:'-0.2px', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>📅 Study Plan</div>
            {planPanel}
          </div>
        </div>
      </Shell>
    )
  }

  // ── Mobile/Tablet: tabbed ──────────────────────────────────────────────────
  return (
    <Shell C={C} isDark={isDark} heroContent={heroEl} noHomeBtn>
      <TabBar active={tab} onChange={t => { setTab(t); setSearchParams(t!=='today'?{tab:t}:{}) }} C={C} />
      {tab === 'today' ? todayPanel : tab === 'progress' ? progressPanel : planPanel}
    </Shell>
  )
}
