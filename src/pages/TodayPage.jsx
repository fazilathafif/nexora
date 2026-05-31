/**
 * TodayPage — personalised daily action center.
 * Route: /:stream/today
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopicStats, getWeeklyActivity, addXp, updateProfile } from '../lib/db.js'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { getDueCount } from '../lib/srs.js'
import { getColors, Shell } from './HomePage.jsx'
import { useBreakpoint } from '../hooks/useBreakpoint.js'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

function dailyRec(days) {
  if (!days || days <= 0) return { sessions: 2, minutes: 20 }
  if (days > 60) return { sessions: 1, minutes: 20 }
  if (days > 30) return { sessions: 2, minutes: 25 }
  if (days > 14) return { sessions: 2, minutes: 30 }
  if (days > 7)  return { sessions: 3, minutes: 30 }
  return { sessions: 4, minutes: 20 }
}

function getTodayStr() { return new Date().toISOString().split('T')[0] }

function readDailyChallenge(stream) {
  try {
    const raw = localStorage.getItem(`nx_daily_${stream}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.date === getTodayStr() ? data : null
  } catch { return null }
}

function getDailySubject(subjects) {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime()
  const dayOfYear = Math.floor((Date.now() - start) / 86400000)
  return subjects[dayOfYear % subjects.length]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ label, C }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
      {label}
    </div>
  )
}

function DailyChallengeCard({ stream, subjects, C, dark, navigate }) {
  const data       = readDailyChallenge(stream)
  const completed  = !!data
  const subject    = getDailySubject(subjects)

  function handleStart() {
    navigate(`/${stream}/quiz/${subject.id}?daily=1`)
  }

  return (
    <div style={{
      marginBottom: 14,
      background: completed
        ? 'linear-gradient(135deg,#DCFCE7,#F0FDF4)'
        : `linear-gradient(135deg,${C.primary}15,${C.primary}08)`,
      border: `1.5px solid ${completed ? '#10B98140' : C.primary + '40'}`,
      borderRadius: 18, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 13, flexShrink: 0,
        background: completed ? '#10B98120' : `${C.primary}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {completed ? '✅' : '🎯'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: completed ? '#065F46' : C.navy, letterSpacing: '-0.2px' }}>
          Daily Challenge
        </div>
        <div style={{ fontSize: 12, color: completed ? '#059669' : C.muted, marginTop: 2 }}>
          {completed
            ? `Completed · ${data.score}/${data.total} correct — come back tomorrow!`
            : `Today's subject: ${subject.emoji} ${subject.label} · 10 questions`
          }
        </div>
      </div>
      {!completed && (
        <button
          onClick={handleStart}
          style={{
            background: `linear-gradient(135deg,${C.primary},${C.secondary ?? C.primary})`,
            color: 'white', border: 'none', borderRadius: 11,
            padding: '9px 16px', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0,
          }}
        >
          Start →
        </button>
      )}
    </div>
  )
}

function BrainBreakRow({ stream, C, navigate }) {
  return (
    <button
      onClick={() => navigate(`/${stream}/wellbeing`)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        background: 'white', border: `1.5px solid ${C.border}`,
        borderRadius: 14, padding: '12px 16px', marginBottom: 14,
        cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: '#A7F3D015', border: '1px solid #10B98130',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>🧘</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Brain Break</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Box breathing & coming soon: music, tips</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function StreakShieldCard({ user, profile, C, onShieldUsed }) {
  const [used, setUsed] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleUse() {
    setSaving(true)
    try {
      await addXp(user.id, -50)
      await updateProfile(user.id, { streak: profile.streak })
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`nx_shield_used_${today}`, '1')
      setUsed(true)
      onShieldUsed?.()
    } catch {
      // silent fail — streak preserved locally
      setUsed(true)
    } finally { setSaving(false) }
  }

  if (used) return (
    <div style={{
      marginBottom: 14, background: '#F0FDF4', border: '1.5px solid #10B98140',
      borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 22 }}>🛡️</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>Streak protected!</div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>50 XP spent · keep going tomorrow</div>
      </div>
    </div>
  )

  return (
    <div style={{
      marginBottom: 14,
      background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)',
      border: '1.5px solid #F59E0B40',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: '#F59E0B20',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>🛡️</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E' }}>Streak at risk!</div>
        <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
          Spend 50 XP to protect your {profile.streak}-day streak
        </div>
      </div>
      <button
        onClick={handleUse}
        disabled={saving}
        style={{
          background: saving ? '#E2E8F0' : '#F59E0B',
          color: saving ? '#94A3B8' : 'white',
          border: 'none', borderRadius: 10,
          padding: '8px 14px', fontSize: 12, fontWeight: 800,
          cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Inter,sans-serif', flexShrink: 0,
        }}
      >
        {saving ? '…' : 'Use Shield'}
      </button>
    </div>
  )
}

function Card({ children, C, accent, style }) {
  return (
    <div style={{
      background: 'white', border: `1.5px solid ${accent ? accent + '30' : C.border}`,
      borderRadius: 18, padding: '16px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function GoalCard({ rec, days, studiedToday, C }) {
  const urgency = days !== null && days <= 7 ? '#EF4444' : days !== null && days <= 30 ? '#F59E0B' : C.primary
  return (
    <Card C={C} accent={urgency} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {/* Sessions */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: urgency }}>{rec.sessions}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 3 }}>
            session{rec.sessions > 1 ? 's' : ''}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: C.border, margin: '4px 16px', flexShrink: 0 }} />

        {/* Minutes */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: urgency }}>{rec.minutes}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 3 }}>mins each</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: C.border, margin: '4px 16px', flexShrink: 0 }} />

        {/* Label */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: urgency }}>
            {days !== null && days > 0
              ? `${days} day${days === 1 ? '' : 's'} to go`
              : days === 0
                ? 'Exam day! 🎯'
                : 'Keep going'}
          </div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
            {days !== null && days > 0
              ? 'Based on your exam date'
              : 'Set exam date in Plan tab'}
          </div>
        </div>
      </div>

      {!studiedToday && (
        <div style={{
          marginTop: 12, padding: '9px 12px',
          background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)',
          border: '1px solid #F59E0B40', borderRadius: 11,
          fontSize: 12, color: '#92400E', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🔥</span>
          <span>Start a session today to keep your streak alive!</span>
        </div>
      )}
    </Card>
  )
}

