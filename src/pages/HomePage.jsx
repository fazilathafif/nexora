/**
 * HomePage — subject/exam picker shown after stream selection.
 * Reads stream from URL param so bookmarking works.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
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
  bg:'#F0FDFA', card:'#FFFFFF', navy:'#134E4A', soft:'#CCFBF1',
  muted:'#6B7280', success:'#10B981', border:'#D1FAE5',
}
const ALEVEL_COLORS = {
  primary:   '#7C3AED',
  secondary: '#F43F5E',
  accent:    '#06B6D4',
  bg:        '#0E0B1F',
  card:      '#181432',
  navy:      '#F0F4FF',
  soft:      '#261E4E',
  muted:     '#A78BFA',
  success:   '#4ADE80',
  border:    '#352B6D',
}

const SUBJECT_COLORS = {
  // ── GCSE (light) ──────────────────────────────────────────────────────────
  maths: {
    primary:'#3B82F6', secondary:'#6366F1', accent:'#BFDBFE',
    bg:'#EFF6FF', card:'#FFFFFF', navy:'#1E3A5F', soft:'#DBEAFE',
    muted:'#6B7280', success:'#10B981', border:'#BFDBFE',
  },
  english: {
    primary:'#D97706', secondary:'#F59E0B', accent:'#FDE68A',
    bg:'#FFFBEB', card:'#FFFFFF', navy:'#78350F', soft:'#FEF3C7',
    muted:'#6B7280', success:'#10B981', border:'#FDE68A',
  },
  science: {
    primary:'#0F766E', secondary:'#06B6D4', accent:'#A7F3D0',
    bg:'#F0FDFA', card:'#FFFFFF', navy:'#134E4A', soft:'#CCFBF1',
    muted:'#6B7280', success:'#10B981', border:'#D1FAE5',
  },
  verbal: {
    primary:'#DB2777', secondary:'#EC4899', accent:'#FBCFE8',
    bg:'#FDF2F8', card:'#FFFFFF', navy:'#500724', soft:'#FCE7F3',
    muted:'#6B7280', success:'#10B981', border:'#FBCFE8',
  },
  // ── A-Level (dark) ────────────────────────────────────────────────────────
  ucat: {
    primary:'#06B6D4', secondary:'#0EA5E9', accent:'#67E8F9',
    bg:'#030D1A', card:'#071B2C', navy:'#E0F9FF', soft:'#0B2840',
    muted:'#67C8D6', success:'#4ADE80', border:'#0E3B52',
  },
  lnat: {
    primary:'#F59E0B', secondary:'#FBBF24', accent:'#FDE68A',
    bg:'#120900', card:'#1C0E00', navy:'#FEFCE8', soft:'#2A1800',
    muted:'#C9943A', success:'#4ADE80', border:'#3D2400',
  },
  tmua: {
    primary:'#818CF8', secondary:'#6366F1', accent:'#C7D2FE',
    bg:'#0E0B1F', card:'#131029', navy:'#EEF2FF', soft:'#1C1840',
    muted:'#A5B4FC', success:'#4ADE80', border:'#2E284A',
  },
  esat: {
    primary:'#F97316', secondary:'#FB923C', accent:'#FDBA74',
    bg:'#150A00', card:'#201000', navy:'#FFF4E8', soft:'#2E1700',
    muted:'#C47B3E', success:'#4ADE80', border:'#3D2000',
  },
  tsa: {
    primary:'#A855F7', secondary:'#C084FC', accent:'#E9D5FF',
    bg:'#0F0521', card:'#180A32', navy:'#F5F3FF', soft:'#200D3F',
    muted:'#C084FC', success:'#4ADE80', border:'#3B1B66',
  },
  step: {
    primary:'#10B981', secondary:'#34D399', accent:'#6EE7B7',
    bg:'#021412', card:'#041E1B', navy:'#ECFDF5', soft:'#062E28',
    muted:'#6EE7B7', success:'#4ADE80', border:'#084E44',
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
  const [showAuth, setShowAuth]       = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput,   setDateInput]   = useState(profile?.exam_date ?? '')

  if (!cfg) { navigate('/'); return null }

  const isAnon    = !user?.email || user?.isGuest
  const xp        = profile?.xp     ?? 0
  const streak    = profile?.streak  ?? 0
  const level     = Math.floor(xp / 150) + 1
  const pct       = (xp % 150) / 150 * 100
  const days      = daysUntil(profile?.exam_date)

  // Compute total SRS due count across all subjects in this stream
  const dueCount  = useMemo(() => {
    const allQs = cfg.subjects.flatMap(s => getQuestions(stream, s.id))
    return getDueCount(allQs)
  }, [stream, cfg.subjects])

  // First subject that actually has due questions (so Review → lands in the right place)
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

  function switchStream() {
    navigate('/switch')
  }

  return (
    <Shell C={C}>
      {/* Header */}
      <div style={row('space-between','flex-start',{marginBottom:20})}>
        <div>
          <div style={{fontSize:28,fontWeight:900,color:C.navy,letterSpacing:'-0.8px',fontFamily:"'Playfair Display', Georgia, serif"}}>
            Nexora <span style={{color:C.primary}}>✦</span>
          </div>
          <div style={row('flex-start','center',{gap:6,marginTop:4})}>
            <Badge label={cfg.label} color={C.primary} />
            <span style={{fontSize:11,color:C.muted}}>{cfg.years}</span>
          </div>
        </div>
        <div style={row('flex-end','center',{gap:6})}>
          <Streak streak={streak} />
          {isSupabaseConfigured && isAnon
            ? <IconBtn onClick={() => setShowAuth(true)} color={C.primary} title="Sign In">
                <SignInIcon color={C.primary} />
              </IconBtn>
            : isSupabaseConfigured && !isAnon
              ? <IconBtn onClick={signOut} color={C.muted} title="Sign Out">
                  <SignOutIcon color={C.muted} />
                </IconBtn>
              : null
          }
          <IconBtn onClick={switchStream} color={C.primary} title="Switch stream">
            <SwitchIcon color={C.primary} />
          </IconBtn>
        </div>
      </div>

      {showAuth && <AuthModal C={C} dark={dark} onClose={() => setShowAuth(false)} />}
      <WelcomeModal user={user} C={C} dark={dark} />

      {/* ── Subject / exam picker (PRIMARY — top of page) ─────────────────── */}
      <SectionLabel C={C}>{stream === 'alevel' ? 'Choose Your Exam' : 'Choose Subject'}</SectionLabel>
      <div style={{marginBottom:18}}>
        <FanDeck subjects={cfg.subjects} stream={stream} navigate={navigate} C={C} />
      </div>

      {stream === 'alevel' && (
        <div style={{marginBottom:20,padding:'12px 14px',background:C.primary+'18',border:`1px solid ${C.primary}30`,borderRadius:12,fontSize:12,color:dark?'#A5B4FC':C.primary,lineHeight:1.5}}>
          🎓 Questions mirror real UCAT, LNAT, TMUA, ESAT, TSA & STEP style and difficulty
        </div>
      )}

      {/* ── Exam date countdown ───────────────────────────────────────────── */}
      {editingDate ? (
        <div style={{background:C.card,border:`1.5px solid ${C.primary}40`,borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:12,color:C.muted,fontWeight:700}}>📅 Exam date:</span>
          <input
            type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
            style={{flex:1,minWidth:130,padding:'6px 10px',borderRadius:8,border:`1.5px solid ${C.border}`,background:dark?'#261E4E':'#F8FAFC',color:C.navy,fontSize:13,fontFamily:'Inter,sans-serif'}}
          />
          <button onClick={() => saveExamDate(dateInput)} disabled={dateSaving} style={{background:C.primary,color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:dateSaving?'default':'pointer',opacity:dateSaving?0.7:1,fontFamily:'Inter,sans-serif'}}>{dateSaving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => { setEditingDate(false); setDateError(null) }} style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
          {dateError && <span style={{width:'100%',fontSize:11,color:'#EF4444',fontWeight:600}}>{dateError}</span>}
        </div>
      ) : days !== null ? (
        <div style={{
          background: days <= 7 ? '#EF444418' : days <= 30 ? '#F59E0B18' : C.primary+'18',
          border: `1px solid ${days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}30`,
          borderRadius:16,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <div>
            {days > 0 ? (
              <>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                  <span style={{fontSize:48,fontWeight:900,lineHeight:1,color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}}>
                    {days}
                  </span>
                  <span style={{fontSize:15,fontWeight:700,color:days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}}>
                    day{days===1?'':'s'} to go
                  </span>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Keep your streak going!</div>
              </>
            ) : (
              <span style={{fontSize:15,fontWeight:700,color:days === 0 ? C.primary : C.muted}}>
                {days === 0 ? 'Your exam is today! 🎯' : 'Exam date passed'}
              </span>
            )}
          </div>
          <button onClick={() => { setDateInput(profile?.exam_date ?? ''); setEditingDate(true) }} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,lineHeight:1}}>✏️</button>
        </div>
      ) : (
        <button
          onClick={() => setEditingDate(true)}
          style={{width:'100%',background:'transparent',border:`1px dashed ${C.border}`,borderRadius:12,padding:'9px 14px',fontSize:12,color:C.muted,cursor:'pointer',marginBottom:16,textAlign:'left',fontFamily:'Inter,sans-serif'}}
        >
          📅 Set your exam date for a countdown
        </button>
      )}

      {/* ── Spaced-repetition review nudge ───────────────────────────────── */}
      {dueCount > 0 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:`${C.secondary ?? C.primary}18`,border:`1px solid ${C.secondary ?? C.primary}40`,borderRadius:14,padding:'11px 16px',marginBottom:14}}>
          <div>
            <span style={{fontSize:13,fontWeight:800,color:dark?'#A3E635':C.primary}}>{dueCount} question{dueCount>1?'s':''} due for review</span>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>Spaced repetition — answer these first</div>
          </div>
          <button
            onClick={() => navigate(`/${stream}/quiz/${reviewSubjectId}?review=1`)}
            style={{background:dark?C.secondary:C.primary,color:'white',border:'none',borderRadius:10,padding:'7px 14px',fontWeight:800,cursor:'pointer',fontSize:12,fontFamily:'Inter,sans-serif',flexShrink:0}}
          >
            Review →
          </button>
        </div>
      )}

      {/* ── XP banner ────────────────────────────────────────────────────── */}
      <div style={{
        background: dark
          ? `linear-gradient(135deg,${C.primary},#1E1B4B)`
          : `linear-gradient(135deg,${C.primary},#0F766E)`,
        borderRadius:20, padding:'18px 20px', marginBottom:18,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />
        <div style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:2}}>Level {level} Scholar</div>
        <div style={{fontSize:52,fontWeight:900,color:'white',marginBottom:8,lineHeight:1}}>{xp} XP</div>
        <ProgressBar pct={pct} color={dark ? C.secondary : C.accent} />
        <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>
          {Math.round(150 - (xp % 150))} XP to Level {level + 1}
        </div>
      </div>

      {/* ── Daily mission ────────────────────────────────────────────────── */}
      <div style={{background:C.card,borderRadius:20,padding:'16px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:14,boxShadow:dark?'0 4px 20px rgba(0,0,0,0.35)':'0 4px 20px rgba(0,0,0,0.07)'}}>
        <div style={{width:44,height:44,borderRadius:'50%',background:C.primary+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>⚡</div>
        <div>
          <div style={{fontWeight:800,color:C.navy,fontSize:14}}>Daily Mission</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Complete 2 more sessions to hit today's goal</div>
          <div style={{display:'flex',gap:4,marginTop:6}}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{width:20,height:6,borderRadius:3,background: i<=3 ? C.primary : C.border,transition:'background 0.3s'}} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Focus session launcher ───────────────────────────────────────── */}
      <button
        onClick={startPomodoro}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:12,
          background: dark ? '#1a1740' : 'white',
          boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)',
          border: 'none',
          borderRadius:18, padding:'14px 16px', cursor:'pointer',
          fontFamily:'Inter,sans-serif', marginBottom:8, textAlign:'left',
        }}
      >
        <span style={{fontSize:22}}>🍅</span>
        <div>
          <div style={{fontSize:13, fontWeight:800, color:C.navy}}>Start 25-min Focus Session</div>
          <div style={{fontSize:11, color:C.muted, marginTop:1}}>Pomodoro timer · 5-min break after</div>
        </div>
        <span style={{marginLeft:'auto', fontSize:12, fontWeight:700, color:C.primary}}>Start →</span>
      </button>
    </Shell>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

