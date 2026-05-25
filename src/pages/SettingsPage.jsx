import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Shell, getColors } from './HomePage.jsx'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { getNotes, deleteNote, exportNotesText, NOTES_MAX } from '../lib/notes.js'
import { getExamDates, setExamDate } from '../lib/db.js'
import { STREAM_CONFIG } from '../data/questions.js'
import { usePreferences } from '../hooks/usePreferences.js'
import { useTheme } from '../hooks/useTheme.js'
import { trialDaysLeft, getEffectivePlan, PLANS } from '../lib/subscription.js'

const APP_VERSION = '1.0.0-beta'

const STREAM_LABELS = { gcse:'GCSE', alevel:'A-Level', sat:'SAT', act:'ACT', ap:'AP', psat:'PSAT' }

const ACHIEVEMENTS = [
  { id:'first_q', icon:'🎯', label:'First Step',   desc:'Answered first question',  check:(p)=>(p?.xp??0)>0 },
  { id:'streak3', icon:'🔥', label:'On Fire',      desc:'3-day streak',             check:(p)=>(p?.streak??0)>=3 },
  { id:'streak7', icon:'⚡', label:'Week Warrior', desc:'7-day streak',             check:(p)=>(p?.streak??0)>=7 },
  { id:'xp100',   icon:'💎', label:'Century',      desc:'Earned 100 XP',            check:(p)=>(p?.xp??0)>=100 },
  { id:'xp500',   icon:'🏆', label:'Champion',     desc:'Earned 500 XP',            check:(p)=>(p?.xp??0)>=500 },
  { id:'level5',  icon:'🌟', label:'Level 5',      desc:'Reached Level 5',          check:(p)=>Math.floor(((p?.xp??0)/150))+1>=5 },
]
const NOTE_ACHIEVEMENTS = [
  { id:'note1',   icon:'📝', label:'Note Taker',   desc:'Saved first AI note',      checkN:(n)=>n.length>0 },
  { id:'note5',   icon:'📚', label:'Scholar',      desc:'Saved 5 AI notes',         checkN:(n)=>n.length>=5 },
  { id:'note10',  icon:'🧑‍🎓', label:'Expert',      desc:'Saved 10 AI notes',        checkN:(n)=>n.length>=10 },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ initial, C, size = 64 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:size/2,
      background: C.primary,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38, fontWeight:900, color:'white',
      boxShadow:`0 4px 24px ${C.primary}55`, flexShrink:0,
      letterSpacing:'-0.02em',
    }}>
      {initial}
    </div>
  )
}

function StatCard({ icon, val, label, color, compact }) {
  return (
    <div style={{
      textAlign:'center', padding: compact ? '12px 8px' : '18px 10px',
      background:`${color}10`, border:`1px solid ${color}25`, borderRadius:14,
    }}>
      <div style={{fontSize: compact ? 13 : 15, marginBottom:3}}>{icon}</div>
      <div style={{fontSize: compact ? 22 : 30, fontWeight:900, color, lineHeight:1}}>{val}</div>
      <div style={{fontSize: compact ? 9 : 10, color:'#94A3B8', marginTop:3, fontWeight:600}}>{label}</div>
    </div>
  )
}

function AchBadge({ icon, label, desc, unlocked, size='normal', C }) {
  const sm = size === 'small'
  const lockedBg     = C?.bg     ?? '#F8FAFC'
  const lockedBorder = C?.border ?? '#E2E8F0'
  const navyColor    = C?.navy   ?? '#1E293B'
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:5,
      padding: sm ? '12px 6px' : '14px 8px',
      background: unlocked ? '#7C3AED08' : lockedBg,
      border:`1.5px solid ${unlocked ? '#7C3AED30' : lockedBorder}`,
      borderRadius:14, opacity: unlocked ? 1 : 0.38, transition:'all 0.2s',
    }}>
      <div style={{
        width: sm ? 32 : 38, height: sm ? 32 : 38, borderRadius:10,
        background: unlocked ? 'linear-gradient(135deg,#7C3AED20,#6366F120)' : lockedBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: sm ? 16 : 20, filter: unlocked ? 'none' : 'grayscale(1)',
      }}>{icon}</div>
      <div style={{fontSize: sm ? 10 : 11, fontWeight: unlocked ? 800 : 600, color: unlocked ? navyColor : '#94A3B8', textAlign:'center', letterSpacing:'-0.01em', lineHeight:1.2}}>{label}</div>
      {!sm && <div style={{fontSize:9, color:'#94A3B8', textAlign:'center', lineHeight:1.3}}>{desc}</div>}
    </div>
  )
}

