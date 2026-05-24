/**
 * StreamOnboarding — shown once after first login when profile.active_stream is null.
 * Steps:
 *   Step 1 'tracks' — multi-select track rows (UK then US)
 *   Step 2 'ap'     — AP subject search/picker (only when AP track selected)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { upsertProfile, saveApSubjects } from '../lib/db.js'
import { COURSERA_BLUE, TRACK_COLORS } from '../styles/courseraTokens.js'

// ── Track definitions ────────────────────────────────────────────────────────

const TRACK_META = {
  gcse:   { id:'gcse',   region:'uk', flag:'🇬🇧', icon:'📚', title:'GCSE',           subjects:'Maths · English · Science · History · more' },
  alevel: { id:'alevel', region:'uk', flag:'🇬🇧', icon:'🎓', title:'A-Level Entrance', subjects:'UCAT · LNAT · TMUA · ESAT · MAT · PAT · TARA' },
  sat:    { id:'sat',    region:'us', flag:'🇺🇸', icon:'📝', title:'SAT Prep',         subjects:'Math · Reading & Writing' },
  act:    { id:'act',    region:'us', flag:'🇺🇸', icon:'🧮', title:'ACT Prep',          subjects:'English · Math · Reading · Science' },
  ap:     { id:'ap',     region:'us', flag:'🇺🇸', icon:'🏆', title:'AP Subjects',       subjects:'Calculus · Biology · Chemistry · CS · more' },
  psat:   { id:'psat',   region:'us', flag:'🇺🇸', icon:'✏️', title:'PSAT / NMSQT',     subjects:'Math · Reading & Writing' },
}

const UK_TRACKS = ['gcse', 'alevel']
const US_TRACKS = ['sat', 'act', 'ap', 'psat']

const AP_SUBJECTS = [
  { id:'ap_calculus', label:'AP Calculus AB',       emoji:'∫',  cat:'Mathematics' },
  { id:'ap_stats',    label:'AP Statistics',         emoji:'📊', cat:'Mathematics' },
  { id:'ap_bio',      label:'AP Biology',            emoji:'🧬', cat:'Sciences' },
  { id:'ap_chem',     label:'AP Chemistry',          emoji:'⚗️',  cat:'Sciences' },
  { id:'ap_phys',     label:'AP Physics 1',          emoji:'⚛️',  cat:'Sciences' },
  { id:'ap_ush',      label:'AP US History',         emoji:'🗽', cat:'Humanities' },
  { id:'ap_eng_lang', label:'AP English Language',   emoji:'📝', cat:'Humanities' },
  { id:'ap_cs',       label:'AP Computer Science A', emoji:'💻', cat:'Technology' },
  { id:'ap_econ',     label:'AP Economics',          emoji:'💹', cat:'Social Studies' },
]

const AP_CATEGORIES = [...new Set(AP_SUBJECTS.map(s => s.cat))]

// ── Track list step ───────────────────────────────────────────────────────────

function TracksStep({ selected, onToggle, onNext }) {
  const canContinue = selected.length > 0

  function TrackRow({ id }) {
    const t  = TRACK_META[id]
    const on = selected.includes(id)
    const accent = TRACK_COLORS[id] ?? COURSERA_BLUE
    return (
      <button
        onClick={() => onToggle(id)}
        style={{
          display:'flex', alignItems:'center', gap:14,
          width:'100%', padding:'14px 16px',
          background: on ? `${COURSERA_BLUE}08` : 'white',
          border:`1.5px solid ${on ? COURSERA_BLUE : '#E5E7EB'}`,
          borderRadius:10, cursor:'pointer', textAlign:'left',
          transition:'all 0.15s',
          WebkitTapHighlightColor:'transparent', fontFamily:'inherit',
        }}
      >
        <div style={{
          width:40, height:40, borderRadius:10, flexShrink:0,
          background:`${accent}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20,
        }}>
          {t.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1F1F1F', marginBottom:1 }}>
            {t.flag} {t.title}
          </div>
          <div style={{ fontSize:11, color:'#6B7280', lineHeight:1.4 }}>{t.subjects}</div>
        </div>
        <div style={{
          width:20, height:20, borderRadius:4, flexShrink:0,
          background: on ? COURSERA_BLUE : 'white',
          border:`2px solid ${on ? COURSERA_BLUE : '#D1D5DB'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.15s',
        }}>
          {on && <span style={{ color:'white', fontSize:12, lineHeight:1, fontWeight:900 }}>✓</span>}
        </div>
      </button>
    )
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'0 0 120px' }}>
      <RegionGroup label="🇬🇧 United Kingdom">
        {UK_TRACKS.map(id => <TrackRow key={id} id={id} />)}
      </RegionGroup>
      <RegionGroup label="🇺🇸 United States">
        {US_TRACKS.map(id => <TrackRow key={id} id={id} />)}
      </RegionGroup>

      {/* Sticky CTA */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        padding:`16px 20px calc(16px + env(safe-area-inset-bottom, 0px))`,
        background:'white', borderTop:'1px solid #E5E7EB',
      }}>
        <PrimaryBtn disabled={!canContinue} onClick={onNext}>
          {canContinue
            ? `Continue with ${selected.length} track${selected.length > 1 ? 's' : ''} →`
            : 'Select at least one track'}
        </PrimaryBtn>
      </div>
    </div>
  )
}

