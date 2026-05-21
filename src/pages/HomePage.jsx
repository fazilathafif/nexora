/**
 * HomePage — subject/exam picker shown after stream selection.
 * Reads stream from URL param so bookmarking works.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { UNIVERSITIES, getCoursesForUni, getTestsForCourse } from '../data/uniMapping.js'
import { getEbaccLang, saveEbaccLang } from '../data/examBoards.js'
import { upsertProfile } from '../lib/db.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getDueCount, getDueIds } from '../lib/srs.js'
import { NAV_HEIGHT } from '../styles/tokens.js'
import AuthModal from '../components/AuthModal.jsx'
import WelcomeModal from '../components/WelcomeModal.jsx'
import FanDeck from '../components/FanDeck.jsx'

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

export function getColors(stream, subject) {
  if (subject && SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject]
  return stream === 'gcse' ? GCSE_COLORS : ALEVEL_COLORS
}

export default function HomePage({ user, profile, refreshProfile, signOut, startPomodoro }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const cfg        = STREAM_CONFIG[stream]
  const C          = getColors(stream)
  const dark       = stream === 'alevel'
  const [showAuth, setShowAuth]           = useState(false)
  const [editingDate, setEditingDate]     = useState(false)
  const [dateInput,   setDateInput]       = useState(profile?.exam_date ?? '')
  const [ebaccOnly,   setEbaccOnly]       = useState(false)
  const [ebaccLang,   setEbaccLang]       = useState(() => getEbaccLang())
  const [finderOpen,  setFinderOpen]      = useState(false)
  const [finderUni,   setFinderUni]       = useState('')
  const [finderCourse,setFinderCourse]    = useState('')

  if (!cfg) { navigate('/'); return null }

  const isAnon    = !user?.email || user?.isGuest
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
  const heroEl = (
    <div style={{ padding:'max(18px, env(safe-area-inset-top, 18px)) 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:'white', letterSpacing:'-0.5px', fontFamily:"'Playfair Display', Georgia, serif" }}>
            Nexora <span style={{ opacity:0.65 }}>✦</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <span style={{ background:'rgba(255,255,255,0.22)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:800, letterSpacing:'0.07em' }}>
              {cfg.label.replace(' Track','').toUpperCase()}
            </span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{cfg.years}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:20 }}>🔥</span>
            <span style={{ fontWeight:900, color:'white', fontSize:17 }}>{streak}</span>
          </div>
          {isSupabaseConfigured && isAnon
            ? <HeroIconBtn onClick={() => setShowAuth(true)} title="Sign In"><SignInIcon color="white" size={18} /></HeroIconBtn>
            : isSupabaseConfigured && !isAnon
              ? <HeroIconBtn onClick={signOut} title="Sign Out"><SignOutIcon color="white" size={18} /></HeroIconBtn>
              : null
          }
          <HeroIconBtn onClick={switchStream} title="Switch stream"><SwitchIcon color="white" size={18} /></HeroIconBtn>
        </div>
      </div>

      {/* XP progress bar */}
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

  return (
    <Shell C={C} heroContent={heroEl}>
      {showAuth && <AuthModal C={C} dark={dark} onClose={() => setShowAuth(false)} />}
      <WelcomeModal user={user} C={C} dark={dark} />

      {/* ── Subject picker ──────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:20, fontWeight:900, color:'#1E293B', letterSpacing:'-0.4px' }}>
          {stream === 'alevel' ? 'Choose Your Exam' : 'Subjects'}
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
        {stream === 'gcse' ? (
          <GcseSubjectGrid
            subjects={ebaccOnly
              ? cfg.subjects.filter(s => s.ebacc && (!s.mfl || s.id === ebaccLang))
              : cfg.subjects}
            navigate={navigate}
            stream={stream}
            C={C}
          />
        ) : (
          <FanDeck subjects={cfg.subjects} stream={stream} navigate={navigate} C={C} />
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

function ExamRowCard({ subject, C, dark, onClick, onMock, onFlashcards }) {
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
      </div>
    </div>
  )
}

function SubjectCard({ subject, C, dark, onClick, onMock, onFlashcards }) {
  const SC = getColors(dark ? 'alevel' : 'gcse', subject.id)
  const [pressed, setPressed] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <button
        onClick={onClick}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          background: `linear-gradient(145deg, ${SC.primary}, ${SC.secondary ?? SC.primary}cc)`,
          border:'none', borderRadius:20, padding:'18px 14px 16px',
          cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8,
          boxShadow: pressed ? `0 2px 8px ${SC.primary}40` : `0 6px 20px ${SC.primary}38`,
          transform: pressed ? 'scale(0.96)' : 'scale(1)',
          transition:'transform 0.12s ease, box-shadow 0.12s ease',
          WebkitTapHighlightColor:'transparent', width:'100%',
        }}
      >
        <span style={{ fontSize:34, lineHeight:1 }}>{subject.emoji}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:900, color:'white', lineHeight:1.2, letterSpacing:'-0.2px' }}>{subject.label}</div>
          {subject.desc && <div style={{ fontSize:9, color:'rgba(255,255,255,0.68)', lineHeight:1.35, marginTop:3 }}>{subject.desc}</div>}
        </div>
      </button>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
        <button
          onClick={onFlashcards}
          style={{ background:`${SC.primary}10`, border:`1.5px solid ${SC.primary}28`, borderRadius:10, padding:'7px 0', fontSize:10, fontWeight:700, color:SC.primary, cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}
        >
          Cards 🃏
        </button>
        <button
          onClick={onMock}
          style={{ background:`${SC.primary}10`, border:`1.5px solid ${SC.primary}28`, borderRadius:10, padding:'7px 0', fontSize:10, fontWeight:700, color:SC.primary, cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}
        >
          Mock
        </button>
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
  const segments = buildSegments(subjects)

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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {seg.subjects.map(s => (
                  <SubjectCard
                    key={s.id}
                    subject={s}
                    C={C}
                    dark={false}
                    onClick={() => navigate(`/${stream}/quiz/${s.id}`)}
                    onMock={() => navigate(`/${stream}/mock/${s.id}`)}
                    onFlashcards={() => navigate(`/${stream}/flashcards/${s.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function Shell({ C, children, noNav, heroContent }) {
  const heroH = heroContent ? 188 : 64
  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(160deg,#FF6B35 0%,#FF3CAC 52%,#7B2FBE 100%)', fontFamily:'Inter,sans-serif', position:'relative', overflowX:'hidden' }}>
      <style>{`*{box-sizing:border-box}button{font-family:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounceY{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}
        .animate-slide-up{animation:slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* Bokeh */}
      {[
        { w:280, h:280, top:'-6%',  left:'-14%', r:'255,200,80',  o:0.45, blur:85 },
        { w:200, h:200, top:'2%',   right:'-7%', r:'255,80,200',  o:0.38, blur:60 },
        { w:140, h:140, top:'20%',  left:'8%',   r:'255,255,160', o:0.20, blur:40 },
        { w:220, h:220, top:'10%',  right:'-4%', r:'200,60,255',  o:0.26, blur:70 },
      ].map((b, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%',
          width:b.w, height:b.h,
          background:`rgba(${b.r},${b.o})`, filter:`blur(${b.blur}px)`,
          top:b.top, left:b.left, right:b.right, pointerEvents:'none',
        }} />
      ))}

      <ScrollBar C={C} />

      {/* Gradient hero band */}
      <div style={{ height:heroH, position:'relative', zIndex:1, overflow:'hidden' }}>
        {heroContent}
      </div>

      {/* White content panel */}
      <div style={{ position:'relative', zIndex:1, background:'white', borderRadius:'28px 28px 0 0', minHeight:`calc(100dvh - ${heroH - 24}px)`, boxShadow:'0 -8px 40px rgba(0,0,0,0.16)' }}>
        <div style={{ width:36, height:4, background:'#E2E8F0', borderRadius:2, margin:'12px auto 0' }} />
        <div style={{
          width:'100%',
          padding:`16px 16px calc(${noNav ? 24 : NAV_HEIGHT + 24}px + env(safe-area-inset-bottom, 0px))`,
          animation:'fadeUp 0.35s ease',
        }}>
          {children}
        </div>
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
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:36, height:36, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)',
        border:'1px solid rgba(255,255,255,0.3)',
        borderRadius:10, cursor:'pointer', padding:0,
        WebkitTapHighlightColor:'transparent',
      }}
    >
      {children}
    </button>
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
