import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { upsertProfile } from '../lib/db.js'
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
}

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
      <span style={{ fontSize:11, fontWeight:700, color:'#374151', marginLeft:2 }}>{val}</span>
    </div>
  )
}

function TrackCard({ streamId, cfg, meta, enrolled, onToggle }) {
  const accent = TRACK_COLORS[streamId] ?? COURSERA_BLUE
  const subjectCount = cfg.subjects.filter(s => !s.deprecated).length
  return (
    <div style={{
      background:'white', borderRadius:12,
      border:'1px solid #E5E7EB',
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      overflow:'hidden', fontFamily:'Inter,sans-serif',
    }}>
      <div style={{
        height:72, background:`linear-gradient(135deg, ${accent} 0%, ${accent}BB 100%)`,
        display:'flex', alignItems:'center', padding:'0 18px', gap:12,
      }}>
        <div style={{ fontSize:28 }}>{cfg.subjects[0]?.emoji ?? '📚'}</div>
        <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.85)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          {cfg.label?.replace(' Track','').replace(' Prep','') ?? streamId.toUpperCase()}
        </div>
      </div>

      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#1F1F1F', marginBottom:4 }}>{cfg.label ?? streamId.toUpperCase()}</div>
        <div style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>
          {cfg.years} · {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
        </div>
        <StarRating val={meta.stars} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1, marginRight:10 }}>
            {cfg.subjects.filter(s => !s.deprecated).slice(0, 3).map(s => (
              <span key={s.id} style={{
                background:`${accent}12`, border:`1px solid ${accent}30`,
                borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700, color: accent,
              }}>{s.emoji} {s.label}</span>
            ))}
            {subjectCount > 3 && (
              <span style={{ background:`${accent}12`, border:`1px solid ${accent}30`, borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700, color: accent }}>
                +{subjectCount - 3} more
              </span>
            )}
          </div>

          <button
            onClick={() => onToggle(streamId)}
            style={{
              flexShrink:0,
              background: enrolled ? '#E6F4F0' : `${COURSERA_BLUE}12`,
              border: enrolled ? '1.5px solid #008060' : `1.5px solid ${COURSERA_BLUE}40`,
              borderRadius:20, padding:'7px 16px',
              fontSize:12, fontWeight:800,
              color: enrolled ? '#008060' : COURSERA_BLUE,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              whiteSpace:'nowrap',
            }}
          >
            {enrolled ? '✓ Enrolled' : '+ Enrol'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Advisor Sheet ──────────────────────────────────────────────────────────

const UK_YEARS   = [8,9,10,11,12,13]
const US_GRADES  = [6,7,8,9,10,11,12]
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
    const rec = await fetchTrackRecommendation({
      country: answers.country,
      year:    answers.year,
      goal:    answers.goal,
    })
    setResult(rec)
    setLoading(false)
  }

  const stepLabels = [
    'Which country are you studying in?',
    `What ${answers.country === 'uk' ? 'year' : 'grade'} are you in?`,
    "What's your university goal?",
  ]

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}
      onClick={onClose}
    >
      <div
        style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'28px 22px 40px', width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}
      >
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
                return (
                  <div key={t} style={{ background:`${accent}12`, border:`1.5px solid ${accent}40`, borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:700, color: accent }}>
                    {STREAM_CONFIG[t]?.label ?? t.toUpperCase()}
                  </div>
                )
              })}
            </div>
            <div style={{ background:'#F5F7FA', borderRadius:12, padding:'14px', marginBottom:20, fontSize:13, color:'#374151', lineHeight:1.6 }}>
              {result.reason}
            </div>
            <button
              onClick={() => { onAddTracks(result.tracks); onClose() }}
              style={{ width:'100%', padding:'14px 0', background:COURSERA_BLUE, color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:10, fontFamily:'Inter,sans-serif' }}
            >
              Add these tracks →
            </button>
            <button
              onClick={() => { setStep(0); setAnswers({}); setResult(null) }}
              style={{ width:'100%', padding:'10px 0', background:'none', border:'none', fontSize:13, color:'#6B7280', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            >
              Start over
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🤔</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:12 }}>Analysing your needs…</div>
            <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:4, background:COURSERA_BLUE, opacity:0.6 }} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Progress bar */}
            <div style={{ display:'flex', gap:4, marginBottom:20 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ height:3, flex:1, borderRadius:999, background: i <= step ? COURSERA_BLUE : '#E5E7EB', transition:'background 0.2s' }} />
              ))}
            </div>

            <div style={{ fontSize:16, fontWeight:700, color:'#1F1F1F', marginBottom:18 }}>
              {stepLabels[step]}
            </div>

            {step === 0 && (
              <div style={{ display:'flex', gap:10 }}>
                {[['uk','🇬🇧 United Kingdom'],['us','🇺🇸 United States']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => choose('country', val)}
                    style={{ flex:1, padding:'18px 0', background:'white', border:`1.5px solid ${COURSERA_BLUE}30`, borderRadius:12, fontSize:14, fontWeight:700, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                  >{label}</button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {(answers.country === 'uk' ? UK_YEARS : US_GRADES).map(y => (
                  <button
                    key={y}
                    onClick={() => choose('year', y)}
                    style={{ padding:'10px 18px', background:'white', border:`1.5px solid ${COURSERA_BLUE}30`, borderRadius:20, fontSize:13, fontWeight:700, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                  >
                    {answers.country === 'uk' ? `Year ${y}` : `Grade ${y}`}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {GOALS.map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setAnswers(a => ({ ...a, goal: val }))}
                      style={{
                        padding:'13px 16px',
                        background: answers.goal === val ? `${COURSERA_BLUE}10` : 'white',
                        border:`1.5px solid ${answers.goal === val ? COURSERA_BLUE : '#E5E7EB'}`,
                        borderRadius:10, fontSize:13, fontWeight:700,
                        color: answers.goal === val ? COURSERA_BLUE : '#1F1F1F',
                        cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
                      }}
                    >{label}</button>
                  ))}
                </div>
                <button
                  onClick={getRecommendation}
                  disabled={!answers.goal}
                  style={{
                    width:'100%', padding:'14px 0',
                    background: answers.goal ? COURSERA_BLUE : '#D1D5DB',
                    color:'white', border:'none', borderRadius:8,
                    fontSize:14, fontWeight:700,
                    cursor: answers.goal ? 'pointer' : 'default',
                    fontFamily:'Inter,sans-serif',
                  }}
                >
                  Get Recommendation →
                </button>
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
    if (!user) {
      navigate(`/${stream}`)
      return
    }
    setPendingStreams(prev =>
      prev.includes(stream) ? prev.filter(s => s !== stream) : [...prev, stream]
    )
  }

  async function saveStreams() {
    if (!user || !pendingStreams.length) return
    setSaving(true)
    setSaveError(null)
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out — please try again.')), 8000)
      )
      const { error } = await Promise.race([
        upsertProfile(user.id, {
          streams:       pendingStreams,
          stream:        pendingStreams[0],
          active_stream: pendingStreams[0],
        }),
        timeout,
      ])
      if (error) throw new Error(error.message ?? 'Save failed.')
      refreshProfile?.().catch(() => {})
      setStartModal(true)
    } catch (err) {
      setSaveError(err?.message ?? 'Save failed — please try again.')
    } finally {
      setSaving(false)
    }
  }

  function addAdvisorTracks(tracks) {
    setPendingStreams(prev => [...new Set([...prev, ...tracks])])
  }

  const ukTracks = ['gcse', 'alevel']
  const usTracks = ['sat', 'act', 'ap', 'psat']

  return (
    <div style={{
      minHeight:'100dvh',
      background:'#F5F7FA',
      fontFamily:'Inter,sans-serif',
      paddingBottom:`max(${hasChanges ? 96 : 32}px, calc(${hasChanges ? 80 : 24}px + env(safe-area-inset-bottom, 0px)))`,
    }}>
      {/* Header */}
      <div style={{
        background:'white', borderBottom:'1px solid #E5E7EB',
        padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:10,
      }}>
        <div style={{ fontSize:20, fontWeight:900, color: COURSERA_BLUE, letterSpacing:'-0.5px' }}>Nexora</div>
        {profile?.stream && (
          <button
            onClick={() => navigate(`/${profile.stream}`)}
            style={{
              background:'transparent', border:`1.5px solid ${COURSERA_BLUE}`, borderRadius:20,
              padding:'6px 14px', fontSize:12, fontWeight:700, color: COURSERA_BLUE,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <div style={{ padding:'24px 16px 0', maxWidth:680, margin:'0 auto' }}>
        {/* Page title */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#1F1F1F', letterSpacing:'-0.4px', marginBottom:6 }}>
            Choose your track{pendingStreams.length > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize:13, color:'#6B7280' }}>
            Select one or more curricula. You can change anytime.
          </div>
        </div>

        {/* AI Advisor card */}
        <button
          onClick={() => setAdvisorOpen(true)}
          style={{
            display:'flex', alignItems:'center', gap:12, width:'100%',
            background:`${COURSERA_BLUE}08`, border:`1.5px solid ${COURSERA_BLUE}30`,
            borderRadius:12, padding:'14px 16px', marginBottom:24,
            cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          <span style={{ fontSize:24, flexShrink:0 }}>🤖</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:COURSERA_BLUE }}>Not sure which track?</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>Get a personalised recommendation in 30 seconds</div>
          </div>
          <span style={{ fontSize:18, color:COURSERA_BLUE }}>›</span>
        </button>

        {/* UK section */}
        <div style={{ marginBottom:8 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:14,
            fontSize:11, fontWeight:800, color:'#6B7280',
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span>🇬🇧</span>
            <span>United Kingdom</span>
            <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {ukTracks.map(id => (
              <TrackCard
                key={id}
                streamId={id}
                cfg={STREAM_CONFIG[id]}
                meta={TRACK_META[id]}
                enrolled={pendingStreams.includes(id)}
                onToggle={toggleStream}
              />
            ))}
          </div>
        </div>

        {/* US section */}
        <div style={{ marginTop:24, marginBottom:8 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:14,
            fontSize:11, fontWeight:800, color:'#6B7280',
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span>🇺🇸</span>
            <span>United States</span>
            <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {usTracks.map(id => (
              <TrackCard
                key={id}
                streamId={id}
                cfg={STREAM_CONFIG[id]}
                meta={TRACK_META[id]}
                enrolled={pendingStreams.includes(id)}
                onToggle={toggleStream}
              />
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:28, paddingBottom:8 }}>
          {['Free Forever','AI Explanations','Spaced Repetition','GDPR Safe'].map(p => (
            <span key={p} style={{
              background:'white', border:'1px solid #E5E7EB',
              borderRadius:20, padding:'4px 12px',
              fontSize:11, color:'#6B7280', fontWeight:600,
            }}>{p}</span>
          ))}
        </div>
      </div>

      {/* Sticky save footer */}
      {hasChanges && user && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          padding:`12px 20px calc(12px + env(safe-area-inset-bottom, 0px))`,
          background:'white', borderTop:'1px solid #E5E7EB',
          display:'flex', flexDirection:'column', gap:8, zIndex:20,
        }}>
          {saveError && (
            <div style={{ fontSize:12, color:'#DC2626', fontWeight:600, textAlign:'center', padding:'4px 0' }}>
              {saveError}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
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
              {saving ? 'Saving…' : `Save ${pendingStreams.length} track${pendingStreams.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* "Which track to start?" modal */}
      {startModal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}
          onClick={() => { setStartModal(false); navigate(`/${pendingStreams[0]}`) }}
        >
          <div
            style={{ background:'white', borderRadius:'24px 24px 0 0', padding:'28px 22px 40px', width:'100%', maxWidth:480 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width:40, height:4, background:'#D1D5DB', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ fontSize:18, fontWeight:800, color:'#1F1F1F', marginBottom:6 }}>Where do you want to start?</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>Pick a track to begin practising.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingStreams.map(t => {
                const accent = TRACK_COLORS[t] ?? COURSERA_BLUE
                const cfg = STREAM_CONFIG[t]
                return (
                  <button
                    key={t}
                    onClick={() => { setStartModal(false); navigate(`/${t}`) }}
                    style={{
                      display:'flex', alignItems:'center', gap:14,
                      width:'100%', padding:'14px 16px',
                      background:'white', border:'1.5px solid #E5E7EB',
                      borderRadius:12, cursor:'pointer', textAlign:'left',
                      fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
                    }}
                  >
                    <div style={{ width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${accent},${accent}BB)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                      {cfg?.subjects[0]?.emoji ?? '📚'}
                    </div>
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

      {/* AI Advisor sheet */}
      {advisorOpen && (
        <AdvisorSheet
          onClose={() => setAdvisorOpen(false)}
          onAddTracks={addAdvisorTracks}
        />
      )}
    </div>
  )
}
