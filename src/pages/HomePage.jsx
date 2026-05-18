/**
 * HomePage — subject/exam picker shown after stream selection.
 * Reads stream from URL param so bookmarking works.
 */

import { useNavigate, useParams } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { upsertProfile } from '../lib/db.js'

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

export default function HomePage({ user, profile, refreshProfile }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const cfg        = STREAM_CONFIG[stream]
  const C          = getColors(stream)
  const dark       = stream === 'alevel'

  if (!cfg) { navigate('/'); return null }

  const xp      = profile?.xp     ?? 0
  const streak  = profile?.streak  ?? 0
  const level   = Math.floor(xp / 150) + 1
  const pct     = (xp % 150) / 150 * 100

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
          <div style={{fontSize:24,fontWeight:900,color:C.navy,letterSpacing:'-0.5px'}}>
            BrightPath <span style={{color:C.primary}}>✦</span>
          </div>
          <div style={row('flex-start','center',{gap:6,marginTop:4})}>
            <Badge label={cfg.label} color={C.primary} />
            <span style={{fontSize:11,color:C.muted}}>{cfg.years}</span>
          </div>
        </div>
        <div style={row('flex-end','center',{gap:12})}>
          <Streak streak={streak} />
          <Btn onClick={switchStream} C={C} small>Switch</Btn>
        </div>
      </div>

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
          />
        ))}
      </div>

      {/* Progress link */}
      <button
        onClick={() => navigate(`/${stream}/progress`)}
        style={{width:'100%',background:'transparent',border:`1.5px solid ${C.border}`,borderRadius:14,padding:'13px',fontSize:13,fontWeight:700,color:C.muted,cursor:'pointer'}}
      >
        View My Progress 📊
      </button>

      {stream === 'alevel' && (
        <div style={{marginTop:14,padding:'12px 14px',background:C.primary+'18',border:`1px solid ${C.primary}30`,borderRadius:12,fontSize:12,color:dark?'#A5B4FC':C.primary,lineHeight:1.5}}>
          🎓 Questions mirror real UCAT, LNAT, TMUA, ESAT, TSA & STEP style and difficulty
        </div>
      )}
    </Shell>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function SubjectCard({ subject, C, dark, compact, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:compact?'12px 8px':'16px 10px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primary+'12'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card}}
    >
      <span style={{fontSize:compact?20:26}}>{subject.emoji}</span>
      <span style={{fontSize:12,fontWeight:800,color:C.navy,textAlign:'center'}}>{subject.label}</span>
      <span style={{fontSize:9,color:C.muted,textAlign:'center',lineHeight:1.3}}>{subject.desc}</span>
    </button>
  )
}

export function Shell({ C, children }) {
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',justifyContent:'center',fontFamily:'Georgia,serif'}}>
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
