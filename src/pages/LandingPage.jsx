import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../lib/db.js'
import { STREAM_CONFIG } from '../data/questions.js'
import { COURSERA_BLUE, TRACK_COLORS } from '../styles/courseraTokens.js'
import { fetchTrackRecommendation } from '../lib/ai.js'

const TRACK_META = {
  gcse:   { flag:'🇬🇧', stars:4.8, region:'uk' },
  alevel: { flag:'🇬🇧', stars:4.9, region:'uk' },
  sat:    { flag:'🇺🇸', stars:4.7, region:'us' },
  act:    { flag:'🇺🇸', stars:4.8, region:'us' },
  ap:     { flag:'🇺🇸', stars:4.9, region:'us' },
  psat:   { flag:'🇺🇸', stars:4.7, region:'us' },
  igcse:  { flag:'🌍', stars:4.8, region:'international' },
  ib:     { flag:'🌐', stars:4.9, region:'international' },
}

const WHY_POINTS = [
  { icon:'🕹️', text:'5 Dynamic Study Modes – Quizzes, Flashcards, Mock Exams, Active Recall, Match Games.' },
  { icon:'🧠', text:'Instant AI Tutoring – Step-by-step AI explanation after every single question.' },
  { icon:'📈', text:'Scientific Spaced Repetition – Smart scheduling cuts study time in half.' },
  { icon:'🎓', text:'Global Exam Coverage – GCSE, A-Level, IGCSE, IB, SAT, ACT, AP & beyond.' },
  { icon:'📅', text:'Countdown to Success – Personalised study plan tied to your exam date.' },
  { icon:'🎁', text:'Student-Friendly Freemium Plans – Start free, upgrade only when you need more.' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ val }) {
  const full = Math.floor(val)
  const half = val - full >= 0.5
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:11, color: i <= full ? '#F59E0B' : (i === full + 1 && half) ? '#F59E0B' : '#D1D5DB' }}>
          {i <= full ? '★' : (i === full + 1 && half) ? '★' : '☆'}
        </span>
      ))}
      <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)', marginLeft:2 }}>{val}</span>
    </div>
  )
}

