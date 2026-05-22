/**
 * TodayPage — personalised daily action center.
 * Route: /:stream/today
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopicStats, getWeeklyActivity } from '../lib/db.js'
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ label, C }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
      {label}
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
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading label="Quick Start" C={C} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {subjects.map(s => (
          <div key={s.id} style={{
            background: 'white', border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '12px 10px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: `${C.primary}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {s.emoji}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>{s.label}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {[
                { label: 'Quiz',  path: `/${stream}/quiz/${s.id}` },
                { label: 'Cards', path: `/${stream}/flashcards/${s.id}` },
                { label: 'Mock',  path: `/${stream}/mock/${s.id}` },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => navigate(m.path)}
                  style={{
                    background: `${C.primary}10`, border: `1px solid ${C.primary}25`,
                    borderRadius: 7, padding: '5px 2px',
                    fontSize: 10, fontWeight: 700, color: C.primary,
                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TodayPage({ user, profile }) {
  const { stream }  = useParams()
  const navigate    = useNavigate()
  const C           = getColors(stream)
  const dark        = stream === 'alevel'
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
    if (!user) { setLoading(false); return }
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
  }, [user, stream])

  if (!cfg) { navigate('/'); return null }

  const today       = new Date().toISOString().split('T')[0]
  const studiedToday = activity.some(a => a.date === today)
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
  const drillCard    = <PriorityDrillCard topics={weakTopics} stream={stream} C={C} navigate={navigate} />
  const srsCard      = <SrsDueCard srsData={srsData} totalDue={totalDue} stream={stream} C={C} dark={dark} navigate={navigate} />
  const quickGrid    = <QuickStartGrid subjects={cfg.subjects} stream={stream} C={C} cols={isDesktop ? 3 : isTablet ? 3 : 2} />

  const allCaughtUp = !loading && !weakTopics.length && (
    <div style={{ marginBottom: 14, background: '#F0FDF4', border: '1px solid #10B98130', borderRadius: 16, padding: '14px 18px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>Strong across the board! 🎉</div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>No weak spots — keep drilling to maintain your scores.</div>
    </div>
  )

  if (isDesktop) {
    return (
      <Shell C={C} heroContent={heroEl}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, paddingTop: 8 }}>
          {/* Left rail */}
          <div>
            {goalCard}
            {srsCard}
          </div>
          {/* Right area */}
          <div>
            {drillCard || allCaughtUp}
            {quickGrid}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell C={C} heroContent={heroEl}>
      {goalCard}
      {drillCard || allCaughtUp}
      {srsCard}
      {quickGrid}
    </Shell>
  )
}