const EXAM_META = {
  ucat:  { type:'Medicine & Dentistry',     unis:'Oxford · Imperial · UCL · Sheffield · Leeds' },
  lnat:  { type:'Law',                      unis:'Oxford · Cambridge · LSE · UCL · Bristol' },
  tmua:  { type:'Maths & Computer Science', unis:'Cambridge · UCL · Durham · Warwick' },
  esat:  { type:'Engineering & Sciences',   unis:'Cambridge · Imperial · Oxford (Physics)' },
  tsa:   { type:'PPE, Economics, Philosophy',unis:'Oxford · UCL · Cambridge (select)' },
  step:  { type:'Cambridge Mathematics',    unis:'Cambridge conditional offer requirement' },
}

function ExamRowCard({ subject, C, dark, onClick, onMock, onFlashcards }) {
  const SC = SUBJECT_COLORS[subject.id] || C
  const meta = EXAM_META[subject.id] || {}
  return (
    <div style={{
      background:C.card,
      border:`1.5px solid ${SC.primary}25`,
      borderLeft:`4px solid ${SC.primary}`,
      borderRadius:16,
      padding:'18px 18px 14px',
      marginBottom:12,
    }}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:16}}>
        <div style={{
          width:52,height:52,borderRadius:14,flexShrink:0,
          background:`${SC.primary}18`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:26,
          border:`1px solid ${SC.primary}30`,
        }}>
          {subject.emoji}
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