function PriorityDrillCard({ topics, stream, C, navigate }) {
  if (!topics.length) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading label="Priority Drill" C={C} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topics.map(t => (
          <div key={t.topic} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'white', border: `1px solid ${C.border}`,
            borderRadius: 14, padding: '12px 14px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: t.pct < 40 ? '#EF444415' : '#F59E0B15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {t.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.topic}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ width: 72, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${t.pct}%`, height: '100%', borderRadius: 2, background: t.pct < 40 ? '#EF4444' : '#F59E0B' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.pct < 40 ? '#EF4444' : '#F59E0B' }}>{t.pct}%</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/${stream}/quiz/${t.subjectId}`)}
              style={{
                background: C.primary, color: 'white', border: 'none',
                borderRadius: 10, padding: '7px 14px',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Inter,sans-serif', flexShrink: 0,
              }}
            >
              Drill →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SrsDueCard({ srsData, totalDue, stream, C, dark, navigate }) {
  if (!totalDue) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionHeading label="Review Due" C={C} />
        <span style={{ fontSize: 12, fontWeight: 800, color: dark ? '#A3E635' : C.primary, background: `${C.primary}15`, borderRadius: 20, padding: '2px 10px', marginBottom: 10 }}>
          {totalDue} due
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {srsData.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '10px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: 18 }}>{s.emoji}</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{s.label}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#A3E635' : C.primary, background: `${C.primary}12`, borderRadius: 20, padding: '2px 8px', marginRight: 6 }}>
              {s.dueCount}
            </span>
            <button
              onClick={() => navigate(`/${stream}/flashcards/${s.id}?review=1`)}
              style={{
                background: 'none', border: `1.5px solid ${C.primary}40`,
                color: C.primary, borderRadius: 8, padding: '5px 11px',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              Review →
            </button>
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

  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading label="Quick Start" C={C} />
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {subjects.map(s => (
          <div key={s.id} style={{ position:'relative' }}>
            <div style={{
              background:'white', border:`1.5px solid ${C.border}`,
              borderRadius:14, overflow:'visible',
              boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
              display:'flex', alignItems:'center', gap:12,
            }}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0, marginLeft:12,
                background:`${C.primary}15`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
              }}>{s.emoji}</div>

              <div style={{ flex:1, minWidth:0, padding:'12px 0' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#1E293B', lineHeight:1.2 }}>{s.label}</div>
                {s.desc && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.desc}</div>}
              </div>

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
              >⋯</button>
            </div>

            {openMenu === s.id && (
              <>
                <div onClick={() => setOpenMenu(null)} style={{ position:'fixed', inset:0, zIndex:50 }} />
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0,
                  background:'white', border:`1.5px solid ${C.border}`,
                  borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                  zIndex:51, minWidth:200, overflow:'hidden',
                }}>
                  {MODES.map((m, i) => (
                    <button
                      key={m.key}
                      onClick={() => { setOpenMenu(null); navigate(`/${stream}/${m.key}/${s.id}`) }}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TodayPage({ user, profile, isDark }) {
  const { stream }  = useParams()
  const navigate    = useNavigate()
  const C           = getColors(stream, null, isDark)
  const dark        = isDark
  const cfg         = STREAM_CONFIG[stream]
  const { isDesktop, isTablet } = useBreakpoint()

  const [topics,  setTopics]  = useState([])
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)

  const days = daysUntil(profile?.exam_date)
  const rec  = dailyRec(days)

  const srsData = useMemo(() => {
    if (!cfg) return []
    return cfg.subjects
      .map(s => ({ ...s, dueCount: getDueCount(getQuestions(stream, s.id)) }))
      .filter(s => s.dueCount > 0)
  }, [stream])

  const totalDue = srsData.reduce((n, s) => n + s.dueCount, 0)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    Promise.all([getTopicStats(user.id, stream), getWeeklyActivity(user.id)])
      .then(([tRes, aRes]) => {
        const map = {}
        ;(tRes.data ?? []).forEach(a => {
          if (!map[a.topic]) map[a.topic] = { correct: 0, total: 0 }
          map[a.topic].total++
          if (a.is_correct) map[a.topic].correct++
        })
        // Attach subject info to each topic
        const list = Object.entries(map).map(([topic, v]) => {
          let subjectId = cfg.subjects[0].id
          let emoji     = cfg.subjects[0].emoji
          for (const s of cfg.subjects) {
            if (getQuestions(stream, s.id).some(q => q.topic === topic)) {
              subjectId = s.id; emoji = s.emoji; break
            }
          }
          return { topic, pct: Math.round((v.correct / v.total) * 100), total: v.total, subjectId, emoji }
        }).sort((a, b) => a.pct - b.pct)
        setTopics(list)
        setActivity(aRes.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id, stream])

  if (!cfg) { navigate('/'); return null }

  const today       = new Date().toISOString().split('T')[0]
  const yesterday   = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const studiedToday     = activity.some(a => a.date === today)
  const missedYesterday  = !loading && !activity.some(a => a.date === yesterday)
  const shieldUsedToday  = localStorage.getItem(`nx_shield_used_${today}`) === '1'
  const canShield = missedYesterday && !shieldUsedToday && (profile?.streak ?? 0) >= 2 && (profile?.xp ?? 0) >= 50

  const weakTopics  = topics.filter(t => t.pct < 70).slice(0, 3)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? 'Scholar'

  const heroEl = (
    <div style={{ padding: 'max(18px, env(safe-area-inset-top, 18px)) 16px 4px' }}>
      {!isDesktop && (
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Today</div>
      )}
      <div style={{ fontSize: isDesktop ? 22 : 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: "'Playfair Display', Georgia, serif" }}>
        {greeting}, {firstName}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: 500 }}>
        {days !== null && days > 0
          ? `${days} day${days === 1 ? '' : 's'} until your exam · ${rec.sessions} session${rec.sessions > 1 ? 's' : ''} recommended today`
          : "Let's make today count"}
      </div>
    </div>
  )

  const goalCard     = <GoalCard rec={rec} days={days} studiedToday={studiedToday} C={C} />
  const dailyCard    = <DailyChallengeCard stream={stream} subjects={cfg.subjects} C={C} dark={dark} navigate={navigate} />
  const drillCard    = <PriorityDrillCard topics={weakTopics} stream={stream} C={C} navigate={navigate} />
  const srsCard      = <SrsDueCard srsData={srsData} totalDue={totalDue} stream={stream} C={C} dark={dark} navigate={navigate} />
  const brainBreak   = <BrainBreakRow stream={stream} C={C} navigate={navigate} />
  const quickGrid    = <QuickStartGrid subjects={cfg.subjects} stream={stream} C={C} cols={isDesktop ? 3 : isTablet ? 3 : 2} />
  const shieldCard   = canShield && user?.id ? (
    <StreakShieldCard user={user} profile={profile} C={C} onShieldUsed={() => {}} />
  ) : null

  const allCaughtUp = !loading && !weakTopics.length && (
    <div style={{ marginBottom: 14, background: '#F0FDF4', border: '1px solid #10B98130', borderRadius: 16, padding: '14px 18px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>Strong across the board! 🎉</div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>No weak spots — keep drilling to maintain your scores.</div>
    </div>
  )

  if (isDesktop) {
    return (
      <Shell C={C} isDark={isDark} heroContent={heroEl}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, paddingTop: 8 }}>
          {/* Left rail */}
          <div>
            {shieldCard}
            {goalCard}
            {dailyCard}
            {srsCard}
          </div>
          {/* Right area */}
          <div>
            {drillCard || allCaughtUp}
            {brainBreak}
            {quickGrid}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell C={C} isDark={isDark} heroContent={heroEl}>
      {shieldCard}
      {dailyCard}
      {goalCard}
      {drillCard || allCaughtUp}
      {srsCard}
      {brainBreak}
      {quickGrid}
    </Shell>
  )
}