function SL({ children, C, action }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
      <div style={{fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>{children}</div>
      {action}
    </div>
  )
}

function Toggle({ value, onChange, color }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
        background: value ? color : '#CBD5E1',
        position:'relative', transition:'background 0.2s ease', flexShrink:0,
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{
        position:'absolute', top:3,
        left: value ? 'calc(100% - 21px)' : 3,
        width:18, height:18, borderRadius:9, background:'white',
        boxShadow:'0 1px 4px rgba(0,0,0,0.22)', transition:'left 0.2s ease',
      }} />
    </button>
  )
}

function NoteCard({ note, expanded, onToggle, onDelete, C }) {
  const [copied, setCopied] = useState(false)
  const streamColor = note.stream === 'alevel' ? '#7C3AED' : '#FF6B35'
  const subjectLabel = note.subject ? note.subject.charAt(0).toUpperCase() + note.subject.slice(1) : 'Unknown'
  const savedDate = new Date(note.savedAt).toLocaleDateString('en-GB', {day:'numeric', month:'short'})

  function handleCopy() {
    navigator.clipboard.writeText(`Q: ${note.question}\n\n${note.explanation}`).then(() => {
      setCopied(true); setTimeout(()=>setCopied(false), 2000)
    })
  }

  const card  = C?.card   ?? 'white'
  const bord  = C?.border ?? '#F1F5F9'
  const bg    = C?.bg     ?? '#F8FAFC'
  const navy  = C?.navy   ?? '#1E293B'
  const muted = C?.muted  ?? '#64748B'

  return (
    <div style={{
      background: card, border:`1px solid ${bord}`,
      borderLeft:`3px solid #7C3AED`,
      borderRadius:14, overflow:'hidden',
      boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
      transition:'box-shadow 0.2s',
    }}>
      <div style={{padding:'12px 14px 10px'}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:6, alignItems:'center'}}>
              <span style={{background:`${streamColor}15`, border:`1px solid ${streamColor}30`, borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:800, color:streamColor, letterSpacing:'0.06em'}}>
                {(note.stream??'').toUpperCase()}
              </span>
              <span style={{background:'#7C3AED12', border:'1px solid #7C3AED25', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#7C3AED'}}>
                {note.topic || subjectLabel}
              </span>
              <span style={{marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600}}>{savedDate}</span>
            </div>
            <p style={{
              fontSize:12, fontWeight:600, color:navy, margin:0, lineHeight:1.55,
              ...(!expanded ? {display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'} : {}),
            }}>
              {note.question}
            </p>
          </div>
          <button
            onClick={onDelete}
            style={{background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', fontSize:18, padding:'0 2px', flexShrink:0, lineHeight:1, marginTop:-2}}
            aria-label="Delete note"
          >×</button>
        </div>
      </div>

      <button
        onClick={onToggle}
        style={{
          width:'100%', background: bg, border:'none', borderTop:`1px solid ${bord}`,
          padding:'7px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
          cursor:'pointer', fontSize:11, fontWeight:700, color:'#7C3AED',
          fontFamily:'Inter,sans-serif',
        }}
      >
        <span>{expanded ? 'Hide AI explanation' : 'Show AI explanation'}</span>
        <span style={{transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s', display:'inline-block'}}>▾</span>
      </button>

      {expanded && (
        <div style={{padding:'12px 14px 14px', borderTop:`1px solid ${bord}`, background: bg}}>
          <style>{`
            .nm-ai h1{font-size:14px;font-weight:900;margin:0 0 6px;color:${navy}}
            .nm-ai h2{font-size:12px;font-weight:800;margin:12px 0 3px;color:#7C3AED}
            .nm-ai h3{font-size:11px;font-weight:700;margin:8px 0 3px;color:#A855F7}
            .nm-ai p{margin:0 0 8px;font-size:12px;color:${muted};line-height:1.75}
            .nm-ai ul,.nm-ai ol{margin:4px 0 8px;padding-left:18px}
            .nm-ai li{font-size:12px;color:${muted};line-height:1.65;margin-bottom:3px}
            .nm-ai strong{font-weight:800}
            .nm-ai code{background:#F3E8FF;padding:1px 4px;border-radius:4px;font-size:11px}
          `}</style>
          <div className="nm-ai"><ReactMarkdown>{note.explanation}</ReactMarkdown></div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:8, paddingTop:8, borderTop:`1px solid ${bord}`}}>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? '#DCFCE7' : 'transparent',
                border:`1px solid ${copied ? '#16A34A40' : '#7C3AED30'}`,
                borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700,
                color: copied ? '#16A34A' : '#7C3AED', cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsRow({ icon, label, sublabel, onClick, right, danger, C }) {
  const card  = C?.card  ?? 'white'
  const navy  = C?.navy  ?? '#1E293B'
  const muted = C?.muted ?? '#64748B'
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:14,
        background: card, border:'none', borderRadius:0,
        padding:'13px 0', cursor: onClick ? 'pointer' : 'default',
        textAlign:'left', fontFamily:'Inter,sans-serif',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{width:34, height:34, borderRadius:9, background: danger ? '#FEE2E2' : '#7C3AED14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:700, color: danger ? '#DC2626' : navy}}>{label}</div>
        {sublabel && <div style={{fontSize:11, color: muted, marginTop:1}}>{sublabel}</div>}
      </div>
      {right !== undefined ? right : onClick ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
          <path d="M9 18l6-6-6-6" stroke="#CBD5E1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : null}
    </button>
  )
}

function SectionBox({ title, children, C }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, paddingLeft:2}}>{title}</div>
      <div style={{background: C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
        {children}
      </div>
    </div>
  )
}

function Divider({ C }) {
  return <div style={{height:1, background: C?.border ?? '#F1F5F9', marginLeft:48}} />
}

function Card({ children, style, C }) {
  const card  = C?.card   ?? 'white'
  const bord  = C?.border ?? '#F1F5F9'
  return (
    <div style={{background: card, border:`1px solid ${bord}`, borderRadius:18, padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', ...style}}>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsPage({ user, profile, signOut, refreshProfile, isDark }) {
  const { stream } = useParams()
  const navigate   = useNavigate()
  const C          = getColors(stream, null, isDark)
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const { mode, setMode } = useTheme()

  const [notes,        setNotes]        = useState(() => getNotes())
  const [expandedNote, setExpandedNote] = useState(null)
  const [copyAllDone,  setCopyAllDone]  = useState(false)
  const { prefs, updatePref } = usePreferences(user?.id)
  const [examDates,  setExamDates]  = useState({})
  const [examSaving, setExamSaving] = useState(false)

  const email   = user?.email ?? ''
  const isGuest = !email || user?.isGuest
  const initial = (profile?.display_name || email || 'U')[0].toUpperCase()
  const level   = Math.floor((profile?.xp ?? 0) / 150) + 1

  const effectivePlan = getEffectivePlan(profile)
  const trialDays     = trialDaysLeft(profile)
  const planName      = PLANS[effectivePlan]?.name ?? 'Free'
  const planSublabel  = trialDays > 0
    ? `Trial · ${trialDays} day${trialDays === 1 ? '' : 's'} left`
    : planName

  const statsData = [
    { icon:'🔥', val: profile?.streak ?? 0, label:'Day Streak', color:'#F97316' },
    { icon:'⚡', val: profile?.xp ?? 0,     label:'Total XP',   color: C.primary },
    { icon:'🎓', val: level,                label:'Level',      color:'#7C3AED' },
    { icon:'📝', val: notes.length,          label:'Notes',      color:'#06B6D4' },
  ]

  const allAchievements = [
    ...ACHIEVEMENTS.map(a => ({...a, unlocked: a.check(profile)})),
    ...NOTE_ACHIEVEMENTS.map(a => ({...a, unlocked: a.checkN(notes)})),
  ]

  function handleDeleteNote(id) { deleteNote(id); setNotes(getNotes()) }

  useEffect(() => {
    if (!user?.id) return
    getExamDates(user.id).then(({ data }) => { if (data) setExamDates(data) })
  }, [user?.id])

  async function handleSetExamDate(s, date) {
    setExamDates(prev => ({ ...prev, [s]: date }))
    if (!user?.id) return
    setExamSaving(true)
    try { await setExamDate(user.id, s, date) } catch { /* localStorage already updated */ }
    finally { setExamSaving(false) }
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(exportNotesText(notes)).then(() => {
      setCopyAllDone(true); setTimeout(() => setCopyAllDone(false), 2500)
    })
  }

  function handleDownload() {
    const blob = new Blob([exportNotesText(notes)], { type:'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'nexora-notes.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const heroEl = (
    <div style={{padding:`max(18px, env(safe-area-inset-top, 18px)) ${isDesktop ? 32 : 16}px 0`}}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom: isMobile ? 20 : 16}}>
        <button
          onClick={() => navigate(-1)}
          style={{background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={{fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.4px'}}>Me</div>
          <div style={{fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1}}>Your profile &amp; notes</div>
        </div>
      </div>

      {isMobile ? (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', paddingBottom:28}}>
          <Avatar initial={initial} C={C} size={72} />
          <div style={{fontSize:19, fontWeight:800, color:'white', marginTop:12, letterSpacing:'-0.3px'}}>
            {profile?.display_name || (email ? email.split('@')[0] : 'Student')}
          </div>
          <div style={{fontSize:12, color:'rgba(255,255,255,0.68)', marginTop:3}}>{email || 'Guest account'}</div>
          <div style={{marginTop:10, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.32)', borderRadius:20, padding:'4px 14px', fontSize:10, fontWeight:800, color:'white', letterSpacing:'0.07em'}}>
            {STREAM_CONFIG[stream]?.label?.toUpperCase() ?? stream.toUpperCase()}
          </div>
        </div>
      ) : (
        <div style={{display:'flex', alignItems:'center', gap:16, paddingBottom:28}}>
          <Avatar initial={initial} C={C} size={isDesktop ? 54 : 64} />
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize: isDesktop ? 18 : 20, fontWeight:800, color:'white', letterSpacing:'-0.3px'}}>
              {profile?.display_name || (email ? email.split('@')[0] : 'Student')}
            </div>
            <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:3}}>{email || 'Guest account'}</div>
          </div>
          <div style={{background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.32)', borderRadius:20, padding:'5px 14px', fontSize:10, fontWeight:800, color:'white', letterSpacing:'0.07em', flexShrink:0}}>
            {STREAM_CONFIG[stream]?.label?.toUpperCase() ?? stream.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  )

  // ── Notes section ────────────────────────────────────────────────────────────
  const notesEmpty = (
    <div style={{textAlign:'center', padding:'32px 16px'}}>
      <div style={{fontSize:38, marginBottom:10}}>📝</div>
      <div style={{fontSize:14, fontWeight:700, color:C.navy, marginBottom:6}}>No notes yet</div>
      <div style={{fontSize:12, color:C.muted, lineHeight:1.7, maxWidth:280, margin:'0 auto'}}>
        After the AI tutor explains a question, tap <strong style={{color:'#7C3AED'}}>✦ Save</strong> to add it here for later revision.
      </div>
    </div>
  )

  const noteCardsGrid = (
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
      gap: 12,
    }}>
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          C={C}
          expanded={expandedNote === note.id}
          onToggle={() => setExpandedNote(p => p === note.id ? null : note.id)}
          onDelete={() => { if(expandedNote === note.id) setExpandedNote(null); handleDeleteNote(note.id) }}
        />
      ))}
    </div>
  )

  const exportBar = notes.length > 0 && (
    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap'}}>
      <span style={{fontSize:11, color:'#94A3B8', fontWeight:600}}>{notes.length} / {NOTES_MAX} saved</span>
      <div style={{flex:1}} />
      <button
        onClick={handleCopyAll}
        style={{background: copyAllDone ? '#DCFCE7' : 'transparent', border:`1px solid ${copyAllDone ? '#16A34A40' : '#7C3AED30'}`, borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:700, color: copyAllDone ? '#16A34A' : '#7C3AED', cursor:'pointer', fontFamily:'Inter,sans-serif'}}
      >
        {copyAllDone ? '✓ Copied!' : '📋 Copy All'}
      </button>
      <button
        onClick={handleDownload}
        style={{background:'transparent', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:700, color:C.muted, cursor:'pointer', fontFamily:'Inter,sans-serif'}}
      >
        ⬇ Download .txt
      </button>
    </div>
  )

  // ── Achievements ─────────────────────────────────────────────────────────────
  const achievementsGrid = (cols) => (
    <div style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:8}}>
      {allAchievements.map(a => (
        <AchBadge key={a.id} icon={a.icon} label={a.label} desc={a.desc} unlocked={a.unlocked} size={cols >= 4 ? 'small' : 'normal'} C={C} />
      ))}
    </div>
  )

  // ── Exam target card ─────────────────────────────────────────────────────────
  const enrolledStreams = profile?.streams?.length ? profile.streams : profile?.stream ? [profile.stream] : []
  const examTargetCard = (
    <Card C={C}>
      <div style={{fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12}}>Exam Dates</div>
      {enrolledStreams.length === 0 ? (
        <div style={{fontSize:13, color:C.muted}}>Enrol in a track to set an exam date.</div>
      ) : enrolledStreams.map(s => {
        const dateVal  = examDates[s] ?? ''
        const dl = dateVal ? Math.max(0, Math.ceil((new Date(dateVal) - new Date()) / 86400000)) : null
        return (
          <div key={s} style={{marginBottom:14}}>
            <div style={{fontSize:12, fontWeight:700, color:C.navy, marginBottom:6}}>
              {STREAM_LABELS[s] ?? s.toUpperCase()} exam date
            </div>
            <input
              type="date"
              value={dateVal}
              onChange={e => handleSetExamDate(s, e.target.value)}
              style={{width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.navy, background:C.card, cursor:'pointer', outline:'none', boxSizing:'border-box'}}
            />
            {dl !== null && (
              <div style={{marginTop:6, display:'flex', alignItems:'center', gap:8}}>
                <div style={{flex:1, background:C.border, borderRadius:6, height:4}}>
                  <div style={{width:`${Math.min(100, Math.max(0, 100 - (dl / 365 * 100)))}%`, height:'100%', borderRadius:6, background:C.primary}} />
                </div>
                <span style={{fontSize:11, fontWeight:700, color: dl < 60 ? '#EF4444' : dl < 180 ? '#F59E0B' : C.primary, flexShrink:0}}>
                  {dl > 0 ? `${dl}d` : 'Soon!'}
                </span>
              </div>
            )}
          </div>
        )
      })}
      {examSaving && <div style={{marginTop:4, fontSize:11, color:'#94A3B8'}}>Saving…</div>}
    </Card>
  )

  // ── Appearance section ───────────────────────────────────────────────────────
  const appearanceSection = (
    <SectionBox title="Appearance" C={C}>
      <div style={{padding:'12px 16px 14px'}}>
        <div style={{fontSize:12, fontWeight:700, color:C.navy, marginBottom:8}}>Theme</div>
        <div style={{display:'flex', gap:6}}>
          {[['light','Light'],['dark','Dark'],['system','System']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setMode(val)}
              style={{
                flex:1, padding:'7px 0',
                background: mode === val ? `${C.primary}18` : C.bg,
                border: `1.5px solid ${mode === val ? C.primary : C.border}`,
                borderRadius:8, fontSize:11, fontWeight:700,
                color: mode === val ? C.primary : C.muted,
                cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}
            >{label}</button>
          ))}
        </div>
      </div>
    </SectionBox>
  )

  // ── Account section ──────────────────────────────────────────────────────────
  const accountRows = (
    <>
      <SectionBox title="Account" C={C}>
        <SettingsRow C={C} icon="👤" label={isGuest ? 'Guest account' : email} sublabel={isGuest ? 'Sign in to save progress' : 'Signed in'} onClick={null} right={null} />
        {!isGuest && (
          <>
            <Divider C={C} />
            <SettingsRow
              C={C}
              icon="⭐"
              label="Subscription"
              sublabel={planSublabel}
              onClick={() => navigate(`/${stream}/subscription`)}
              right={
                <span style={{ fontSize:10, fontWeight:800, background:`${C.primary}15`, color:C.primary, border:`1px solid ${C.primary}30`, borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>
                  {planName}
                </span>
              }
            />
            <Divider C={C} />
            <SettingsRow C={C} icon="🚪" label="Sign Out" sublabel="You can sign back in at any time" onClick={() => { signOut?.(); navigate('/') }} danger right={null} />
          </>
        )}
      </SectionBox>
      <SectionBox title="Support" C={C}>
        <SettingsRow C={C} icon="✉️" label="Contact Support" sublabel="support@nexoralearn.app" onClick={() => window.open('mailto:support@nexoralearn.app')} />
        <Divider C={C} />
        <SettingsRow C={C} icon="🐞" label="Report a Bug" sublabel="Help us improve Nexora" onClick={() => window.open('mailto:support@nexoralearn.app?subject=Bug%20Report')} />
      </SectionBox>
      <SectionBox title="Legal" C={C}>
        <SettingsRow C={C} icon="🔒" label="Privacy Policy" sublabel="How we use your data" onClick={() => navigate('/privacy')} />
        <Divider C={C} />
        <SettingsRow C={C} icon="📄" label="Terms of Service" sublabel="Subscription terms" onClick={() => navigate('/terms')} />
      </SectionBox>
    </>
  )

  const appInfo = (
    <div style={{textAlign:'center', padding:'8px 0 4px'}}>
      <div style={{fontSize:11, color:'#CBD5E1', fontWeight:600}}>Nexora · v{APP_VERSION}</div>
      <div style={{fontSize:10, color:'#E2E8F0', marginTop:1}}>nexoralearn.app</div>
    </div>
  )

  // ── Privacy section ──────────────────────────────────────────────────────────
  const privacySection = (
    <SectionBox title="Privacy" C={C}>
      <SettingsRow
        C={C}
        icon="🏆"
        label="Show me on Leaderboard"
        sublabel="Your name and XP appear in stream rankings"
        right={<Toggle value={prefs.leaderboard_opt_in !== false} onChange={v => updatePref('leaderboard_opt_in', v)} color={C.primary} />}
      />
    </SectionBox>
  )

  // ── Accessibility section ───────────────────────────────────────────────────
  const accessibilitySection = (
    <SectionBox title="Accessibility" C={C}>
      <div style={{padding:'12px 16px 10px'}}>
        <div style={{fontSize:12, fontWeight:700, color:C.navy, marginBottom:8}}>Font size</div>
        <div style={{display:'flex', gap:6}}>
          {[['small','S'],['medium','M'],['large','L'],['xl','XL']].map(([sz, label]) => (
            <button
              key={sz}
              onClick={() => updatePref('font_size', sz)}
              style={{
                flex:1, padding:'7px 0',
                background: prefs.font_size === sz ? `${C.primary}18` : C.bg,
                border: `1.5px solid ${prefs.font_size === sz ? C.primary : C.border}`,
                borderRadius:9, fontSize:11, fontWeight:700,
                color: prefs.font_size === sz ? C.primary : C.muted,
                cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}
            >{label}</button>
          ))}
        </div>
      </div>
      <Divider C={C} />
      <SettingsRow C={C} icon="🌗" label="High Contrast" sublabel="Stronger colour separation"
        right={<Toggle value={prefs.high_contrast} onChange={v => updatePref('high_contrast', v)} color={C.primary} />}
      />
      <Divider C={C} />
      <SettingsRow C={C} icon="✋" label="Reduce Motion" sublabel="Fewer animations"
        right={<Toggle value={prefs.reduce_motion} onChange={v => updatePref('reduce_motion', v)} color={C.primary} />}
      />
      <Divider C={C} />
      <SettingsRow C={C} icon="🔤" label="Dyslexia-Friendly Font" sublabel="OpenDyslexic typeface"
        right={<Toggle value={prefs.dyslexia_font} onChange={v => updatePref('dyslexia_font', v)} color={C.primary} />}
      />
      <Divider C={C} />
      <div style={{padding:'12px 16px 14px'}}>
        <div style={{fontSize:12, fontWeight:700, color:C.navy, marginBottom:8}}>Colour-blind mode</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {[['none','None'],['deuteranopia','Deuter.'],['protanopia','Protan.'],['tritanopia','Tritan.']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => updatePref('color_blind_mode', val)}
              style={{
                padding:'6px 12px',
                background: prefs.color_blind_mode === val ? `${C.primary}18` : C.bg,
                border: `1.5px solid ${prefs.color_blind_mode === val ? C.primary : C.border}`,
                borderRadius:9, fontSize:11, fontWeight:700,
                color: prefs.color_blind_mode === val ? C.primary : C.muted,
                cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}
            >{label}</button>
          ))}
        </div>
      </div>
    </SectionBox>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP (≥ 1024px): 2-column sticky/scroll layout
  // ════════════════════════════════════════════════════════════════════════════
  if (isDesktop) {
    return (
      <Shell C={C} isDark={isDark} heroContent={heroEl} contentMax={1100}>
        <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:32, alignItems:'start'}}>

          <div style={{position:'sticky', top:24, display:'flex', flexDirection:'column', gap:14}}>
            <Card C={C}>
              <div style={{fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14}}>Quick Stats</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {statsData.map(s => <StatCard key={s.label} compact {...s} />)}
              </div>
            </Card>

            {examTargetCard}
            {appearanceSection}
            {accessibilitySection}
            {privacySection}
            {accountRows}
            {appInfo}
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:24}}>
            <div>
              <SL C={C} action={exportBar}>My AI Notes</SL>
              <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding: notes.length ? '16px' : '0', boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                {notes.length === 0 ? notesEmpty : noteCardsGrid}
              </div>
            </div>

            <div>
              <SL C={C}>Achievements</SL>
              {achievementsGrid(4)}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TABLET (640–1023px): wider single-column, 4-col stats, 2-col notes
  // ════════════════════════════════════════════════════════════════════════════
  if (isTablet) {
    return (
      <Shell C={C} isDark={isDark} heroContent={heroEl}>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24}}>
          {statsData.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        <div style={{marginBottom:24}}>{examTargetCard}</div>

        <div style={{marginBottom:24}}>
          <SL C={C} action={exportBar}>My AI Notes</SL>
          <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding: notes.length ? '16px' : '0', boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
            {notes.length === 0 ? notesEmpty : noteCardsGrid}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <SL C={C}>Achievements</SL>
          {achievementsGrid(4)}
        </div>

        {appearanceSection}
        {accessibilitySection}
        {privacySection}
        {accountRows}
        {appInfo}
      </Shell>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE (< 640px): single-column, 2×2 stats, full-width notes, scroll achiev
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <Shell C={C} isDark={isDark} heroContent={heroEl}>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22}}>
        {statsData.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{marginBottom:22}}>{examTargetCard}</div>

      <div style={{marginBottom:22}}>
        <SL C={C} action={exportBar}>My AI Notes</SL>
        <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding: notes.length ? '12px' : '0', boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
          {notes.length === 0 ? notesEmpty : noteCardsGrid}
        </div>
      </div>

      <div style={{marginBottom:22}}>
        <SL C={C}>Achievements</SL>
        <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
          {allAchievements.map(a => (
            <div key={a.id} style={{flexShrink:0, width:90}}>
              <AchBadge icon={a.icon} label={a.label} desc={a.desc} unlocked={a.unlocked} size='small' C={C} />
            </div>
          ))}
        </div>
      </div>

      {appearanceSection}
      {accessibilitySection}
      {privacySection}
      {accountRows}
      {appInfo}
    </Shell>
  )
}
