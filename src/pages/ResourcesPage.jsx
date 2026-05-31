/**
 * ResourcesPage — Study Resources Hub
 * Route: /:stream/resources
 *
 * Three panels:
 *   1. Official Exam Dates  — static exam board timetable
 *   2. Recommended Books    — curated books/links per subject (no competitor platforms)
 *   3. AI University Advisor — personalised, track-specific university targets
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Shell, getColors, SectionLabel } from './HomePage.jsx'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { getTopicStats } from '../lib/db.js'
import { STREAM_CONFIG } from '../data/questions.js'
import { EXAM_DATES, EXAM_DATES_VINTAGE } from '../data/officialExamDates.js'
import { RESOURCES, getResourceSubjects } from '../data/resources.js'
import { TRACK_COLORS, COURSERA_BLUE } from '../styles/courseraTokens.js'

const TYPE_META = {
  textbook:     { label: 'Textbook',       color: '#0056D2', bg: '#EFF6FF' },
  revision:     { label: 'Revision Guide', color: '#7C3AED', bg: '#F5F3FF' },
  'free-online':{ label: 'Free Online',    color: '#059669', bg: '#ECFDF5' },
  practice:     { label: 'Past Papers',    color: '#D97706', bg: '#FFFBEB' },
}

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// ── helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}

// ── sub-components ────────────────────────────────────────────────────────────

function Pill({ label, color, bg }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0 }}>
      {label}
    </span>
  )
}

function BookCard({ item, C }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.revision
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${meta.color}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.4 }}>{item.title}</div>
          {item.author && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.author}</div>}
          {item.publisher && !item.author && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.publisher}</div>}
        </div>
        <Pill label={meta.label} color={meta.color} bg={meta.bg} />
      </div>
      {item.desc && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{item.desc}</div>}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 700, color: meta.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
        >
          Open resource ↗
        </a>
      )}
    </div>
  )
}

function ExamDateRow({ session, isNext, C }) {
  const dl = daysUntil(session.date)
  const isPast   = dl < 0
  const isSoon   = dl >= 0 && dl <= 14
  const dotColor = isPast ? '#CBD5E1' : isSoon ? '#EF4444' : C.primary

  return (
    <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.border}`, opacity: isPast ? 0.45 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0, paddingTop: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        {isNext && <div style={{ width: 2, flex: 1, background: `${dotColor}40`, marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, lineHeight: 1.4 }}>{session.label}</span>
          {isSoon && !isPast && (
            <span style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 20, padding: '1px 8px', fontSize: 9, fontWeight: 800 }}>SOON</span>
          )}
          {isNext && !isSoon && (
            <span style={{ background: `${C.primary}14`, color: C.primary, borderRadius: 20, padding: '1px 8px', fontSize: 9, fontWeight: 800 }}>NEXT</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtDate(session.date)} · {session.board}</div>
        {session.registration && (
          <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, marginTop: 2 }}>⚠ Registration closes: {fmtDate(session.registration)}</div>
        )}
        {!isPast && (
          <div style={{ fontSize: 11, color: dl === 0 ? '#EF4444' : C.muted, fontWeight: dl <= 7 ? 700 : 400, marginTop: 1 }}>
            {dl === 0 ? 'Today!' : dl > 0 ? `${dl} day${dl === 1 ? '' : 's'} away` : `${Math.abs(dl)} days ago`}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResourcesPage({ user, profile, isDark }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const { isMobile } = useBreakpoint()

  // Track selector — defaults to current stream URL param, can be switched
  const enrolledStreams = profile?.streams?.length ? profile.streams : profile?.stream ? [profile.stream] : [stream]
  const [activeTrack, setActiveTrack] = useState(() => {
    return enrolledStreams.includes(stream) ? stream : (enrolledStreams[0] ?? stream)
  })

  const C   = getColors(activeTrack, null, isDark)
  const cfg = STREAM_CONFIG[activeTrack]

  // Exam dates state
  const examData = EXAM_DATES[activeTrack]
  const [showPast, setShowPast] = useState(false)

  // Books state — reset subject when track changes
  const resourceSubjects = getResourceSubjects(activeTrack)
  const streamResources  = RESOURCES[activeTrack] ?? {}
  const [activeSubject, setActiveSubject] = useState(resourceSubjects[0] ?? null)
  useEffect(() => {
    setActiveSubject(getResourceSubjects(activeTrack)[0] ?? null)
  }, [activeTrack])

  // Filter out competitor/nexora resources — only textbooks, revision guides, past papers, open resources with URLs
  const currentBooks = (activeSubject ? (streamResources[activeSubject] ?? []) : [])
    .filter(item => !item.nexora)

  // AI advisor state — reset when track changes
  const [adviceOpen,  setAdviceOpen]  = useState(false)
  const [adviceText,  setAdviceText]  = useState(null)
  const [adviceError, setAdviceError] = useState(null)
  const [targetGrade, setTargetGrade] = useState('')
  const [avgAccuracy, setAvgAccuracy] = useState(null)

  useEffect(() => {
    setAdviceOpen(false); setAdviceText(null); setAdviceError(null); setTargetGrade('')
  }, [activeTrack])

  // Compute average accuracy from topic stats for the active track
  useEffect(() => {
    if (!user?.id) return
    getTopicStats(user.id, activeTrack).then(({ data }) => {
      if (!data?.length) { setAvgAccuracy(null); return }
      const map = {}
      data.forEach(a => {
        if (!map[a.topic]) map[a.topic] = { correct: 0, total: 0 }
        map[a.topic].total++
        if (a.is_correct) map[a.topic].correct++
      })
      const vals = Object.values(map).map(v => Math.round((v.correct / v.total) * 100))
      setAvgAccuracy(Math.round(vals.reduce((s, v) => s + v, 0) / vals.length))
    }).catch(() => {})
  }, [user?.id, activeTrack])

  // Exam dates — filter
  const upcomingSessions = examData?.sessions?.filter(s => daysUntil(s.date) >= 0) ?? []
  const pastSessions     = examData?.sessions?.filter(s => daysUntil(s.date) < 0)  ?? []
  const sessionsToShow   = showPast ? [...pastSessions, ...upcomingSessions] : upcomingSessions

  async function fetchAdvice() {
    if (adviceText && adviceText !== 'loading') { setAdviceOpen(o => !o); return }
    setAdviceOpen(true); setAdviceText('loading'); setAdviceError(null)
    try {
      const subjects = cfg?.subjects?.map(s => s.label) ?? []
      const res = await fetch(`${SUPABASE_URL}/functions/v1/advise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ stream: activeTrack, subjects, avgAccuracy, targetGrade: targetGrade || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setAdviceText(null); setAdviceError(data.error ?? 'Request failed'); return }
      setAdviceText(data.advice ?? '')
    } catch {
      setAdviceText(null)
      setAdviceError('Could not reach the AI service. Please try again.')
    }
  }

  // ── Track switcher ────────────────────────────────────────────────────────
  const trackSwitcher = enrolledStreams.length > 1 && (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
      {enrolledStreams.map(s => {
        const sc     = STREAM_CONFIG[s]
        const accent = TRACK_COLORS[s] ?? '#0056D2'
        const active = s === activeTrack
        return (
          <button
            key={s}
            onClick={() => setActiveTrack(s)}
            style={{
              flexShrink: 0, padding: '7px 16px',
              background: active ? accent : 'transparent',
              border: `1.5px solid ${active ? accent : '#E2E8F0'}`,
              borderRadius: 20, fontSize: 12, fontWeight: 700,
              color: active ? 'white' : '#64748B',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
            }}
          >
            {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
          </button>
        )
      })}
    </div>
  )

  // ── Exam Dates panel ──────────────────────────────────────────────────────
  const examDatesPanel = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>📅 Official Exam Dates</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{examData?.board ?? cfg?.label} · {examData?.window ?? activeTrack.toUpperCase()}</div>
          </div>
          {examData?.officialUrl && (
            <a href={examData.officialUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, fontWeight: 700, color: C.primary, textDecoration: 'none', border: `1px solid ${C.primary}40`, borderRadius: 8, padding: '4px 10px' }}>
              Official timetable ↗
            </a>
          )}
        </div>
      </div>

      {!examData ? (
        <div style={{ padding: '24px 18px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No timetable data available for this track.</div>
      ) : (
        <div style={{ padding: '4px 18px 8px' }}>
          {/* "Show past dates" always at top */}
          {pastSessions.length > 0 && (
            <button
              onClick={() => setShowPast(p => !p)}
              style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '10px 0 6px', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {showPast ? '▲ Hide past dates' : `▼ Show ${pastSessions.length} past date${pastSessions.length > 1 ? 's' : ''}`}
            </button>
          )}

          {sessionsToShow.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>
              {upcomingSessions.length === 0 ? 'All dates have passed.' : 'No upcoming dates.'}
            </div>
          ) : (
            sessionsToShow.map((s, i) => (
              <ExamDateRow
                key={`${s.date}-${s.label}`}
                session={s}
                isNext={!showPast && i === 0 && upcomingSessions.length > 0}
                C={C}
              />
            ))
          )}
        </div>
      )}

      <div style={{ padding: '8px 18px 12px', borderTop: `1px solid ${C.border}40` }}>
        <div style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>Data source: {EXAM_DATES_VINTAGE}. Verify before relying on these dates.</div>
      </div>
    </div>
  )

  // ── Books panel ───────────────────────────────────────────────────────────
  const booksPanel = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>📚 Textbooks & Guides</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Curated for {cfg?.label ?? activeTrack.toUpperCase()}</div>
      </div>

      {resourceSubjects.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 18px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {resourceSubjects.map(subj => (
            <button
              key={subj}
              onClick={() => setActiveSubject(subj)}
              style={{
                flexShrink: 0, padding: '5px 14px',
                background: activeSubject === subj ? C.primary : 'transparent',
                border: `1.5px solid ${activeSubject === subj ? C.primary : C.border}`,
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                color: activeSubject === subj ? 'white' : C.muted,
                cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '8px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {currentBooks.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>No resources available for this subject yet.</div>
        ) : (
          currentBooks.map((item, i) => <BookCard key={i} item={item} C={C} />)
        )}
      </div>
    </div>
  )

  // ── AI advisor panel ──────────────────────────────────────────────────────
  const isUK = ['gcse','alevel'].includes(activeTrack)
  const advisorPanel = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>🎓 AI {isUK ? 'University' : 'College'} Advisor</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          Personalised reach / match / safety suggestions for <strong>{cfg?.label ?? activeTrack.toUpperCase()}</strong>
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your target grade (optional)
            </div>
            <input
              type="text"
              placeholder={
                activeTrack === 'alevel' ? 'e.g. A*AA' :
                activeTrack === 'gcse'   ? 'e.g. 7,8,8' :
                activeTrack === 'sat'    ? 'e.g. 1450' :
                activeTrack === 'act'    ? 'e.g. 32' :
                activeTrack === 'ap'     ? 'e.g. 4s and 5s' :
                'e.g. 1200 PSAT'
              }
              value={targetGrade}
              onChange={e => setTargetGrade(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.navy, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {avgAccuracy !== null && (
            <div style={{ background: `${C.primary}12`, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>{avgAccuracy}%</div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>avg accuracy</div>
            </div>
          )}
        </div>

        <button
          onClick={fetchAdvice}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: adviceOpen ? `${C.primary}14` : C.primary,
            border: `1.5px solid ${C.primary}`,
            borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700,
            color: adviceOpen ? C.primary : 'white', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          {adviceText === 'loading' ? 'Thinking…' : adviceOpen && adviceText ? 'Hide advice' : `Get ${isUK ? 'university' : 'college'} suggestions`}
        </button>

        {adviceError && (
          <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626' }}>
            {adviceError}
          </div>
        )}

        {adviceOpen && adviceText === 'loading' && (
          <div style={{ marginTop: 20, textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'inline-block', width: 24, height: 24, border: `2.5px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>Matching {isUK ? 'universities' : 'colleges'} to your profile…</div>
          </div>
        )}

        {adviceOpen && adviceText && adviceText !== 'loading' && (
          <div style={{ marginTop: 16 }}>
            <style>{`
              .adv-md h1{font-size:15px;font-weight:900;margin:0 0 8px;color:${C.navy}}
              .adv-md h2{font-size:13px;font-weight:800;margin:14px 0 4px;color:${C.primary}}
              .adv-md h3{font-size:12px;font-weight:700;margin:10px 0 3px}
              .adv-md p{margin:0 0 10px;font-size:13px;color:${C.muted};line-height:1.75}
              .adv-md strong{font-weight:800;color:${C.navy}}
              .adv-md ul,.adv-md ol{margin:4px 0 10px;padding-left:20px}
              .adv-md li{font-size:13px;color:${C.muted};line-height:1.65;margin-bottom:4px}
            `}</style>
            <div className="adv-md">
              <ReactMarkdown>{adviceText}</ReactMarkdown>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAdviceText(null); setAdviceOpen(false) }}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: C.muted, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 18px 12px', borderTop: `1px solid ${C.border}40` }}>
        <div style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>
          AI suggestions only — always verify requirements at {isUK ? 'ucas.com' : 'commonapp.org'} before applying.
        </div>
      </div>
    </div>
  )


  // ── Hero (consistent with HomePage + LearnHub) ────────────────────────────
  const heroEl = (
    <div style={{ padding: 'max(14px, env(safe-area-inset-top, 14px)) 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: track pills or single label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {enrolledStreams.length > 1 ? (
            enrolledStreams.map(s => {
              const sc     = STREAM_CONFIG[s]
              const accent = TRACK_COLORS[s] ?? COURSERA_BLUE
              const active = s === activeTrack
              return (
                <button
                  key={s}
                  onClick={() => setActiveTrack(s)}
                  style={{
                    background: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.18)',
                    border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: 20, padding: '4px 11px',
                    fontSize: 10, fontWeight: 800,
                    color: active ? accent : 'white',
                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.15s', letterSpacing: '0.04em',
                  }}
                >
                  {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
                  {active && <span style={{ fontSize: 7, marginLeft: 3 }}>●</span>}
                </button>
              )
            })
          ) : (
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
              {cfg?.label?.replace(' Track','').replace(' Prep','') ?? activeTrack.toUpperCase()}
            </div>
          )}
        </div>
        {/* Right: page title pill */}
        <div style={{
          flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
          background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '3px 10px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Resources
        </div>
      </div>
      {/* Subtitle */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 8, fontWeight: 500 }}>
        Exam dates · textbooks & guides · {isUK ? 'university' : 'college'} guidance
      </div>
    </div>
  )

  if (!isMobile) {
    return (
      <Shell C={C} isDark={isDark} heroContent={heroEl} contentMax={1100}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 24 }}>
            {advisorPanel}
          </div>
          <div>
            {examDatesPanel}
            {booksPanel}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell C={C} isDark={isDark} heroContent={heroEl}>
      {advisorPanel}
      {examDatesPanel}
      {booksPanel}
    </Shell>
  )
}