function RegionGroup({ label, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{
        fontSize:11, fontWeight:800, color:'#6B7280',
        letterSpacing:'0.08em', textTransform:'uppercase',
        marginBottom:10,
      }}>
        {label}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {children}
      </div>
    </div>
  )
}

// ── AP subject picker ──────────────────────────────────────────────────────────

function ApStep({ selected, onToggle, onBack, onNext, saving, error }) {
  const [search, setSearch] = useState('')
  const canContinue = selected.length > 0

  const filtered = search.trim()
    ? AP_SUBJECTS.filter(s => s.label.toLowerCase().includes(search.toLowerCase()))
    : AP_SUBJECTS

  const catGroups = AP_CATEGORIES.reduce((acc, cat) => {
    const subs = filtered.filter(s => s.cat === cat)
    if (subs.length) acc[cat] = subs
    return acc
  }, {})

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'0 0 140px' }}>
      {/* Search input */}
      <div style={{ position:'sticky', top:0, background:'white', paddingBottom:12, zIndex:2 }}>
        <input
          type="search"
          placeholder="Search AP subjects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', padding:'10px 14px',
            border:'1.5px solid #E5E7EB', borderRadius:8,
            fontSize:13, fontFamily:'Inter,sans-serif', color:'#1F1F1F',
            outline:'none', background:'#F5F7FA',
            boxSizing:'border-box',
          }}
        />
      </div>

      {/* Category groups */}
      {Object.entries(catGroups).map(([cat, subs]) => (
        <div key={cat} style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#6B7280', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>
            {cat}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {subs.map(s => {
              const on    = selected.includes(s.id)
              const atMax = !on && selected.length >= 6
              return (
                <button
                  key={s.id}
                  onClick={() => !atMax && onToggle(s.id)}
                  disabled={atMax}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    width:'100%', padding:'11px 14px',
                    background: on ? `${COURSERA_BLUE}08` : 'white',
                    border:`1.5px solid ${on ? COURSERA_BLUE : '#E5E7EB'}`,
                    borderRadius:8, cursor: atMax ? 'not-allowed' : 'pointer',
                    opacity: atMax ? 0.45 : 1,
                    transition:'all 0.15s', fontFamily:'inherit',
                    WebkitTapHighlightColor:'transparent',
                  }}
                >
                  <span style={{ fontSize:18, flexShrink:0 }}>{s.emoji}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#1F1F1F', textAlign:'left' }}>{s.label}</span>
                  <div style={{
                    width:18, height:18, borderRadius:4, flexShrink:0,
                    background: on ? COURSERA_BLUE : 'white',
                    border:`2px solid ${on ? COURSERA_BLUE : '#D1D5DB'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {on && <span style={{ color:'white', fontSize:10, fontWeight:900 }}>✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {error && (
        <div style={{ background:'#FDEAEC', border:'1px solid #C0152F30', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#C0152F', marginBottom:12 }}>
          {error}
        </div>
      )}

      {/* Sticky footer */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        padding:`12px 20px calc(16px + env(safe-area-inset-bottom, 0px))`,
        background:'white', borderTop:'1px solid #E5E7EB',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color: selected.length >= 6 ? '#C0152F' : '#6B7280' }}>
            {selected.length} / 6 selected
          </span>
          <button
            onClick={onBack}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, color:'#6B7280', fontFamily:'inherit' }}
          >
            ← Back
          </button>
        </div>
        <PrimaryBtn disabled={!canContinue || saving} onClick={onNext}>
          {saving ? 'Setting up your account…' : canContinue ? 'Start learning →' : 'Pick at least one subject'}
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function PrimaryBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:'100%', padding:'14px 0',
        background: disabled ? '#D1D5DB' : COURSERA_BLUE,
        color:'white', border:'none', borderRadius:8,
        fontSize:15, fontWeight:700, cursor: disabled ? 'default' : 'pointer',
        transition:'opacity 0.2s', fontFamily:'inherit',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StreamOnboarding({ user, refreshProfile }) {
  const navigate = useNavigate()
  const [step,           setStep]           = useState('tracks')
  const [selectedTracks, setSelectedTracks] = useState([])
  const [selectedAP,     setSelectedAP]     = useState([])
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState(null)

  function toggleTrack(id) {
    setSelectedTracks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function toggleAP(id) {
    setSelectedAP(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function handleTracksNext() {
    if (selectedTracks.includes('ap')) {
      setStep('ap')
    } else {
      handleFinish([])
    }
  }

  async function handleFinish(apSubjects) {
    setSaving(true)
    setError(null)
    try {
      const ukFirst = selectedTracks.find(t => TRACK_META[t].region === 'uk')
      const active  = ukFirst ?? selectedTracks[0]

      const { error: upsertErr } = await upsertProfile(user.id, {
        stream:        active,
        active_stream: active,
        streams:       selectedTracks,
      })
      if (upsertErr) throw upsertErr

      if (selectedTracks.includes('ap') && apSubjects.length > 0) {
        await saveApSubjects(user.id, apSubjects)
      }

      await refreshProfile()
      navigate(`/${active}`)
    } catch (e) {
      setError('Something went wrong — please try again.')
      setSaving(false)
    }
  }

  const stepTitle = step === 'tracks' ? 'Choose your tracks' : 'Which AP subjects?'
  const stepSub   = step === 'tracks'
    ? 'Select one or more — you can switch anytime.'
    : `Up to 6 subjects. You can update these in Settings.${selectedAP.length >= 6 ? ' Maximum reached.' : ''}`

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'#F5F7FA',
      fontFamily:'Inter,sans-serif',
      display:'flex', flexDirection:'column',
    }}>
      {/* Header */}
      <div style={{
        background:'white', borderBottom:'1px solid #E5E7EB',
        padding:`max(16px, env(safe-area-inset-top, 16px)) 20px 14px`,
        flexShrink:0,
      }}>
        <div style={{ fontSize:18, fontWeight:900, color: COURSERA_BLUE, letterSpacing:'-0.4px', marginBottom:2 }}>
          Nexora
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:'#1F1F1F', letterSpacing:'-0.3px' }}>
          {stepTitle}
        </div>
        <div style={{ fontSize:12, color:'#6B7280', marginTop:3, whiteSpace:'pre-line' }}>
          {stepSub}
        </div>
        {/* Step dots */}
        <div style={{ display:'flex', gap:5, marginTop:12 }}>
          {['tracks', 'ap'].map((s, i) => {
            const active = step === s
            const done   = step === 'ap' && i === 0
            return (
              <div key={s} style={{
                height:3, width: active ? 20 : 6, borderRadius:999,
                background: active ? COURSERA_BLUE : done ? `${COURSERA_BLUE}60` : '#D1D5DB',
                transition:'all 0.3s ease',
              }} />
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 0', position:'relative' }}>
        {step === 'tracks' && (
          <TracksStep
            selected={selectedTracks}
            onToggle={toggleTrack}
            onNext={handleTracksNext}
          />
        )}
        {step === 'ap' && (
          <ApStep
            selected={selectedAP}
            onToggle={toggleAP}
            onBack={() => setStep('tracks')}
            onNext={() => handleFinish(selectedAP)}
            saving={saving}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