function TrackCard({ streamId, cfg, meta, enrolled, onToggle }) {
  const accent = TRACK_COLORS[streamId] ?? COURSERA_BLUE
  const subjectCount = cfg.subjects.filter(s => !s.deprecated).length
  const [pressed, setPressed] = useState(false)
  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)',
        borderRadius:16,
        border: enrolled ? `2px solid ${accent}` : '1.5px solid rgba(255,255,255,0.6)',
        boxShadow: enrolled
          ? `0 4px 20px ${accent}30`
          : '0 2px 12px rgba(0,0,0,0.08)',
        overflow:'hidden', fontFamily:'Inter,sans-serif',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition:'all 0.15s ease',
      }}
    >
      {/* Coloured top strip */}
      <div style={{
        height:6, background:`linear-gradient(90deg, ${accent}, ${accent}88)`,
      }} />

      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:`linear-gradient(135deg, ${accent}, ${accent}BB)`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
          }}>
            {cfg.subjects[0]?.emoji ?? '📚'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#1F1F1F', letterSpacing:'-0.2px' }}>
              {cfg.label?.replace(' Track','').replace(' Prep','') ?? streamId.toUpperCase()}
            </div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>
              {cfg.years} · {subjectCount} subjects
            </div>
          </div>
          <button
            onClick={() => onToggle(streamId)}
            style={{
              flexShrink:0,
              background: enrolled ? accent : 'transparent',
              border: enrolled ? `1.5px solid ${accent}` : `1.5px solid ${accent}60`,
              borderRadius:20, padding:'7px 14px',
              fontSize:12, fontWeight:800,
              color: enrolled ? 'white' : accent,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              whiteSpace:'nowrap', transition:'all 0.15s',
            }}
          >
            {enrolled ? '✓ Enrolled' : '+ Enrol'}
          </button>
        </div>

        {/* Subject chips */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {cfg.subjects.filter(s => !s.deprecated).slice(0, 4).map(s => (
            <span key={s.id} style={{
              background:`${accent}10`, border:`1px solid ${accent}25`,
              borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700, color: accent,
            }}>{s.emoji} {s.label}</span>
          ))}
          {subjectCount > 4 && (
            <span style={{ background:`${accent}10`, border:`1px solid ${accent}25`, borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700, color: accent }}>
              +{subjectCount - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Why Nexora — inline expandable panel (replaces broken hover) ──────────────

function WhyNexora() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom:20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.3)',
          borderRadius: open ? '12px 12px 0 0' : 12,
          padding:'11px 16px', cursor:'pointer',
          fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>✨</span>
          <span style={{ fontSize:13, fontWeight:700, color:'white' }}>Why Nexora?</span>
        </div>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{
          background:'rgba(15,23,42,0.88)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.15)', borderTop:'none',
          borderRadius:'0 0 12px 12px', padding:'16px 18px',
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {WHY_POINTS.map((p, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{p.icon}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.82)', lineHeight:1.5, fontWeight:500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── AI Advisor Sheet ──────────────────────────────────────────────────────────

const UK_YEARS  = [8,9,10,11,12,13]
const US_GRADES = [6,7,8,9,10,11,12]
const GOALS = [
  ['ivy',   '🎓 Top / Ivy League university'],
  ['top',   '🏫 Strong state / regional university'],
  ['other', '📚 Community college or unsure'],
]

function AdvisorSheet({ onClose, onAddTracks }) {
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  function choose(key, value) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < 2) setStep(s => s + 1)
  }

  async function getRecommendation() {
    setLoading(true)
    const rec = await fetchTrackRecommendation({ country: answers.country, year: answers.year, goal: answers.goal })
    setResult(rec)
    setLoading(false)
  }

  const stepLabels = [
    'Which country are you studying in?',
    `What ${answers.country === 'uk' ? 'year' : 'grade'} are you in?`,
    "What's your university goal?",
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'28px 22px 40px', width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, background:'#D1D5DB', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#1F1F1F' }}>🤖 Track Advisor</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, color:'#6B7280', cursor:'pointer' }}>✕</button>
        </div>
        {result ? (
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#1F1F1F', marginBottom:12 }}>We recommend:</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {result.tracks.map(t => {
                const accent = TRACK_COLORS[t] ?? COURSERA_BLUE
                return <div key={t} style={{ background:`${accent}12`, border:`1.5px solid ${accent}40`, borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:700, color: accent }}>{STREAM_CONFIG[t]?.label ?? t.toUpperCase()}</div>
              })}
            </div>
            <div style={{ background:'#F5F7FA', borderRadius:12, padding:'14px', marginBottom:20, fontSize:13, color:'#374151', lineHeight:1.6 }}>{result.reason}</div>
            <button onClick={() => { onAddTracks(result.tracks); onClose() }} style={{ width:'100%', padding:'14px 0', background:COURSERA_BLUE, color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:10, fontFamily:'Inter,sans-serif' }}>Add these tracks →</button>
            <button onClick={() => { setStep(0); setAnswers({}); setResult(null) }} style={{ width:'100%', padding:'10px 0', background:'none', border:'none', fontSize:13, color:'#6B7280', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Start over</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🤔</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:12 }}>Analysing your needs…</div>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', gap:4, marginBottom:20 }}>
              {[0,1,2].map(i => <div key={i} style={{ height:3, flex:1, borderRadius:999, background: i <= step ? COURSERA_BLUE : '#E5E7EB', transition:'background 0.2s' }} />)}
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'#1F1F1F', marginBottom:18 }}>{stepLabels[step]}</div>
            {step === 0 && (
              <div style={{ display:'flex', gap:10 }}>
                {[['uk','🇬🇧 United Kingdom'],['us','🇺🇸 United States']].map(([val, label]) => (
                  <button key={val} onClick={() => choose('country', val)} style={{ flex:1, padding:'18px 0', background:'white', border:`1.5px solid ${COURSERA_BLUE}30`, borderRadius:12, fontSize:14, fontWeight:700, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{label}</button>
                ))}
              </div>
            )}
            {step === 1 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {(answers.country === 'uk' ? UK_YEARS : US_GRADES).map(y => (
                  <button key={y} onClick={() => choose('year', y)} style={{ padding:'10px 18px', background:'white', border:`1.5px solid ${COURSERA_BLUE}30`, borderRadius:20, fontSize:13, fontWeight:700, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    {answers.country === 'uk' ? `Year ${y}` : `Grade ${y}`}
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {GOALS.map(([val, label]) => (
                    <button key={val} onClick={() => setAnswers(a => ({ ...a, goal: val }))} style={{ padding:'13px 16px', background: answers.goal === val ? `${COURSERA_BLUE}10` : 'white', border:`1.5px solid ${answers.goal === val ? COURSERA_BLUE : '#E5E7EB'}`, borderRadius:10, fontSize:13, fontWeight:700, color: answers.goal === val ? COURSERA_BLUE : '#1F1F1F', cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>{label}</button>
                  ))}
                </div>
                <button onClick={getRecommendation} disabled={!answers.goal} style={{ width:'100%', padding:'14px 0', background: answers.goal ? COURSERA_BLUE : '#D1D5DB', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: answers.goal ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>Get Recommendation →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage({ user, profile, refreshProfile }) {
  const navigate = useNavigate()

  const originalStreams = profile?.streams ?? (profile?.stream ? [profile.stream] : [])
  const [pendingStreams, setPendingStreams] = useState(originalStreams)
  const [saving,        setSaving]         = useState(false)
  const [saveError,     setSaveError]      = useState(null)
  const [startModal,    setStartModal]     = useState(false)
  const [advisorOpen,   setAdvisorOpen]    = useState(false)

  const hasChanges = JSON.stringify([...pendingStreams].sort()) !== JSON.stringify([...originalStreams].sort())

  function toggleStream(stream) {
    if (!user) { navigate(`/${stream}`); return }
    setPendingStreams(prev => prev.includes(stream) ? prev.filter(s => s !== stream) : [...prev, stream])
  }

  async function saveStreams() {
    if (!user || !pendingStreams.length) return
    setSaving(true); setSaveError(null)
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out — please try again.')), 8000))
      const { data, error } = await Promise.race([
        updateProfile(user.id, { streams: pendingStreams, stream: pendingStreams[0], active_stream: pendingStreams[0] }),
        timeout,
      ])
      if (error) throw new Error(error.message ?? 'Save failed.')
      if (!data) throw new Error('Save failed — no rows updated. Please sign out and back in.')
      refreshProfile?.().catch(() => {})
      setStartModal(true)
    } catch (err) {
      setSaveError(err?.message ?? 'Save failed — please try again.')
    } finally { setSaving(false) }
  }

  function addAdvisorTracks(tracks) {
    setPendingStreams(prev => [...new Set([...prev, ...tracks])])
  }

  const ukTracks            = ['gcse', 'alevel']
  const usTracks            = ['sat', 'act', 'ap', 'psat']
  const internationalTracks = ['igcse', 'ib']

  // Campus aerial background — CSS gradient simulating an aerial academic landscape
  const campusBg = `
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(15,118,110,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(0,86,210,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 20%, rgba(124,58,237,0.08) 0%, transparent 60%),
    linear-gradient(160deg, #0a1628 0%, #0d2240 25%, #0f3460 50%, #1a4a3a 75%, #0d2240 100%)
  `

  return (
    <div style={{ minHeight:'100dvh', fontFamily:'Inter,sans-serif', background:'#F5F7FA' }}>

      {/* ── Hero — full-bleed campus-inspired banner ── */}
      <div style={{
        background: campusBg,
        position:'relative', overflow:'hidden',
        paddingTop:'env(safe-area-inset-top, 0px)',
      }}>
        {/* Architectural grid lines — suggest campus layout from above */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          {/* Building outlines — top-down campus view */}
          <rect x="20" y="20" width="80" height="50" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="30" y="30" width="60" height="30" rx="1" fill="white" opacity="0.3"/>
          <rect x="120" y="10" width="60" height="80" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="130" y="20" width="40" height="60" rx="1" fill="white" opacity="0.2"/>
          <rect x="200" y="30" width="90" height="40" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="210" y="40" width="70" height="20" rx="1" fill="white" opacity="0.25"/>
          <rect x="310" y="15" width="70" height="55" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="320" y="25" width="50" height="35" rx="1" fill="white" opacity="0.2"/>
          {/* Paths / roads between buildings */}
          <line x1="100" y1="45" x2="120" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          <line x1="180" y1="50" x2="200" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          <line x1="290" y1="45" x2="310" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          <line x1="150" y1="90" x2="150" y2="140" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          {/* Lower buildings */}
          <rect x="40" y="150" width="100" height="60" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="55" y="162" width="70" height="36" rx="1" fill="white" opacity="0.2"/>
          <rect x="160" y="140" width="80" height="70" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="170" y="152" width="60" height="46" rx="1" fill="white" opacity="0.25"/>
          <rect x="260" y="155" width="110" height="50" rx="2" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="270" y="165" width="90" height="30" rx="1" fill="white" opacity="0.2"/>
          {/* Quadrangle / courtyard */}
          <rect x="160" y="140" width="80" height="70" rx="2" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
          <rect x="175" y="155" width="50" height="40" rx="1" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
          {/* Trees */}
          <circle cx="110" cy="130" r="6" fill="white" opacity="0.15"/>
          <circle cx="245" cy="125" r="5" fill="white" opacity="0.12"/>
          <circle cx="350" cy="130" r="7" fill="white" opacity="0.15"/>
          <circle cx="70" cy="230" r="5" fill="white" opacity="0.12"/>
          <circle cx="380" cy="220" r="6" fill="white" opacity="0.13"/>
        </svg>

        {/* Overlay gradient for text readability */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 100%)' }} />

        {/* Content */}
        <div style={{ position:'relative', zIndex:1, padding:'28px 20px 32px', maxWidth:680, margin:'0 auto' }}>
          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div style={{ fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>Nexora</div>
            {profile?.stream && (
              <button onClick={() => navigate(`/${profile.stream}`)} style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:700, color:'white', cursor:'pointer', fontFamily:'Inter,sans-serif', backdropFilter:'blur(8px)' }}>
                ← Back
              </button>
            )}
          </div>

          {/* Hero copy */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:32, fontWeight:900, color:'white', letterSpacing:'-0.8px', lineHeight:1.15, marginBottom:10, fontFamily:"'Playfair Display', Georgia, serif" }}>
              Your path to the<br />world's top universities
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.72)', lineHeight:1.6, maxWidth:400 }}>
              AI-powered exam prep for GCSE, A-Level, IGCSE, IB Diploma, SAT, ACT & AP. Free, personalised, and built for serious students.
            </div>
          </div>

          {/* Trust pills */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
            {['🆓 Free Forever','🤖 AI Tutoring','📈 Spaced Repetition','🌍 8 Exam Tracks'].map(p => (
              <span key={p} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', backdropFilter:'blur(8px)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'white', fontWeight:600 }}>{p}</span>
            ))}
          </div>

          {/* Why Nexora expandable */}
          <WhyNexora />

          {/* AI Advisor card */}
          <button
            onClick={() => setAdvisorOpen(true)}
            style={{
              display:'flex', alignItems:'center', gap:12, width:'100%',
              background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
              backdropFilter:'blur(8px)',
              borderRadius:12, padding:'13px 16px',
              cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <span style={{ fontSize:22, flexShrink:0 }}>🤖</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'white' }}>Not sure which track?</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>Get a personalised recommendation in 30 seconds</div>
            </div>
            <span style={{ fontSize:18, color:'rgba(255,255,255,0.7)' }}>›</span>
          </button>
        </div>
      </div>

      {/* ── Track selection ── */}
      <div style={{ padding:'24px 16px 0', maxWidth:680, margin:'0 auto', paddingBottom:`max(${hasChanges ? 96 : 32}px, calc(${hasChanges ? 80 : 24}px + env(safe-area-inset-bottom, 0px)))` }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#1F1F1F', letterSpacing:'-0.3px', marginBottom:4 }}>
          Choose your track{pendingStreams.length > 1 ? 's' : ''}
        </div>
        <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>Select one or more curricula. You can change anytime.</div>

        {/* UK */}
        <SectionHeader flag="🇬🇧" label="United Kingdom" />
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {ukTracks.map(id => <TrackCard key={id} streamId={id} cfg={STREAM_CONFIG[id]} meta={TRACK_META[id]} enrolled={pendingStreams.includes(id)} onToggle={toggleStream} />)}
        </div>

        {/* US */}
        <SectionHeader flag="🇺🇸" label="United States" />
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {usTracks.map(id => <TrackCard key={id} streamId={id} cfg={STREAM_CONFIG[id]} meta={TRACK_META[id]} enrolled={pendingStreams.includes(id)} onToggle={toggleStream} />)}
        </div>

        {/* International */}
        <SectionHeader flag="🌍" label="International" />
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:8 }}>
          {internationalTracks.map(id => <TrackCard key={id} streamId={id} cfg={STREAM_CONFIG[id]} meta={TRACK_META[id]} enrolled={pendingStreams.includes(id)} onToggle={toggleStream} />)}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      {hasChanges && user && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          padding:`12px 20px calc(12px + env(safe-area-inset-bottom, 0px))`,
          background:'white', borderTop:'1px solid #E5E7EB',
          display:'flex', flexDirection:'column', gap:8, zIndex:20,
          boxShadow:'0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          {saveError && <div style={{ fontSize:12, color:'#DC2626', fontWeight:600, textAlign:'center', padding:'4px 0' }}>{saveError}</div>}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button
              onClick={() => { setPendingStreams(originalStreams); setSaveError(null) }}
              style={{ background:'none', border:'none', fontSize:13, fontWeight:700, color:'#6B7280', cursor:'pointer', fontFamily:'Inter,sans-serif', padding:'0 8px', flexShrink:0 }}
            >
              Cancel
            </button>
            <button
              onClick={saveStreams}
              disabled={saving || pendingStreams.length === 0}
              style={{
                flex:1, padding:'13px 0',
                background: saving || pendingStreams.length === 0 ? '#D1D5DB' : COURSERA_BLUE,
                color:'white', border:'none', borderRadius:8,
                fontSize:14, fontWeight:700,
                cursor: saving || pendingStreams.length === 0 ? 'default' : 'pointer',
                fontFamily:'Inter,sans-serif',
              }}
            >
              {saving ? 'Saving…' : `Get Started →`}
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {startModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={() => { setStartModal(false); navigate(`/${pendingStreams[0]}`) }}>
          <div style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'28px 22px 40px', width:'100%', maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#D1D5DB', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ fontSize:18, fontWeight:800, color:'#1F1F1F', marginBottom:6 }}>Where do you want to start?</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>Pick a track to begin practising.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingStreams.map(t => {
                const accent = TRACK_COLORS[t] ?? COURSERA_BLUE
                const cfg = STREAM_CONFIG[t]
                return (
                  <button key={t} onClick={() => { setStartModal(false); navigate(`/${t}`) }} style={{ display:'flex', alignItems:'center', gap:14, width:'100%', padding:'14px 16px', background:'white', border:'1.5px solid #E5E7EB', borderRadius:12, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent' }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${accent},${accent}BB)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{cfg?.subjects[0]?.emoji ?? '📚'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1F1F1F' }}>{cfg?.label ?? t.toUpperCase()}</div>
                      <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>{cfg?.years ?? ''}</div>
                    </div>
                    <span style={{ fontSize:18, color: accent }}>›</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {advisorOpen && <AdvisorSheet onClose={() => setAdvisorOpen(false)} onAddTracks={addAdvisorTracks} />}
    </div>
  )
}

function SectionHeader({ flag, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, fontSize:11, fontWeight:800, color:'#6B7280', letterSpacing:'0.08em', textTransform:'uppercase' }}>
      <span>{flag}</span><span>{label}</span>
      <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
    </div>
  )
}
