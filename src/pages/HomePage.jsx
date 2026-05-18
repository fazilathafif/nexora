/**
 * HomePage — subject/exam picker shown after stream selection.
 * Reads stream from URL param so bookmarking works.
 */

import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { STREAM_CONFIG, getQuestions } from '../data/questions.js'
import { upsertProfile } from '../lib/db.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getDueCount } from '../lib/srs.js'
import AuthModal from '../components/AuthModal.jsx'
import WelcomeModal from '../components/WelcomeModal.jsx'

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
  primary:'#4F46E5', secondary:'#A3E635', accent:'#F0ABFC',
  bg:'#0F0F1A', card:'#1A1A2E', navy:'#E2E8F0', soft:'#1E1E3A',
  muted:'#94A3B8', success:'#4ADE80', border:'#2D2D50',
}

export function getColors(stream) {
  return stream === 'gcse' ? GCSE_COLORS : ALEVEL_COLORS
}

export default function HomePage({ user, profile, refreshProfile, signOut }) {
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

  async function saveExamDate(date) {
    await upsertProfile(user.id, { exam_date: date || null })
    await refreshProfile?.()
    setEditingDate(false)
  }

  async function switchStream() {
    if (user) await upsertProfile(user.id, { stream: null })
    await refreshProfile?.()
    navigate('/')
  }

  return (
    <Shell C={C}>
      {/* Header */}
      <div style={row('space-between','flex-start',{marginBottom:20})}>
        <div>
          <div style={{fontSize:26,fontWeight:900,color:C.navy,letterSpacing:'-0.5px',fontFamily:"'Playfair Display', Georgia, serif"}}>
            Nexora <span style={{color:C.primary}}>✦</span>
          </div>
          <div style={row('flex-start','center',{gap:6,marginTop:4})}>
            <Badge label={cfg.label} color={C.primary} />
            <span style={{fontSize:11,color:C.muted}}>{cfg.years}</span>
          </div>
        </div>
        <div style={row('flex-end','center',{gap:8})}>
          <Streak streak={streak} />
          {isSupabaseConfigured && isAnon
            ? <Btn onClick={() => setShowAuth(true)} C={C} small primary>Sign In</Btn>
            : isSupabaseConfigured && !isAnon
              ? <Btn onClick={signOut} C={C} small>Sign Out</Btn>
              : null
          }
          <Btn onClick={switchStream} C={C} small>Switch</Btn>
        </div>
      </div>

      {showAuth && <AuthModal C={C} dark={dark} onClose={() => setShowAuth(false)} />}
      <WelcomeModal user={user} C={C} dark={dark} />

      {/* XP banner */}
      <div style={{
        background: dark
          ? `linear-gradient(135deg,${C.primary},#312E81)`
          : `linear-gradient(135deg,${C.primary},#0F766E)`,
        borderRadius:20, padding:'18px 20px', marginBottom:18,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />
        <div style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:2}}>Level {level} Scholar</div>
        <div style={{fontSize:30,fontWeight:900,color:'white',marginBottom:8}}>{xp} XP</div>
        <ProgressBar pct={pct} color={dark ? C.secondary : C.accent} />
        <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>
          {Math.round(150 - (xp % 150))} XP to Level {level + 1}
        </div>
      </div>

      {/* Exam date countdown */}
      {editingDate ? (
        <div style={{background:C.card,border:`1.5px solid ${C.primary}40`,borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:12,color:C.muted,fontWeight:700}}>📅 Exam date:</span>
          <input
            type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
            style={{flex:1,minWidth:130,padding:'6px 10px',borderRadius:8,border:`1.5px solid ${C.border}`,background:dark?'#1A1A2E':'#F8FAFC',color:C.navy,fontSize:13,fontFamily:'Inter,sans-serif'}}
          />
          <button onClick={() => saveExamDate(dateInput)} style={{background:C.primary,color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
          <button onClick={() => setEditingDate(false)} style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
        </div>
      ) : days !== null ? (
        <div style={{
          background: days <= 7 ? '#EF444418' : days <= 30 ? '#F59E0B18' : C.primary+'18',
          border: `1px solid ${days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}30`,
          borderRadius:14,padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <div>
            <span style={{fontSize:13,fontWeight:700,color: days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : C.primary}}>
              {days > 0 ? `${days} day${days===1?'':'s'} until your exam` : days === 0 ? 'Your exam is today! 🎯' : 'Exam date passed'}
            </span>
            {days > 0 && <div style={{fontSize:11,color:C.muted,marginTop:1}}>Keep your streak going!</div>}
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

      {/* Daily mission */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:14}}>
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

      {/* Spaced-repetition review nudge */}
      {dueCount > 0 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:`${C.secondary ?? C.primary}18`,border:`1px solid ${C.secondary ?? C.primary}40`,borderRadius:14,padding:'11px 16px',marginBottom:14}}>
          <div>
            <span style={{fontSize:13,fontWeight:800,color:dark?'#A3E635':C.primary}}>{dueCount} question{dueCount>1?'s':''} due for review</span>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>Spaced repetition — answer these first</div>
          </div>
          <button
            onClick={() => navigate(`/${stream}/quiz/${cfg.subjects[0].id}?review=1`)}
            style={{background:dark?'#A3E635':C.primary,color:dark?'#0F0F1A':'white',border:'none',borderRadius:10,padding:'7px 14px',fontWeight:800,cursor:'pointer',fontSize:12,fontFamily:'Inter,sans-serif',flexShrink:0}}
          >
            Review →
          </button>
        </div>
      )}

      {/* Subject / exam grid */}
      <SectionLabel C={C}>{stream === 'alevel' ? 'Choose Exam' : 'Choose Subject'}</SectionLabel>
      <div style={{
        display:'grid',
        gridTemplateColumns: cfg.subjects.length > 4 ? '1fr 1fr 1fr' : '1fr 1fr',
        gap:10, marginBottom:18,
      }}>
        {cfg.subjects.map(s => (
          <SubjectCard
            key={s.id} subject={s} C={C} dark={dark}
            compact={cfg.subjects.length > 4}
            onClick={() => navigate(`/${stream}/quiz/${s.id}`)}
            onMock={() => navigate(`/${stream}/mock/${s.id}`)}
          />
        ))}
      </div>

      {/* Progress + Plan links */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:0}}>
        <button
          onClick={() => navigate(`/${stream}/progress`)}
          style={{background:'transparent',border:`1.5px solid ${C.border}`,borderRadius:14,padding:'13px',fontSize:13,fontWeight:700,color:C.muted,cursor:'pointer'}}
        >
          Progress 📊
        </button>
        <button
          onClick={() => navigate(`/${stream}/plan`)}
          style={{background:`${C.primary}18`,border:`1.5px solid ${C.primary}40`,borderRadius:14,padding:'13px',fontSize:13,fontWeight:700,color:C.primary,cursor:'pointer'}}
        >
          Study Plan 📅
        </button>
      </div>

      {stream === 'alevel' && (
        <div style={{marginTop:14,padding:'12px 14px',background:C.primary+'18',border:`1px solid ${C.primary}30`,borderRadius:12,fontSize:12,color:dark?'#A5B4FC':C.primary,lineHeight:1.5}}>
          🎓 Questions mirror real UCAT, LNAT, TMUA, ESAT, TSA & STEP style and difficulty
        </div>
      )}
    </Shell>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function SubjectCard({ subject, C, dark, compact, onClick, onMock }) {
  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column'}}>
      <button
        onClick={onClick}
        style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:compact?'12px 8px':'16px 10px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all 0.2s',flex:1}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primary+'12'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card}}
      >
        <span style={{fontSize:compact?20:26}}>{subject.emoji}</span>
        <span style={{fontSize:12,fontWeight:800,color:C.navy,textAlign:'center'}}>{subject.label}</span>
        <span style={{fontSize:9,color:C.muted,textAlign:'center',lineHeight:1.3}}>{subject.desc}</span>
      </button>
      <button
        onClick={onMock}
        title="Mock exam"
        style={{marginTop:4,background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'4px 0',fontSize:9,fontWeight:700,color:C.muted,cursor:'pointer',width:'100%',fontFamily:'Inter,sans-serif',letterSpacing:'0.04em'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.secondary??C.primary;e.currentTarget.style.color=C.secondary??C.primary}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}
      >
        MOCK EXAM
      </button>
    </div>
  )
}

export function Shell({ C, children }) {
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      <style>{`*{box-sizing:border-box}button{font-family:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>
      <div style={{width:'100%',maxWidth:430,padding:'28px 18px 48px',animation:'fadeUp 0.4s ease'}}>
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

function row(justify='flex-start', align='center', extra={}) {
  return { display:'flex', justifyContent:justify, alignItems:align, ...extra }
}