function SubjectCard({ subject, C, dark, compact, onClick, onMock, onFlashcards }) {
  const SC = getColors(dark ? 'alevel' : 'gcse', subject.id)
  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column'}}>
      <button
        onClick={onClick}
        style={{background:C.card,border:`1.5px solid ${SC.primary}40`,borderRadius:14,padding:compact?'12px 8px':'16px 10px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all 0.2s',flex:1}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=SC.primary;e.currentTarget.style.background=SC.primary+'18'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=SC.primary+'40';e.currentTarget.style.background=C.card}}
      >
        <span style={{fontSize:compact?20:26}}>{subject.emoji}</span>
        <span style={{fontSize:12,fontWeight:800,color:SC.primary,textAlign:'center'}}>{subject.label}</span>
        <span style={{fontSize:9,color:C.muted,textAlign:'center',lineHeight:1.3}}>{subject.desc}</span>
      </button>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginTop:4}}>
        <button
          onClick={onFlashcards}
          title="Flashcards"
          style={{background:'transparent',border:`1px solid ${SC.primary}40`,borderRadius:8,padding:'4px 0',fontSize:9,fontWeight:700,color:SC.primary,cursor:'pointer',fontFamily:'Inter,sans-serif',letterSpacing:'0.04em'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=SC.primary;e.currentTarget.style.background=SC.primary+'15'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=SC.primary+'40';e.currentTarget.style.background='transparent'}}
        >
          CARDS 🃏
        </button>
        <button
          onClick={onMock}
          title="Mock exam"
          style={{background:'transparent',border:`1px solid ${SC.primary}40`,borderRadius:8,padding:'4px 0',fontSize:9,fontWeight:700,color:SC.primary,cursor:'pointer',fontFamily:'Inter,sans-serif',letterSpacing:'0.04em'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=SC.primary;e.currentTarget.style.background=SC.primary+'15'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=SC.primary+'40';e.currentTarget.style.background='transparent'}}
        >
          MOCK EXAM
        </button>
      </div>
    </div>
  )
}

export function Shell({ C, children, noNav }) {
  const bgR    = parseInt((C.bg || '#f').replace('#', '').slice(0, 2), 16)
  const isDark = bgR < 50
  const bgGrad = isDark
    ? `linear-gradient(165deg, #090318 0%, ${C.bg} 100%)`
    : `linear-gradient(165deg, #FFFCF9 0%, ${C.bg} 65%)`
  return (
    <div style={{ minHeight:'100dvh', background:bgGrad, fontFamily:'Inter,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button{font-family:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounceY{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}
      `}</style>
      <ScrollBar C={C} />
      <div style={{
        width:'100%', maxWidth:520, margin:'0 auto',
        padding:`20px 16px calc(${noNav ? 24 : NAV_HEIGHT + 24}px + env(safe-area-inset-bottom, 0px))`,
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
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:40, height:40,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: color + '15',
        border: `1.5px solid ${color}30`,
        borderRadius:12,
        cursor:'pointer',
        padding:0,
        transition:'background 0.2s',
        WebkitTapHighlightColor:'transparent',
      }}
      onMouseEnter={e => e.currentTarget.style.background = color + '28'}
      onMouseLeave={e => e.currentTarget.style.background = color + '15'}
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
