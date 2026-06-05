/**
 * HomePage — subject/exam picker shown after stream selection.
 * Reads stream from URL param so bookmarking works.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { UNIVERSITIES, getCoursesForUni, getTestsForCourse } from '../data/uniMapping.js'
import { getEbaccLang, saveEbaccLang } from '../data/examBoards.js'
import { upsertProfile } from '../lib/db.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getDueCount, getDueIds } from '../lib/srs.js'
import { NAV_HEIGHT } from '../styles/tokens.js'
import { SIDEBAR_W, CONTENT_MAX } from '../styles/breakpoints.js'
import { getTheme } from '../styles/courseraTokens.js'
import { useSubscription } from '../hooks/useSubscription.js'
import { useMastery } from '../hooks/useMastery.js'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import AuthModal from '../components/AuthModal.jsx'
import WelcomeModal from '../components/WelcomeModal.jsx'
import FanDeck from '../components/FanDeck.jsx'
import IBTierToggle from '../components/IBTierToggle.jsx'
import { useIBTier } from '../hooks/useIBTier.js'
import { TRACK_COLORS } from '../styles/courseraTokens.js'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

const GCSE_COLORS = {
  primary:'#0F766E', secondary:'#F97316', accent:'#FCD34D',
  bg:'#F0FDFA', card:'#FFFFFF', navy:'#1E293B', soft:'#CCFBF1',
  muted:'#64748B', success:'#10B981', border:'#E2E8F0',
}
const ALEVEL_COLORS = {
  primary:   '#7C3AED',
  secondary: '#F43F5E',
  accent:    '#06B6D4',
  bg:        '#EDE9FE',
  card:      '#FFFFFF',
  navy:      '#1E293B',
  soft:      '#EDE9FE',
  muted:     '#64748B',
  success:   '#10B981',
  border:    '#E2E8F0',
}
const SAT_COLORS = {
  primary: '#EA580C', secondary: '#F97316', accent: '#FDBA74',
  bg: '#FFF7ED', card: '#FFFFFF', navy: '#1E293B', soft: '#FFEDD5',
  muted: '#64748B', success: '#10B981', border: '#E2E8F0',
}
const ACT_COLORS = {
  primary: '#DC2626', secondary: '#EF4444', accent: '#FECACA',
  bg: '#FEF2F2', card: '#FFFFFF', navy: '#1E293B', soft: '#FEE2E2',
  muted: '#64748B', success: '#10B981', border: '#E2E8F0',
}
const AP_COLORS = {
  primary: '#1D4ED8', secondary: '#3B82F6', accent: '#BFDBFE',
  bg: '#EFF6FF', card: '#FFFFFF', navy: '#1E293B', soft: '#DBEAFE',
  muted: '#64748B', success: '#10B981', border: '#E2E8F0',
}
const PSAT_COLORS = {
  primary: '#059669', secondary: '#10B981', accent: '#A7F3D0',
  bg: '#ECFDF5', card: '#FFFFFF', navy: '#1E293B', soft: '#D1FAE5',
  muted: '#64748B', success: '#10B981', border: '#E2E8F0',
}
const STREAM_COLORS = {
  gcse: GCSE_COLORS, alevel: ALEVEL_COLORS,
  sat: SAT_COLORS, act: ACT_COLORS, ap: AP_COLORS, psat: PSAT_COLORS,
}

const SUBJECT_COLORS = {
  // ── GCSE (light) ──────────────────────────────────────────────────────────
  maths: {
    primary:'#3B82F6', secondary:'#6366F1', accent:'#BFDBFE',
    bg:'#EFF6FF', card:'#FFFFFF', navy:'#1E293B', soft:'#DBEAFE',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  english: {
    primary:'#D97706', secondary:'#F59E0B', accent:'#FDE68A',
    bg:'#FFFBEB', card:'#FFFFFF', navy:'#1E293B', soft:'#FEF3C7',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  englishlit: {
    primary:'#BE185D', secondary:'#EC4899', accent:'#FBCFE8',
    bg:'#FDF2F8', card:'#FFFFFF', navy:'#1E293B', soft:'#FCE7F3',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  science: {
    primary:'#0F766E', secondary:'#06B6D4', accent:'#A7F3D0',
    bg:'#F0FDFA', card:'#FFFFFF', navy:'#1E293B', soft:'#CCFBF1',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  history: {
    primary:'#B45309', secondary:'#D97706', accent:'#FDE68A',
    bg:'#FFFBEB', card:'#FFFFFF', navy:'#1E293B', soft:'#FEF3C7',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  geography: {
    primary:'#15803D', secondary:'#16A34A', accent:'#BBF7D0',
    bg:'#F0FDF4', card:'#FFFFFF', navy:'#1E293B', soft:'#DCFCE7',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  cs: {
    primary:'#4F46E5', secondary:'#6366F1', accent:'#C7D2FE',
    bg:'#EEF2FF', card:'#FFFFFF', navy:'#1E293B', soft:'#E0E7FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  rs: {
    primary:'#7C3AED', secondary:'#A855F7', accent:'#E9D5FF',
    bg:'#FAF5FF', card:'#FFFFFF', navy:'#1E293B', soft:'#F3E8FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  verbal: {
    primary:'#DB2777', secondary:'#EC4899', accent:'#FBCFE8',
    bg:'#FDF2F8', card:'#FFFFFF', navy:'#1E293B', soft:'#FCE7F3',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  spanish: {
    primary:'#DC2626', secondary:'#EF4444', accent:'#FECACA',
    bg:'#FEF2F2', card:'#FFFFFF', navy:'#1E293B', soft:'#FEE2E2',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  french: {
    primary:'#1D4ED8', secondary:'#3B82F6', accent:'#BFDBFE',
    bg:'#EFF6FF', card:'#FFFFFF', navy:'#1E293B', soft:'#DBEAFE',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  german: {
    primary:'#B45309', secondary:'#D97706', accent:'#FDE68A',
    bg:'#FFFBEB', card:'#FFFFFF', navy:'#1E293B', soft:'#FEF3C7',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  business: {
    primary:'#0369A1', secondary:'#0284C7', accent:'#BAE6FD',
    bg:'#F0F9FF', card:'#FFFFFF', navy:'#1E293B', soft:'#E0F2FE',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  // ── A-Level (light — consistent with warm login theme) ────────────────────
  ucat: {
    primary:'#06B6D4', secondary:'#0EA5E9', accent:'#67E8F9',
    bg:'#F0FDFF', card:'#FFFFFF', navy:'#1E293B', soft:'#E0F9FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  lnat: {
    primary:'#F59E0B', secondary:'#FBBF24', accent:'#FDE68A',
    bg:'#FFFBEB', card:'#FFFFFF', navy:'#1E293B', soft:'#FEF3C7',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  tmua: {
    primary:'#818CF8', secondary:'#6366F1', accent:'#C7D2FE',
    bg:'#EEF2FF', card:'#FFFFFF', navy:'#1E293B', soft:'#E0E7FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  esat: {
    primary:'#F97316', secondary:'#FB923C', accent:'#FDBA74',
    bg:'#FFF7ED', card:'#FFFFFF', navy:'#1E293B', soft:'#FFEDD5',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  tsa: {
    primary:'#A855F7', secondary:'#C084FC', accent:'#E9D5FF',
    bg:'#FAF5FF', card:'#FFFFFF', navy:'#1E293B', soft:'#F3E8FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  step: {
    primary:'#10B981', secondary:'#34D399', accent:'#6EE7B7',
    bg:'#ECFDF5', card:'#FFFFFF', navy:'#1E293B', soft:'#D1FAE5',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  mat: {
    primary:'#6366F1', secondary:'#818CF8', accent:'#C7D2FE',
    bg:'#EEF2FF', card:'#FFFFFF', navy:'#1E293B', soft:'#E0E7FF',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  pat: {
    primary:'#22D3EE', secondary:'#06B6D4', accent:'#A5F3FC',
    bg:'#F0FDFF', card:'#FFFFFF', navy:'#1E293B', soft:'#CFFAFE',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
  tara: {
    primary:'#EC4899', secondary:'#F472B6', accent:'#FBCFE8',
    bg:'#FDF2F8', card:'#FFFFFF', navy:'#1E293B', soft:'#FCE7F3',
    muted:'#64748B', success:'#10B981', border:'#E2E8F0',
  },
}

export function getColors(stream, subject, isDark = false) {
  return getTheme(stream, isDark)
}

export default function HomePage({ user, profile, refreshProfile, signOut, startPomodoro, isDark }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const cfg        = STREAM_CONFIG[stream]
  const C          = getColors(stream, null, isDark)
  const dark       = isDark
  const sub        = useSubscription(profile)
  const [showAuth, setShowAuth]           = useState(false)
  const [editingDate, setEditingDate]     = useState(false)
  const [dateInput,   setDateInput]       = useState(profile?.exam_date ?? '')
  const [ebaccOnly,   setEbaccOnly]       = useState(false)
  const [ebaccLang,   setEbaccLang]       = useState(() => getEbaccLang())
  const [finderOpen,  setFinderOpen]      = useState(false)
  const [finderUni,   setFinderUni]       = useState('')
  const [finderCourse,setFinderCourse]    = useState('')

  if (!cfg) { navigate('/'); return null }

  const enrolledStreams = profile?.streams?.length ? profile.streams : profile?.stream ? [profile.stream] : [stream]
  const isAnon    = !user?.email || user?.isGuest

  // Free plan subject limit — show only first 2 subjects, rest locked
  const subjectLimit  = sub.isFree ? (sub.limits.subjects ?? 2) : Infinity
  const visibleSubjects = cfg.subjects.filter(s => !s.deprecated)
  const allowedSubjects = sub.isFree
    ? visibleSubjects.slice(0, subjectLimit)
    : visibleSubjects
  const xp        = profile?.xp     ?? 0
  const streak    = profile?.streak  ?? 0
  const level     = Math.floor(xp / 150) + 1
  const pct       = (xp % 150) / 150 * 100
  const days      = daysUntil(profile?.exam_date)

  const dueCount  = useMemo(() => {
    const allQs = cfg.subjects.flatMap(s => getQuestions(stream, s.id))
    return getDueCount(allQs)
  }, [stream, cfg.subjects])

  const reviewSubjectId = useMemo(() => {
    for (const s of cfg.subjects) {
      const qs = getQuestions(stream, s.id)
      if (getDueIds(qs).length > 0) return s.id
    }
    return cfg.subjects[0].id
  }, [stream, cfg.subjects])

  const [dateError,  setDateError]  = useState(null)
  const [dateSaving, setDateSaving] = useState(false)

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

  function switchStream() { navigate('/switch') }

  // ── Hero content (rendered inside the gradient band) ──────────────────────
  const { isDesktop } = useBreakpoint()

  // Desktop hero: bookmark-tab bar for multi-track users
  const heroEl = isDesktop && enrolledStreams.length > 1 && !sub.isFree ? (
    <div style={{ display:'flex', flexDirection:'column' }}>
      {/* Top row: stats + inline chips + actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px 0', gap:12 }}>
        {/* Left: level + XP + streak + countdown chip + mission chip */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>Level {level}</span>
            <div style={{ width:80, height:4, background:'rgba(255,255,255,0.2)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:'white', borderRadius:4, transition:'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{xp} XP</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:14 }}>🔥</span>
            <span style={{ fontWeight:900, color:'white', fontSize:13 }}>{streak}</span>
          </div>
          {days !== null && days > 0 && (
            <button
              onClick={() => setEditingDate(true)}
              style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.95)', cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}
              title="Edit exam date"
            >
              📅 <span>{days}d to exam</span>
            </button>
          )}
          {days === null && (
            <button
              onClick={() => setEditingDate(true)}
              style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.12)', border:'1px dashed rgba(255,255,255,0.3)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}
              title="Set exam date"
            >
              📅 <span>Set exam date</span>
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'3px 10px' }}>
            <span style={{ fontSize:11 }}>⚡</span>
            <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.95)' }}>Daily mission</span>
          </div>
        </div>
        {/* Right: actions */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          {isSupabaseConfigured && isAnon
            ? <HeroIconBtn onClick={() => setShowAuth(true)} title="Sign In"><SignInIcon color="white" size={16} /></HeroIconBtn>
            : isSupabaseConfigured && !isAnon
              ? <HeroIconBtn onClick={() => { signOut?.(); navigate('/') }} title="Sign Out"><SignOutIcon color="white" size={16} /></HeroIconBtn>
              : null
          }
          <HeroIconBtn onClick={() => navigate(`/${stream}/settings?contact=1`)} title="Contact Us"><MailIcon color="white" size={16} /></HeroIconBtn>
          <HeroIconBtn onClick={() => navigate('/landing')} title="Manage tracks"><svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/></svg></HeroIconBtn>
        </div>
      </div>

      {/* Bookmark tab bar */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:0, padding:'10px 20px 0', overflowX:'auto', scrollbarWidth:'none' }}>
        {enrolledStreams.map(s => {
          const sc     = STREAM_CONFIG[s]
          const active = s === stream
          const accent = TRACK_COLORS[s] ?? COURSERA_BLUE
          const label  = sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()
          return (
            <button
              key={s}
              onClick={() => !active && navigate(`/${s}`)}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'8px 18px 10px',
                marginRight:2,
                background: active ? 'white' : 'rgba(255,255,255,0.12)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderBottom: active ? 'none' : 'none',
                borderRadius:'10px 10px 0 0',
                cursor: active ? 'default' : 'pointer',
                fontFamily:'Inter,sans-serif',
                WebkitTapHighlightColor:'transparent',
                transition:'all 0.15s',
                position:'relative',
              }}
            >
              {/* Coloured dot for the track */}
              <div style={{ width:8, height:8, borderRadius:4, background: active ? accent : 'rgba(255,255,255,0.6)', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight: active ? 800 : 600, color: active ? accent : 'rgba(255,255,255,0.85)', whiteSpace:'nowrap', letterSpacing:'-0.1px' }}>
                {label}
              </span>
              {active && <span style={{ fontSize:7, color: accent }}>●</span>}
            </button>
          )
        })}
        {/* Add track button */}
        <button
          onClick={() => navigate('/landing')}
          title="Manage tracks"
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:32, height:32, marginLeft:4, marginBottom:2,
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:8, cursor:'pointer', color:'rgba(255,255,255,0.7)',
            fontSize:16, fontFamily:'Inter,sans-serif',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          +
        </button>
      </div>
    </div>
  ) : (
    /* ── Original hero for mobile + single-track desktop ── */
    <div style={{ padding:'max(18px, env(safe-area-inset-top, 18px)) 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', flex:1, minWidth:0 }}>
          {enrolledStreams.length > 1 && !sub.isFree ? (
            enrolledStreams.map(s => {
              const sc = STREAM_CONFIG[s]
              const active = s === stream
              return (
                <button key={s} onClick={() => !active && navigate(`/${s}`)}
                  style={{ background: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.18)', border:`1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.3)'}`, borderRadius:20, padding:'4px 11px', fontSize:10, fontWeight:800, color: active ? C.primary : 'white', cursor: active ? 'default' : 'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent', transition:'all 0.15s', letterSpacing:'0.04em' }}>
                  {sc?.label?.replace(' Track','').replace(' Prep','') ?? s.toUpperCase()}
                  {active && <span style={{ fontSize:7, marginLeft:3 }}>●</span>}
                </button>
              )
            })
          ) : (
            <div>
              {!isDesktop && <div style={{ fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>Nexora</div>}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop: isDesktop ? 0 : 4 }}>
                <span style={{ background:'rgba(255,255,255,0.22)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:800, letterSpacing:'0.07em' }}>
                  {cfg.label.replace(' Track','').toUpperCase()}
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{cfg.years}</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:20 }}>🔥</span>
            <span style={{ fontWeight:900, color:'white', fontSize:17 }}>{streak}</span>
          </div>
          {isSupabaseConfigured && isAnon
            ? <HeroIconBtn onClick={() => setShowAuth(true)} title="Sign In"><SignInIcon color="white" size={18} /></HeroIconBtn>
            : isSupabaseConfigured && !isAnon
              ? <HeroIconBtn onClick={() => { signOut?.(); navigate('/') }} title="Sign Out"><SignOutIcon color="white" size={18} /></HeroIconBtn>
              : null
          }
          <HeroIconBtn onClick={() => navigate(`/${stream}/settings?contact=1`)} title="Contact Us"><MailIcon color="white" size={18} /></HeroIconBtn>
          <HeroIconBtn onClick={() => navigate('/landing')} title="Manage tracks"><svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth={2}/></svg></HeroIconBtn>
        </div>
      </div>
      <div style={{ marginTop:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.75)' }}>Level {level} Scholar · {xp} XP</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>{Math.round(150 - (xp % 150))} to Lv {level + 1}</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, height:6, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, background:'white', height:'100%', borderRadius:8, transition:'width 0.6s ease', boxShadow:'0 0 8px rgba(255,255,255,0.5)' }} />
        </div>
      </div>
    </div>
  )

  // ── Right-rail widgets (shared between desktop and mobile) ────────────────
  const countdownWidget = editingDate ? (
    <div style={{ background:'white', border:'1px solid #F1F5F9', borderRadius:16, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:10 }}>EXAM DATE</div>
      <input
        type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
        style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'#F8FAFC', color:C.navy, fontSize:13, fontFamily:'Inter,sans-serif', marginBottom:8 }}
      />
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => saveExamDate(dateInput)} disabled={dateSaving} style={{ flex:1, background:C.primary, color:'white', border:'none', borderRadius:8, padding:'8px', fontSize:12, fontWeight:700, cursor:dateSaving?'default':'pointer', opacity:dateSaving?0.7:1, fontFamily:'Inter,sans-serif' }}>{dateSaving ? 'Saving…' : 'Save'}</button>
        <button onClick={() => { setEditingDate(false); setDateError(null) }} style={{ background:'none', border:`1.5px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.muted, fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Cancel</button>
      </div>
      {dateError && <span style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginTop:6, display:'block' }}>{dateError}</span>}
    </div>
  ) : days !== null ? (
    <div style={{
      background:'white',
      border:`1.5px solid ${days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}30`,
      borderRadius:16, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em' }}>EXAM COUNTDOWN</div>
        <button onClick={() => { setDateInput(profile?.exam_date ?? ''); setEditingDate(true) }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, lineHeight:1, padding:0 }}>✏️</button>
      </div>
      {days > 0 ? (
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:44, fontWeight:900, lineHeight:1, color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary }}>{days}</span>
          <span style={{ fontSize:14, fontWeight:700, color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary }}>day{days===1?'':'s'} to go</span>
        </div>
      ) : (
        <span style={{ fontSize:14, fontWeight:700, color:days === 0 ? C.primary : C.muted }}>
          {days === 0 ? 'Your exam is today! 🎯' : 'Exam date passed'}
        </span>
      )}
      {days > 0 && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Keep your streak going!</div>}
    </div>
  ) : (
    <button
      onClick={() => setEditingDate(true)}
      style={{ width:'100%', background:'white', border:`1px dashed ${C.border}`, borderRadius:14, padding:'14px', fontSize:12, color:C.muted, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}
    >
      📅 Set your exam date for a countdown
    </button>
  )

  const reviewWidget = dueCount > 0 ? (
    <div style={{ background:'white', border:'1px solid #F1F5F9', borderRadius:16, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>REVIEW DUE</div>
      <div style={{ fontSize:14, fontWeight:800, color:dark?'#A3E635':C.primary, marginBottom:4 }}>{dueCount} question{dueCount>1?'s':''}</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Spaced repetition — answer these first</div>
      <button
        onClick={() => navigate(`/${stream}/quiz/${reviewSubjectId}?review=1`)}
        style={{ width:'100%', background:dark?C.secondary:C.primary, color:'white', border:'none', borderRadius:10, padding:'9px', fontWeight:800, cursor:'pointer', fontSize:12, fontFamily:'Inter,sans-serif' }}
      >
        Review →
      </button>
    </div>
  ) : null

  const missionWidget = (
    <div style={{ background:'white', border:'1px solid #F1F5F9', borderRadius:16, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:10 }}>DAILY MISSION</div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:C.primary+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>⚡</div>
        <div>
          <div style={{ fontWeight:800, color:'#1E293B', fontSize:13 }}>2 sessions left</div>
          <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Hit today's goal</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, marginTop:10 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex:1, height:5, borderRadius:3, background: i<=3 ? C.primary : '#E2E8F0', transition:'background 0.3s' }} />
        ))}
      </div>
    </div>
  )

  const focusWidget = (
    <button
      onClick={startPomodoro}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        background:'white', border:'1px solid #F1F5F9',
        boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
        borderRadius:16, padding:'14px 16px', cursor:'pointer',
        fontFamily:'Inter,sans-serif', textAlign:'left',
      }}
    >
      <span style={{ fontSize:20 }}>🍅</span>
      <div>
        <div style={{ fontSize:13, fontWeight:800, color:'#1E293B' }}>25-min Focus Session</div>
        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Pomodoro · 5-min break after</div>
      </div>
      <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.primary }}>Start →</span>
    </button>
  )

  const leaderboardWidget = (
    <button
      onClick={() => navigate(`/${stream}/leaderboard`)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        background:'white', border:'1px solid #F1F5F9',
        boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
        borderRadius:16, padding:'14px 16px', cursor:'pointer',
        fontFamily:'Inter,sans-serif', textAlign:'left',
      }}
    >
      <span style={{ fontSize:20 }}>🏆</span>
      <div>
        <div style={{ fontSize:13, fontWeight:800, color:'#1E293B' }}>Leaderboard</div>
        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Top students by XP this week</div>
      </div>
      <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.primary }}>View →</span>
    </button>
  )

  // ── University finder (shared) ────────────────────────────────────────────
  const uniFinder = stream === 'alevel' ? (
    <div>
      <button
        onClick={() => { setFinderOpen(o => !o); setFinderUni(''); setFinderCourse('') }}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          background:C.card, border:`1.5px solid ${C.primary}40`,
          borderRadius:14, padding:'13px 16px', cursor:'pointer',
          fontFamily:'Inter,sans-serif', textAlign:'left',
        }}
      >
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:C.navy }}>🔍 Which test do I need?</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Pick your university and course</div>
        </div>
        <span style={{ fontSize:16, color:C.primary, transition:'transform 0.2s', transform:finderOpen?'rotate(180deg)':'none' }}>▾</span>
      </button>

      {finderOpen && (
        <div style={{ background:C.card, border:`1.5px solid ${C.primary}30`, borderRadius:14, padding:'16px', marginTop:6 }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.1em', marginBottom:5 }}>UNIVERSITY</label>
            <select
              value={finderUni}
              onChange={e => { setFinderUni(e.target.value); setFinderCourse('') }}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:'#F8FAFC', color:C.navy, fontSize:13, fontFamily:'Inter,sans-serif', cursor:'pointer', WebkitAppearance:'none' }}
            >
              <option value="">Select university…</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {finderUni && (
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.1em', marginBottom:5 }}>COURSE</label>
              <select
                value={finderCourse}
                onChange={e => setFinderCourse(e.target.value)}
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:'#F8FAFC', color:C.navy, fontSize:13, fontFamily:'Inter,sans-serif', cursor:'pointer', WebkitAppearance:'none' }}
              >
                <option value="">Select course…</option>
                {getCoursesForUni(finderUni).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {finderUni && finderCourse && (() => {
            const tests = getTestsForCourse(finderUni, finderCourse)
            return tests.length === 0 ? (
              <div style={{ fontSize:12, color:C.muted, padding:'8px 0' }}>No required admissions tests found for this combination.</div>
            ) : (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>REQUIRED TEST{tests.length > 1 ? 'S' : ''}:</div>
                {tests.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:t.conditional?'#FEF3C7':'#F0FDF4', border:`1px solid ${t.conditional?'#F59E0B':'#10B981'}40`, borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:C.navy }}>{t.label}</div>
                      {t.conditional && <div style={{ fontSize:10, color:'#92400E', fontWeight:700, marginTop:2 }}>⚠ Conditional on offer · taken June</div>}
                      {t.note && !t.conditional && <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{t.note}</div>}
                    </div>
                    <button
                      onClick={() => { navigate(`/${stream}/quiz/${t.id}`); setFinderOpen(false) }}
                      style={{ background:C.primary, color:'white', border:'none', borderRadius:8, padding:'6px 12px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0 }}
                    >
                      Practice →
                    </button>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  ) : null

  return (
    <Shell C={C} isDark={isDark} heroContent={heroEl} contentMax={isDesktop ? 1200 : undefined}>
      {showAuth && <AuthModal C={C} dark={dark} onClose={() => setShowAuth(false)} />}
      <WelcomeModal user={user} C={C} dark={dark} />

      {/* ── Trial banner — full width in both layouts ───────────────────── */}
      {sub.isTrial && sub.daysLeft !== null && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'linear-gradient(135deg,#7C3AED18,#FF6B3518)',
          border:'1.5px solid #7C3AED30',
          borderRadius:14, padding:'11px 14px', marginBottom:16,
        }}>
          <div>
            <span style={{ fontSize:13, fontWeight:800, color:'#7C3AED' }}>✦ Free Trial</span>
            <span style={{ fontSize:12, color:'#64748B', marginLeft:8 }}>
              {sub.daysLeft > 0
                ? `${sub.daysLeft} day${sub.daysLeft !== 1 ? 's' : ''} remaining`
                : 'expires today'}
            </span>
          </div>
          <button
            onClick={() => navigate(`/${stream}/settings`)}
            style={{
              background:'linear-gradient(135deg,#7C3AED,#FF6B35)',
              color:'white', border:'none', borderRadius:10,
              padding:'6px 14px', fontSize:11, fontWeight:800,
              cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0,
            }}
          >
            Upgrade →
          </button>
        </div>
      )}

      {isDesktop ? (
        /* ─────────── DESKTOP: redesigned world-class layout ─────────── */
        <div style={{ minHeight:'100vh' }}>

          {/* Subject section header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div>
                <div style={{ fontSize:28, fontWeight:900, color:C.navy, letterSpacing:'-0.6px', lineHeight:1.1, fontFamily:"'Playfair Display', Georgia, serif" }}>
                  {stream === 'alevel' ? 'Choose Your Exam' : 'Your Subjects'}
                </div>
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                  {cfg.subjects.filter(s=>!s.deprecated).length} subjects · {stream === 'alevel' ? 'Admissions tests' : `${cfg.years}`}
                </div>
              </div>
              <FormatInfoButton />
            </div>
            {/* Filter chips */}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {stream === 'gcse' && (
                <>
                  <button onClick={() => setEbaccOnly(e => !e)}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, background: ebaccOnly ? '#F59E0B' : 'white', border: ebaccOnly ? '1.5px solid #D97706' : '1.5px solid #E2E8F0', borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:700, color: ebaccOnly ? 'white' : '#64748B', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                    ⭐ EBacc{ebaccOnly ? ' ✕' : ''}
                  </button>
                  {ebaccOnly && cfg.subjects.filter(s => s.mfl).map(s => (
                    <button key={s.id} onClick={() => { const next = ebaccLang === s.id ? null : s.id; setEbaccLang(next); saveEbaccLang(next ?? '') }}
                      style={{ background: ebaccLang === s.id ? SUBJECT_COLORS[s.id]?.primary ?? C.primary : 'white', border:`1.5px solid ${ebaccLang === s.id ? SUBJECT_COLORS[s.id]?.primary ?? C.primary : '#E2E8F0'}`, borderRadius:20, padding:'7px 14px', fontSize:12, fontWeight:700, color: ebaccLang === s.id ? 'white' : '#64748B', cursor:'pointer' }}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </>
              )}
              {stream === 'alevel' && (
                <div style={{ padding:'8px 14px', background:`${C.primary}10`, border:`1px solid ${C.primary}25`, borderRadius:20, fontSize:11, color:C.primary, fontWeight:700 }}>
                  🎓 Mirrors real admissions test style
                </div>
              )}
            </div>
          </div>

          {/* Main content grid: subjects (wide) + right sidebar (narrow, sticky) */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}>

            {/* LEFT — subject grid (full width, prominent) */}
            <div>
              {(stream === 'gcse' || stream === 'igcse' || stream === 'ib') ? (
                <GcseSubjectGrid
                  subjects={ebaccOnly ? allowedSubjects.filter(s => s.ebacc && (!s.mfl || s.id === ebaccLang)) : allowedSubjects}
                  navigate={navigate} stream={stream} C={C}
                />
              ) : (
                <FanDeck subjects={allowedSubjects} stream={stream} navigate={navigate} C={C} />
              )}
              {sub.isFree && visibleSubjects.length > subjectLimit && (
                <FreePlanBanner C={C} stream={stream} navigate={navigate} locked={visibleSubjects.length - subjectLimit} />
              )}
              {stream === 'alevel' && <div style={{ marginTop:16 }}>{uniFinder}</div>}
            </div>

            {/* RIGHT — premium sidebar */}
            <div style={{ position:'sticky', top:24, display:'flex', flexDirection:'column', gap:14 }}>

              {/* SRS Review */}
              {reviewWidget && (
                <div style={{ background:'white', borderRadius:18, padding:'16px 18px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.06)' }}>
                  {reviewWidget}
                </div>
              )}

              {/* Focus + leaderboard — compact row */}
              {(focusWidget || leaderboardWidget) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {focusWidget && (
                    <div style={{ background:'white', borderRadius:14, padding:'12px 14px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.06)' }}>
                      {focusWidget}
                    </div>
                  )}
                  {leaderboardWidget && (
                    <div style={{ background:'white', borderRadius:14, padding:'12px 14px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.06)' }}>
                      {leaderboardWidget}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ─────────── MOBILE / TABLET: original single-column layout ─────────── */
        <>
          {/* ── Subject picker ──────────────────────────────────────────────── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:20, fontWeight:900, color:'#1E293B', letterSpacing:'-0.4px' }}>
                {stream === 'alevel' ? 'Choose Your Exam' : 'Subjects'}
              </div>
              <FormatInfoButton />
            </div>
            {stream === 'gcse' && (
              <button
                onClick={() => setEbaccOnly(e => !e)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  background: ebaccOnly ? '#F59E0B' : '#F1F5F9',
                  border: ebaccOnly ? '1.5px solid #D97706' : '1.5px solid #E2E8F0',
                  borderRadius:20, padding:'6px 14px',
                  fontSize:11, fontWeight:800, color: ebaccOnly ? '#FFFFFF' : '#64748B',
                  cursor:'pointer', transition:'all 0.2s',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                ⭐ EBacc{ebaccOnly ? ' ✕' : ''}
              </button>
            )}
          </div>

          {stream === 'gcse' && ebaccOnly && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748B', alignSelf:'center', marginRight:2 }}>Language:</span>
              {cfg.subjects.filter(s => s.mfl).map(s => (
                <button
                  key={s.id}
                  onClick={() => { const next = ebaccLang === s.id ? null : s.id; setEbaccLang(next); saveEbaccLang(next ?? '') }}
                  style={{
                    background: ebaccLang === s.id ? SUBJECT_COLORS[s.id]?.primary ?? '#0F766E' : '#F1F5F9',
                    border: `1.5px solid ${ebaccLang === s.id ? SUBJECT_COLORS[s.id]?.primary ?? '#0F766E' : '#E2E8F0'}`,
                    borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:800,
                    color: ebaccLang === s.id ? '#FFFFFF' : '#64748B',
                    cursor:'pointer', transition:'all 0.2s',
                  }}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginBottom:24 }}>
            {(stream === 'gcse' || stream === 'igcse' || stream === 'ib') ? (
              <GcseSubjectGrid
                subjects={ebaccOnly
                  ? allowedSubjects.filter(s => s.ebacc && (!s.mfl || s.id === ebaccLang))
                  : allowedSubjects}
                navigate={navigate}
                stream={stream}
                C={C}
              />
            ) : (
              <FanDeck subjects={allowedSubjects} stream={stream} navigate={navigate} C={C} />
            )}
            {sub.isFree && visibleSubjects.length > subjectLimit && (
              <FreePlanBanner C={C} stream={stream} navigate={navigate} locked={visibleSubjects.length - subjectLimit} />
            )}
          </div>

          {stream === 'alevel' && (
            <div style={{ marginBottom:20, padding:'12px 14px', background:C.primary+'18', border:`1px solid ${C.primary}30`, borderRadius:12, fontSize:12, color:dark?'#A5B4FC':C.primary, lineHeight:1.5 }}>
              🎓 Questions mirror real UCAT, LNAT, TMUA, ESAT, MAT, PAT, TARA & STEP style and difficulty
            </div>
          )}

          {/* ── University test finder (A-Level only) ─────────────────────── */}
          {stream === 'alevel' && (
            <div style={{ marginBottom:20 }}>
              {uniFinder}
            </div>
          )}

          {/* ── Exam date countdown ─────────────────────────────────────────── */}
          {editingDate ? (
            <div style={{ background:C.card, border:`1.5px solid ${C.primary}40`, borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:C.muted, fontWeight:700 }}>📅 Exam date:</span>
              <input
                type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                style={{ flex:1, minWidth:130, padding:'6px 10px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'#F8FAFC', color:C.navy, fontSize:13, fontFamily:'Inter,sans-serif' }}
              />
              <button onClick={() => saveExamDate(dateInput)} disabled={dateSaving} style={{ background:C.primary, color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:dateSaving?'default':'pointer', opacity:dateSaving?0.7:1, fontFamily:'Inter,sans-serif' }}>{dateSaving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => { setEditingDate(false); setDateError(null) }} style={{ background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Cancel</button>
              {dateError && <span style={{ width:'100%', fontSize:11, color:'#EF4444', fontWeight:600 }}>{dateError}</span>}
            </div>
          ) : days !== null ? (
            <div style={{
              background: days <= 7 ? '#EF444418' : days <= 30 ? '#F59E0B18' : C.primary+'18',
              border: `1px solid ${days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}30`,
              borderRadius:16, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                {days > 0 ? (
                  <>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                      <span style={{ fontSize:48, fontWeight:900, lineHeight:1, color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary }}>{days}</span>
                      <span style={{ fontSize:15, fontWeight:700, color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary }}>day{days===1?'':'s'} to go</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Keep your streak going!</div>
                  </>
                ) : (
                  <span style={{ fontSize:15, fontWeight:700, color:days === 0 ? C.primary : C.muted }}>
                    {days === 0 ? 'Your exam is today! 🎯' : 'Exam date passed'}
                  </span>
                )}
              </div>
              <button onClick={() => { setDateInput(profile?.exam_date ?? ''); setEditingDate(true) }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, lineHeight:1 }}>✏️</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              style={{ width:'100%', background:'transparent', border:`1px dashed ${C.border}`, borderRadius:12, padding:'9px 14px', fontSize:12, color:C.muted, cursor:'pointer', marginBottom:16, textAlign:'left', fontFamily:'Inter,sans-serif' }}
            >
              📅 Set your exam date for a countdown
            </button>
          )}

          {/* ── SRS review nudge ────────────────────────────────────────────── */}
          {dueCount > 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:`${C.secondary ?? C.primary}18`, border:`1px solid ${C.secondary ?? C.primary}40`, borderRadius:14, padding:'11px 16px', marginBottom:14 }}>
              <div>
                <span style={{ fontSize:13, fontWeight:800, color:dark?'#A3E635':C.primary }}>{dueCount} question{dueCount>1?'s':''} due for review</span>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Spaced repetition — answer these first</div>
              </div>
              <button
                onClick={() => navigate(`/${stream}/quiz/${reviewSubjectId}?review=1`)}
                style={{ background:dark?C.secondary:C.primary, color:'white', border:'none', borderRadius:10, padding:'7px 14px', fontWeight:800, cursor:'pointer', fontSize:12, fontFamily:'Inter,sans-serif', flexShrink:0 }}
              >
                Review →
              </button>
            </div>
          )}

          {/* ── Daily mission ────────────────────────────────────────────────── */}
          <div style={{ background:'white', border:'1px solid #F1F5F9', borderRadius:20, padding:'16px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:C.primary+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>⚡</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:'#1E293B', fontSize:14 }}>Daily Mission</div>
              <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Complete 2 more sessions to hit today's goal</div>
              <div style={{ display:'flex', gap:4, marginTop:7 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex:1, height:5, borderRadius:3, background: i<=3 ? C.primary : '#E2E8F0', transition:'background 0.3s' }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Focus session ───────────────────────────────────────────────── */}
          <button
            onClick={startPomodoro}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              background:'white', border:'1px solid #F1F5F9',
              boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
              borderRadius:18, padding:'14px 16px', cursor:'pointer',
              fontFamily:'Inter,sans-serif', textAlign:'left',
            }}
          >
            <span style={{ fontSize:22 }}>🍅</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#1E293B' }}>Start 25-min Focus Session</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Pomodoro timer · 5-min break after</div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.primary }}>Start →</span>
          </button>

          {/* ── Leaderboard link ─────────────────────────────────────────────── */}
          <button
            onClick={() => navigate(`/${stream}/leaderboard`)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              background:'white', border:'1px solid #F1F5F9',
              boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
              borderRadius:18, padding:'14px 16px', cursor:'pointer',
              fontFamily:'Inter,sans-serif', textAlign:'left', marginTop:10,
            }}
          >
            <span style={{ fontSize:22 }}>🏆</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#1E293B' }}>Leaderboard</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Top students by XP this week</div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.primary }}>View →</span>
          </button>
        </>
      )}
    </Shell>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

const EXAM_META = {
  ucat:  { type:'Medicine & Dentistry',              unis:'Oxford · Imperial · UCL · Sheffield · Leeds' },
  lnat:  { type:'Law',                               unis:'Oxford · Cambridge · LSE · UCL · Bristol' },
  tmua:  { type:'Maths & Computer Science',          unis:'Cambridge · UCL · Durham · Warwick · Bath' },
  esat:  { type:'Engineering & Sciences',            unis:'Cambridge · Imperial · Oxford' },
  mat:   { type:'Mathematics (Oxford & Imperial)',   unis:'Oxford · Imperial College London' },
  pat:   { type:'Physics Aptitude Test',             unis:'Oxford (Physics, Engineering, Materials)' },
  tara:  { type:'Critical Thinking & Problem Solving',unis:'Oxford (PPE, E&M, History) · UCL' },
  tsa:   { type:'PPE, Economics, Philosophy',        unis:'Legacy — replaced by TARA from 2026' },
  step:  { type:'Cambridge Mathematics',             unis:'Cambridge — conditional on offer (taken June)' },
}

// ── Free plan banner ─────────────────────────────────────────────────────────

function FreePlanBanner({ C, stream, navigate, locked }) {
  return (
    <div style={{
      marginTop:12, padding:'12px 16px',
      background:'linear-gradient(135deg,#FFF7ED,#FFFBEB)',
      border:'1.5px solid #F59E0B40', borderRadius:14,
      display:'flex', alignItems:'center', gap:12,
    }}>
      <span style={{ fontSize:20, flexShrink:0 }}>🔒</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#92400E', marginBottom:2 }}>
          {locked} subject{locked !== 1 ? 's' : ''} locked on Free plan
        </div>
        <div style={{ fontSize:11, color:'#B45309', lineHeight:1.4 }}>
          Upgrade to Pro to unlock all subjects and unlimited practice.
        </div>
      </div>
      <button
        onClick={() => navigate(`/${stream}/subscription`)}
        style={{
          flexShrink:0, background:'#F59E0B', color:'white',
          border:'none', borderRadius:9, padding:'7px 13px',
          fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif',
        }}
      >
        Upgrade
      </button>
    </div>
  )
}

// ── Format info tooltip ───────────────────────────────────────────────────────

const FORMAT_INFO = [
  { icon:'📝', label:'Quiz',      desc:'10 random questions · timed · scored' },
  { icon:'🃏', label:'Flashcards', desc:'All cards · SRS order · self-rate' },
  { icon:'📋', label:'Mock',      desc:'Full paper · shuffled · submit at end' },
  { icon:'🧠', label:'Learn',     desc:'AI explanations shown upfront · untimed' },
]

function FormatInfoButton() {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position:'relative', display:'inline-flex' }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        aria-label="How do the practice formats differ?"
        style={{
          width:20, height:20, borderRadius:'50%',
          background:'#E2E8F0', border:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:800, color:'#64748B',
          cursor:'pointer', flexShrink:0,
          fontFamily:'Inter,sans-serif',
          WebkitTapHighlightColor:'transparent',
        }}
      >
        i
      </button>
      {visible && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', left:0,
          background:'white', border:'1px solid #E2E8F0',
          borderRadius:14, padding:'12px 14px',
          boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
          zIndex:200, minWidth:220,
          fontFamily:'Inter,sans-serif',
        }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>
            Practice formats
          </div>
          {FORMAT_INFO.map(f => (
            <div key={f.label} style={{ display:'flex', alignItems:'baseline', gap:7, marginBottom:6 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{f.icon}</span>
              <div>
                <span style={{ fontSize:12, fontWeight:800, color:'#1E293B' }}>{f.label}</span>
                <span style={{ fontSize:11, color:'#64748B' }}> — {f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExamRowCard({ subject, C, dark, onClick, onMock, onFlashcards, onLearn }) {
  const SC = SUBJECT_COLORS[subject.id] || C
  const meta = EXAM_META[subject.id] || {}
  return (
    <div style={{
      background:C.card,
      border:`1.5px solid ${SC.primary}25`,
      borderLeft:`4px solid ${subject.deprecated ? '#F59E0B' : SC.primary}`,
      borderRadius:16,
      padding:'18px 18px 14px',
      marginBottom:12,
      opacity: subject.deprecated ? 0.8 : 1,
    }}>
      {subject.deprecated && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#FEF3C7', border:'1px solid #F59E0B50',
          borderRadius:8, padding:'6px 10px', marginBottom:12,
          fontSize:11, color:'#92400E', lineHeight:1.5,
        }}>
          <span style={{fontWeight:900, color:'#D97706'}}>⚠ LEGACY:</span>
          <span>{subject.deprecationNote}</span>
        </div>
      )}
      <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:16}}>
        <div style={{
          width:52,height:52,borderRadius:14,flexShrink:0,
          background:`${SC.primary}18`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:26,
          border:`1px solid ${SC.primary}30`,
          position:'relative',
        }}>
          {subject.emoji}
          {subject.deprecated && (
            <div style={{
              position:'absolute', top:-5, right:-5,
              background:'#F59E0B', color:'#1C0E00',
              fontSize:7, fontWeight:900, letterSpacing:'0.08em',
              padding:'1px 4px', borderRadius:4,
            }}>
              LEGACY
            </div>
          )}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:17,fontWeight:900,color:C.navy,marginBottom:3,letterSpacing:'-0.3px'}}>
            {subject.label}
          </div>
          <div style={{fontSize:13,fontWeight:700,color:SC.primary,marginBottom:5}}>
            {meta.type}
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.5,whiteSpace:'normal'}}>
            {meta.unis}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        <button
          onClick={onClick}
          style={{
            background:SC.primary,color:'white',border:'none',
            borderRadius:10,padding:'10px 6px',
            fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'Inter,sans-serif',
          }}
          onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.12)'}}
          onMouseLeave={e=>{e.currentTarget.style.filter='none'}}
        >
          Practice →
        </button>
        <button
          onClick={onMock}
          style={{
            background:'transparent',border:`1.5px solid ${SC.primary}50`,
            borderRadius:10,padding:'10px 6px',
            fontSize:12,fontWeight:800,color:SC.primary,cursor:'pointer',fontFamily:'Inter,sans-serif',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${SC.primary}15`}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
        >
          Mock Exam
        </button>
        <button
          onClick={onFlashcards}
          style={{
            background:'transparent',border:`1.5px solid ${SC.primary}50`,
            borderRadius:10,padding:'10px 6px',
            fontSize:12,fontWeight:800,color:SC.primary,cursor:'pointer',fontFamily:'Inter,sans-serif',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${SC.primary}15`}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
        >
          Cards 🃏
        </button>
        <button
          onClick={onLearn}
          style={{
            background:'transparent',border:`1.5px solid ${SC.primary}50`,
            borderRadius:10,padding:'10px 6px',
            fontSize:12,fontWeight:800,color:SC.primary,cursor:'pointer',fontFamily:'Inter,sans-serif',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${SC.primary}15`}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
        >
          🧠 Learn
        </button>
      </div>
    </div>
  )
}

function MasteryBadge({ badge }) {
  if (!badge) return null
  const SPEC = {
    bronze: { emoji:'🥉', bg:'#CD7F32', shadow:'#CD7F3255' },
    silver: { emoji:'🥈', bg:'#C0C0C0', shadow:'#C0C0C055' },
    gold:   { emoji:'🥇', bg:'#FBBF24', shadow:'#FBBF2455' },
  }
  const b = SPEC[badge]
  return (
    <div style={{
      position:'absolute', top:-6, right:-6, zIndex:10,
      width:26, height:26, borderRadius:13,
      background:b.bg, boxShadow:`0 2px 8px ${b.shadow}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:15, pointerEvents:'none',
    }}>
      {b.emoji}
    </div>
  )
}

// ── Desktop Subject Card — premium layout, desktop only ──────────────────────

function DesktopSubjectCard({ subject, C, stream, onClick, onMock, onFlashcards, onLearn }) {
  const SC = getColors('gcse', subject.id)
  const accent = SC.primary
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const questions = stream ? getQuestions(stream, subject.id) : []
  const { pct, badge } = useMastery(questions)
  const badgeLabel = badge==='gold'?'🥇':badge==='silver'?'🥈':badge==='bronze'?'🥉':null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background:'white',
        borderRadius:20,
        border:`1.5px solid ${hovered ? accent+'50' : '#E8ECF0'}`,
        boxShadow: hovered
          ? `0 12px 40px ${accent}22, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: pressed ? 'scale(0.985)' : hovered ? 'translateY(-2px)' : 'none',
        transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden',
        display:'flex', flexDirection:'column',
        cursor:'pointer',
      }}
      onClick={onClick}
    >
      {/* Coloured top accent strip */}
      <div style={{ height:4, background:`linear-gradient(90deg, ${accent}, ${accent}88)` }} />

      {/* Card body */}
      <div style={{ padding:'18px 18px 14px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
        {/* Header row: emoji + title + badge */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{
            width:48, height:48, borderRadius:14, flexShrink:0,
            background:`linear-gradient(135deg, ${accent}20, ${accent}10)`,
            border:`1.5px solid ${accent}20`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
          }}>
            {subject.emoji}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1E293B', letterSpacing:'-0.3px', lineHeight:1.2 }}>
                {subject.label}
              </div>
              {badgeLabel && <span style={{ fontSize:14 }}>{badgeLabel}</span>}
            </div>
            {subject.desc && (
              <div style={{ fontSize:11, color:'#94A3B8', marginTop:3, lineHeight:1.4 }}>{subject.desc}</div>
            )}
          </div>
        </div>

        {/* Mastery bar */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Mastery</span>
            <span style={{ fontSize:11, fontWeight:800, color: pct>=75?'#10B981':pct>=50?'#F59E0B':pct>0?accent:'#CBD5E1' }}>
              {pct > 0 ? `${pct}%` : 'Not started'}
            </span>
          </div>
          <div style={{ height:5, borderRadius:999, background:'#F1F5F9', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:999,
              width:`${pct}%`,
              background: pct>=75?'#10B981':pct>=50?'#F59E0B':accent,
              transition:'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Action bar — 3 buttons, stops click propagation */}
      <div
        style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:`1px solid #F1F5F9` }}
        onClick={e => e.stopPropagation()}
      >
        {[
          { label:'Flashcards', icon:'🃏', action: onFlashcards },
          { label:'Mock',       icon:'📋', action: onMock },
          { label:'Learn',      icon:'🧠', action: onLearn },
        ].map((btn, i) => (
          <button
            key={btn.label}
            onClick={e => { e.stopPropagation(); btn.action?.() }}
            style={{
              padding:'11px 6px',
              background:'transparent',
              border:'none',
              borderRight: i < 2 ? '1px solid #F1F5F9' : 'none',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              transition:'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}08`}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize:16 }}>{btn.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color: accent }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SubjectCard({ subject, C, dark, stream, onClick, onMock, onFlashcards, onLearn }) {
  const SC      = getColors(dark ? 'alevel' : 'gcse', subject.id)
  const [pressed, setPressed] = useState(false)
  const questions = stream ? getQuestions(stream, subject.id) : []
  const { badge } = useMastery(questions)
  const [ibTier] = useIBTier(subject.id)
  return (
    <div style={{ position:'relative' }}>
      <MasteryBadge badge={badge} />
      <div
        style={{
          background:'white',
          border:`1.5px solid ${SC.primary}22`,
          borderRadius:16,
          boxShadow: pressed ? `0 2px 8px ${SC.primary}20` : `0 4px 16px ${SC.primary}18`,
          transform: pressed ? 'scale(0.98)' : 'scale(1)',
          transition:'transform 0.12s ease, box-shadow 0.12s ease',
          overflow:'hidden',
        }}
      >
        {/* Main tap area */}
        <button
          onClick={onClick}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          style={{
            width:'100%', background:'none', border:'none',
            padding:'14px 16px', cursor:'pointer',
            display:'flex', alignItems:'center', gap:14,
            fontFamily:'Inter,sans-serif',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          {/* Emoji bubble */}
          <div style={{
            width:52, height:52, flexShrink:0, borderRadius:14,
            background:`linear-gradient(145deg, ${SC.primary}, ${SC.secondary ?? SC.primary}cc)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, boxShadow:`0 4px 12px ${SC.primary}40`,
          }}>
            {subject.emoji}
          </div>

          {/* Text */}
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#1E293B', letterSpacing:'-0.2px', lineHeight:1.2 }}>
              {subject.label}
            </div>
            {stream === 'ib' && (
              <IBTierToggle
                subjectId={subject.id}
                accent={TRACK_COLORS.ib ?? '#5B21B6'}
              />
            )}
            {subject.desc && (
              <div style={{ fontSize:12, color:'#64748B', marginTop:3, lineHeight:1.4 }}>
                {subject.desc}
              </div>
            )}
            {stream === 'igcse' && subject.boards?.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
                {subject.boards.map(b => (
                  <span key={b} style={{
                    fontSize:9, fontWeight:700, color:'#0D9488',
                    background:'#0D948812', border:'1px solid #0D948830',
                    borderRadius:20, padding:'1px 6px', letterSpacing:'0.04em',
                    textTransform:'capitalize',
                  }}>{b}</span>
                ))}
              </div>
            )}
          </div>

          {/* Chevron */}
          <span style={{ fontSize:18, color:`${SC.primary}`, flexShrink:0 }}>›</span>
        </button>

        {/* Action buttons strip */}
        <div style={{
          display:'flex', gap:0,
          borderTop:`1px solid ${SC.primary}12`,
        }}>
          <button
            onClick={onFlashcards}
            style={{
              flex:1, padding:'10px 0',
              background:`${SC.primary}08`,
              border:'none', borderRight:`1px solid ${SC.primary}12`,
              fontSize:12, fontWeight:700, color:SC.primary,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            🃏 Flashcards
          </button>
          <button
            onClick={onMock}
            style={{
              flex:1, padding:'10px 0',
              background:`${SC.primary}08`,
              border:'none', borderRight:`1px solid ${SC.primary}12`,
              fontSize:12, fontWeight:700, color:SC.primary,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            📝 Mock
          </button>
          <button
            onClick={onLearn}
            style={{
              flex:1, padding:'10px 0',
              background:`${SC.primary}08`,
              border:'none',
              fontSize:12, fontWeight:700, color:SC.primary,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            🧠 Learn
          </button>
        </div>
      </div>
    </div>
  )
}

// Builds contiguous groups by subject.group field (null = ungrouped)
function buildSegments(subjects) {
  const segments = []
  let current = null
  for (const s of subjects) {
    const g = s.group ?? null
    if (current && current.group === g) {
      current.subjects.push(s)
    } else {
      current = { group: g, subjects: [s] }
      segments.push(current)
    }
  }
  return segments
}

function GcseSubjectGrid({ subjects, navigate, stream, C }) {
  const [collapsed, setCollapsed] = useState({})
  const { isTablet, isDesktop } = useBreakpoint()
  const segments = buildSegments(subjects)
  const cols = isDesktop ? 3 : isTablet ? 3 : 1

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {segments.map((seg, i) => {
        const isGroup    = !!seg.group
        const isCollapsed = collapsed[seg.group]
        return (
          <div key={seg.group ?? `ungrouped-${i}`}>
            {isGroup && (
              <button
                onClick={() => setCollapsed(prev => ({ ...prev, [seg.group]: !prev[seg.group] }))}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'none', border:'none', borderBottom:'1px solid #F1F5F9',
                  padding:'0 0 10px', marginBottom:12,
                  cursor:'pointer', fontFamily:'Inter,sans-serif',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                <span style={{ fontSize:13, fontWeight:800, color:'#334155', letterSpacing:'0.03em' }}>{seg.group}</span>
                <span style={{ fontSize:13, color:'#94A3B8', transition:'transform 0.2s', display:'inline-block', transform:isCollapsed?'rotate(-90deg)':'rotate(0deg)' }}>▾</span>
              </button>
            )}
            {!isCollapsed && (
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap: isDesktop ? 16 : 12 }}>
                {seg.subjects.map(s => {
                  const tier = stream === 'ib' ? (localStorage.getItem(`nx_ib_tier_${s.id}`) ?? 'sl') : null
                  const tierQ = tier ? `?tier=${tier}` : ''
                  const CardComponent = isDesktop ? DesktopSubjectCard : SubjectCard
                  return (
                    <CardComponent
                      key={s.id}
                      subject={s}
                      C={C}
                      dark={false}
                      stream={stream}
                      onClick={() => navigate(`/${stream}/quiz/${s.id}${tierQ}`)}
                      onMock={() => navigate(`/${stream}/mock/${s.id}${tierQ}`)}
                      onFlashcards={() => navigate(`/${stream}/flashcards/${s.id}${tierQ}`)}
                      onLearn={() => navigate(`/${stream}/learn/${s.id}${tierQ}`)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shell home button — overlaid top-right on every non-home page hero ────────

function HomeBtn({ C, navigate }) {
  const { pathname } = useLocation()
  const { isDesktop } = useBreakpoint()
  if (isDesktop) return null // desktop has sidebar nav + hero action buttons — no need
  const m = pathname.match(/^\/(gcse|alevel|sat|act|ap|psat|igcse|ib)$/)
  if (m) return null // already on home page — don't show
  const stream = pathname.match(/^\/(gcse|alevel|sat|act|ap|psat|igcse|ib)/)?.[1]
  if (!stream) return null
  return (
    <button
      onClick={() => navigate(`/${stream}`)}
      title="Home"
      style={{
        position:'absolute', top:14, right:14,
        width:34, height:34, borderRadius:10,
        background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)',
        border:'1px solid rgba(255,255,255,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', zIndex:10,
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5v-5a1.5 1.5 0 00-3 0v5H4a1 1 0 01-1-1z"
          stroke="white" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

export function Shell({ C, isDark, children, noNav, heroContent, contentMax, noHomeBtn }) {
  const { isDesktop, isTablet } = useBreakpoint()
  const navigate = useNavigate()
  const heroRef  = useRef(null)
  const [heroH, setHeroH] = useState(0)

  useEffect(() => {
    if (isDesktop || !heroRef.current) return
    const obs = new ResizeObserver(entries => {
      setHeroH(entries[0]?.contentRect.height ?? 0)
    })
    obs.observe(heroRef.current)
    return () => obs.disconnect()
  }, [isDesktop, heroContent])

  const css = `
    *{box-sizing:border-box}button{font-family:inherit}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes bounceY{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}
    .animate-slide-up{animation:slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
  `

  if (isDesktop) {
    return (
      <div style={{ minHeight:'100dvh', background:C.bg, fontFamily:'Inter,sans-serif', display:'flex' }}>
        <style>{css}</style>
        {/* Spacer matches fixed rail width */}
        <div style={{ width:180, flexShrink:0 }} />
        <div style={{ flex:1, minHeight:'100dvh', overflowY:'auto', minWidth:0 }}>
          {heroContent && (
            <div style={{
              background:`linear-gradient(135deg, ${C.trackAccent} 0%, ${C.trackAccent}CC 100%)`,
              position:'relative', zIndex:1,
            }}>
              {heroContent}
              {!noHomeBtn && <HomeBtn C={C} navigate={navigate} />}
            </div>
          )}
          <div style={{ padding:'28px 40px 48px 40px', animation:'fadeUp 0.35s ease' }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100dvh', background:C.bg, fontFamily:'Inter,sans-serif', position:'relative', overflowX:'hidden' }}>
      <style>{css}</style>

      {heroContent && (
        <div
          ref={heroRef}
          style={{
            background:`linear-gradient(135deg, ${C.trackAccent} 0%, ${C.trackAccent}CC 100%)`,
            position:'fixed', top:0, left:0, right:0, zIndex:50,
          }}
        >
          {heroContent}
          {!noHomeBtn && <HomeBtn C={C} navigate={navigate} />}
        </div>
      )}

      <div style={{
        position:'relative', zIndex:1,
        ...(isTablet ? { maxWidth:720, margin:'0 auto' } : {}),
        paddingTop: heroH ? heroH + 16 : 16,
        padding:`${heroH ? heroH + 16 : 16}px ${isTablet ? 24 : 16}px calc(${noNav ? 24 : NAV_HEIGHT + 24}px + env(safe-area-inset-bottom, 0px))`,
        animation:'fadeUp 0.35s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

export function Badge({ label, color }) {
  return (
    <span style={{background:color+'20',color,border:`1px solid ${color}40`,borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:800,letterSpacing:'0.07em',textTransform:'uppercase'}}>
      {label}
    </span>
  )
}

export function Streak({ streak }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <span style={{fontSize:18}}>🔥</span>
      <span style={{fontWeight:900,color:'#F97316',fontSize:15}}>{streak}</span>
    </div>
  )
}

export function ProgressBar({ pct, color, height=7 }) {
  return (
    <div style={{background:'rgba(255,255,255,0.2)',borderRadius:8,height,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,background:color,height:'100%',borderRadius:8,transition:'width 0.6s ease'}} />
    </div>
  )
}

export function SectionLabel({ C, children }) {
  return (
    <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>
      {children}
    </div>
  )
}

export function Btn({ onClick, C, children, small, primary }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? C.primary : 'transparent',
      border: `1.5px solid ${primary ? C.primary : C.border}`,
      borderRadius: small ? 8 : 14,
      padding: small ? '5px 12px' : '13px 20px',
      fontSize: small ? 11 : 14,
      fontWeight: 700,
      color: primary ? 'white' : C.muted,
      cursor:'pointer',
    }}>{children}</button>
  )
}

export function IconBtn({ onClick, color, title, children }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:40, height:40, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: pressed ? color + '35' : color + '15',
        border: `1.5px solid ${color}40`,
        borderRadius:12,
        cursor:'pointer',
        padding:0,
        transform: pressed ? 'scale(0.88)' : 'scale(1)',
        transition:'transform 0.1s ease, background 0.1s',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      {children}
    </button>
  )
}

function HeroIconBtn({ onClick, title, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position:'relative', display:'inline-flex', flexShrink:0 }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={title}
        style={{
          width:36, height:36, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: hovered ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.18)',
          backdropFilter:'blur(6px)',
          border:'1px solid rgba(255,255,255,0.3)',
          borderRadius:10, cursor:'pointer', padding:0,
          WebkitTapHighlightColor:'transparent',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition:'transform 0.15s ease, background 0.15s ease',
        }}
      >
        {children}
      </button>
      {hovered && title && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 7px)', left:'50%',
          transform:'translateX(-50%)',
          background:'rgba(15,23,42,0.88)', backdropFilter:'blur(8px)',
          color:'white', fontSize:11, fontWeight:700,
          borderRadius:7, padding:'4px 10px',
          whiteSpace:'nowrap', pointerEvents:'none',
          fontFamily:'Inter,sans-serif', letterSpacing:'0.01em',
          boxShadow:'0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {title}
          {/* caret */}
          <div style={{
            position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)',
            width:0, height:0,
            borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
            borderTop:'5px solid rgba(15,23,42,0.88)',
          }} />
        </div>
      )}
    </div>
  )
}

function SignInIcon({ color, size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="10 17 15 12 10 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="15" y1="12" x2="3" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}

function MailIcon({ color, size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SignOutIcon({ color, size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}

function SwitchIcon({ color, size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 16V4m0 0L3 8m4-4 4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ScrollBar({ C }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (pct >= 98) return null

  return (
    <div style={{
      position: 'fixed',
      right: 5,
      top: '10%',
      bottom: '10%',
      width: 3,
      borderRadius: 3,
      background: C.border + '60',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: pct + '%',
        background: C.primary,
        borderRadius: 3,
        transition: 'height 0.12s ease',
        boxShadow: `0 0 6px ${C.primary}80`,
      }} />
      {/* chevron hint at bottom */}
      <div style={{
        position: 'absolute',
        bottom: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        opacity: pct < 20 ? 1 : 0,
        transition: 'opacity 0.4s ease',
        animation: 'bounceY 1.4s ease-in-out infinite',
      }}>
        <div style={{ width: 5, height: 5, borderRight: `2px solid ${C.primary}`, borderBottom: `2px solid ${C.primary}`, transform: 'rotate(45deg)' }} />
        <div style={{ width: 5, height: 5, borderRight: `2px solid ${C.primary}80`, borderBottom: `2px solid ${C.primary}80`, transform: 'rotate(45deg)', marginTop: -3 }} />
      </div>
    </div>
  )
}

function row(justify='flex-start', align='center', extra={}) {
  return { display:'flex', justifyContent:justify, alignItems:align, ...extra }
}
