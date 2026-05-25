import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { COURSERA_BLUE } from '../styles/courseraTokens.js'

const GCSE_CHIPS = ['📐 Maths', '📚 English', '🔬 Science', '🏛️ History', '🌍 Geography', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '💻 CS', '☯️ RS', '💼 Business']
const US_CHIPS   = ['🇺🇸 SAT Math', '📝 SAT R&W', '🧮 ACT', '🏆 AP Calc', '🏆 AP Bio', '⚗️ AP Chem', '✏️ PSAT', '🏥 UCAT', '⚖️ LNAT', '∑ TMUA', '⚛️ PAT', '🧠 TARA']

const TRACK_GROUPS = [
  { region: '🇬🇧 United Kingdom', label: 'GCSE',              chips: ['📐 Maths', '📚 English', '🔬 Science', '🏛️ History', '🌍 Geography', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '💻 CS', '☯️ RS', '💼 Business'] },
  { region: '🇬🇧 United Kingdom', label: 'A-Level Entrance',  chips: ['🏥 UCAT', '⚖️ LNAT', '∑ TMUA', '⚗️ ESAT', '🧠 TARA', '📐 MAT', '⚛️ PAT', '📊 STEP'] },
  { region: '🇺🇸 United States',  label: 'SAT',               chips: ['📐 SAT Math', '📝 SAT Reading & Writing'] },
  { region: '🇺🇸 United States',  label: 'ACT',               chips: ['🧮 ACT Math', '📖 ACT English', '🔬 ACT Science', '📚 ACT Reading'] },
  { region: '🇺🇸 United States',  label: 'AP',                chips: ['∫ AP Calculus', '🧬 AP Biology', '⚗️ AP Chemistry', '⚛️ AP Physics', '📜 AP US History', '✍️ AP English Lang', '💻 AP CS', '💰 AP Economics', '📊 AP Statistics'] },
  { region: '🇺🇸 United States',  label: 'PSAT',              chips: ['📐 PSAT Math', '📝 PSAT R&W'] },
]

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true'

// ── Onboarding sub-components ─────────────────────────────────────────────────

function Dots({ total, current }) {
  return (
    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height:6, width: i === current ? 20 : 6, borderRadius:999,
          background: i === current ? COURSERA_BLUE : '#D1D5DB',
          transition:'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

function MarqueeRow({ chips, direction }) {
  const doubled = [...chips, ...chips]
  return (
    <div style={{ overflow:'hidden', width:'100%' }}>
      <div
        className={direction === 'left' ? 'marquee-left' : 'marquee-right'}
        style={{ display:'flex', gap:8, width:'max-content' }}
      >
        {doubled.map((chip, i) => (
          <span key={i} style={{
            background:`${COURSERA_BLUE}10`,
            border:`1px solid ${COURSERA_BLUE}30`,
            borderRadius:20,
            padding:'5px 11px', fontSize:11, fontWeight:700, color: COURSERA_BLUE, flexShrink:0,
          }}>{chip}</span>
        ))}
      </div>
    </div>
  )
}

function CtaPanel({ children }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0,
      background:'white', borderRadius:'24px 24px 0 0',
      padding:`24px 24px calc(40px + env(safe-area-inset-bottom, 0px))`,
      boxShadow:'0 -4px 24px rgba(0,0,0,0.08)',
      border:'1px solid #E5E7EB',
    }}>
      {children}
    </div>
  )
}

function WelcomeScreen({ onGetStarted, onSkip }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div style={{
        position:'absolute', top:0, left:0, right:0, bottom:'40%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
        padding:'0 24px 20px', pointerEvents:'none',
      }}>
        <div style={{ fontSize:36, fontWeight:900, color: COURSERA_BLUE, letterSpacing:'-1.5px', marginBottom:8 }}>
          Nexora
        </div>
        <p style={{ color:'#6B7280', fontSize:14, fontWeight:600, margin:'0 0 22px', textAlign:'center' }}>
          Ace your entrance exams
        </p>
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:8 }}>
          <MarqueeRow chips={GCSE_CHIPS} direction="left" />
          <MarqueeRow chips={US_CHIPS}   direction="right" />
        </div>
        <div style={{ marginTop:18 }}><Dots total={3} current={0} /></div>
      </div>

      <CtaPanel>
        <button onClick={onGetStarted} style={ctaBtnS}>Get Started →</button>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button
            onClick={onSkip}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#9CA3AF', fontWeight:600, fontFamily:'Inter,sans-serif' }}
          >
            Skip
          </button>
        </div>
      </CtaPanel>
    </div>
  )
}

function FeaturesScreen({ onContinue, onBack }) {
  const features = [
    { icon:'✨', title:'AI Explanations',   sub:'Instant, personalised explanations for every question' },
    { icon:'🔁', title:'Spaced Repetition', sub:'Smart algorithm shows the right questions at the right time' },
    { icon:'📊', title:'Progress Tracking', sub:'Topic-by-topic accuracy and exam readiness scores' },
  ]
  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div style={{
        position:'absolute', top:0, left:0, right:0, bottom:'28%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'0 20px',
      }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#1F1F1F', letterSpacing:'-0.4px', marginBottom:18, textAlign:'center' }}>
          What's inside
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%' }}>
          {features.map(f => (
            <div key={f.title} style={{
              background:'white',
              border:'1px solid #E5E7EB',
              borderRadius:12, padding:'14px 16px',
              display:'flex', alignItems:'center', gap:14,
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1F1F1F', marginBottom:2 }}>{f.title}</div>
                <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.4 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:18 }}><Dots total={3} current={1} /></div>
      </div>

      <CtaPanel>
        <button onClick={onContinue} style={ctaBtnS}>Continue →</button>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button
            onClick={onBack}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#9CA3AF', fontWeight:700, fontFamily:'Inter,sans-serif' }}
          >
            ← Back
          </button>
        </div>
      </CtaPanel>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AuthGate() {
  const [mode,           setMode]           = useState('signin')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [error,          setError]          = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [done,           setDone]           = useState(false)
  const [resetSent,      setResetSent]      = useState(false)
  const [emailExpanded,  setEmailExpanded]  = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [screenIndex,    setScreenIndex]    = useState(
    () => localStorage.getItem('nexora_onboarded') ? 2 : 0
  )
  const [dragOffset, setDragOffset] = useState(0)
  const dragRef = useRef({ startX:0, dx:0, active:false })

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  function switchMode(next) {
    setMode(next); setError(null); setDone(false); setResetSent(false)
  }

  function goTo(n) {
    const clamped = Math.max(0, Math.min(2, n))
    if (clamped >= 2) localStorage.setItem('nexora_onboarded', '1')
    setScreenIndex(clamped)
    setDragOffset(0)
  }

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, dx: 0, active: true }
  }

  function handlePointerMove(e) {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    dragRef.current.dx = dx
    setDragOffset(dx)
  }

  function handlePointerUp() {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const dx = dragRef.current.dx
    if (Math.abs(dx) > 60) goTo(screenIndex + (dx < 0 ? 1 : -1))
    else setDragOffset(0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setResetSent(true)
      return
    }

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (!err && data?.user?.identities?.length === 0) {
        switchMode('signin')
        setError('An account with this email already exists. Please sign in.')
        return
      }
      if (err) {
        const msg = err.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email address is already')) {
          switchMode('signin')
          setError('An account with this email already exists. Please sign in.')
        } else {
          setError(err.message)
        }
        return
      }
      setDone(true)
      return
    }

    localStorage.setItem('nexora_remember_me', '1')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      localStorage.removeItem('nexora_remember_me')
      const msg = err.message.toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first — check your inbox.')
      } else {
        setError(err.message)
      }
    } else {
      sessionStorage.setItem('nexora_session_active', '1')
    }
  }

  const compact = emailExpanded || mode === 'forgot'

  function sheetBody() {
    if (done) return (
      <div style={{ textAlign:'center', padding:'8px 0' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>📬</div>
        <div style={{ fontWeight:800, fontSize:18, color:'#1F1F1F', marginBottom:8 }}>Check your inbox</div>
        <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.65 }}>
          Confirmation link sent to <strong style={{ color: COURSERA_BLUE }}>{email}</strong>.<br/>
          Click it then come back to sign in.
        </div>
        <button onClick={() => { switchMode('signin'); setEmailExpanded(false) }} style={btnS}>
          Back to Sign In
        </button>
      </div>
    )

    if (resetSent) return (
      <div style={{ textAlign:'center', padding:'8px 0' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>🔑</div>
        <div style={{ fontWeight:800, fontSize:18, color:'#1F1F1F', marginBottom:8 }}>Reset link sent</div>
        <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.65 }}>
          Check <strong style={{ color: COURSERA_BLUE }}>{email}</strong> for the link.
        </div>
        <button onClick={() => { switchMode('signin'); setEmailExpanded(false) }} style={btnS}>
          Back to Sign In
        </button>
      </div>
    )

    if (mode === 'forgot') return (
      <form onSubmit={handleSubmit}>
        <div style={heading}>Reset password</div>
        <div style={{ fontSize:13, color:'#6B7280', marginBottom:18 }}>
          Enter your email and we'll send a reset link.
        </div>
        <Field label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <ErrBox>{error}</ErrBox>}
        <button type="submit" disabled={loading} style={{ ...btnS, opacity: loading ? 0.65 : 1 }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
        <div style={toggleRow}>
          <button type="button" onClick={() => { switchMode('signin'); setEmailExpanded(true) }} style={link}>
            ← Back to Sign In
          </button>
        </div>
      </form>
    )

    return (
      <>
        <div style={heading}>
          {emailExpanded ? (mode === 'signup' ? 'Create account' : 'Welcome back') : 'Get started'}
        </div>

        {AUTH_DISABLED ? (
          <div style={{
            background:'#FEF3C7', border:'1px solid #F59E0B50',
            borderRadius:12, padding:'10px 14px', marginBottom:16,
            fontSize:12, color:'#92400E', fontWeight:600, lineHeight:1.5,
          }}>
            🔒 New sign-ups are currently paused · Existing members sign in below
          </div>
        ) : (
          <>
            <GoogleBtn onClick={signInWithGoogle} />
            {!emailExpanded && (
              <>
                <Divider label="OR" />
                <button
                  onClick={() => setEmailExpanded(true)}
                  style={{ width:'100%', background:'transparent', border:`1.5px solid #E5E7EB`, borderRadius:8, padding:'13px', fontWeight:700, fontSize:14, color:'#374151', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = COURSERA_BLUE}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  Sign in with email
                </button>
              </>
            )}
          </>
        )}

        {(emailExpanded || AUTH_DISABLED) && (
          <form onSubmit={handleSubmit}>
            {!AUTH_DISABLED && <Divider label="OR WITH EMAIL" />}
            <Field label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <label style={labelS}>PASSWORD</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => { switchMode('forgot'); setEmailExpanded(false) }} style={{ ...link, fontSize:11 }}>
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password" required minLength={6}
                name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6+ characters" style={inputS}
                onFocus={e => e.target.style.borderColor = COURSERA_BLUE}
                onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
            {error && <ErrBox>{error}</ErrBox>}
            <button type="submit" disabled={loading} style={{ ...btnS, opacity: loading ? 0.65 : 1 }}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In →'}
            </button>
            {!AUTH_DISABLED && (
              <div style={toggleRow}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={link}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            )}
          </form>
        )}
      </>
    )
  }

  const slideX  = `calc(-${screenIndex * 33.333}% + ${dragOffset}px)`
  const slideTx = dragOffset !== 0 ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)'

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', fontFamily:'Inter,sans-serif', background:'#F5F7FA' }}>
      <style>{css}</style>

      {/* 3-screen horizontal slider */}
      <div
        style={{
          position:'absolute', inset:0,
          display:'flex', width:'300%',
          transform:`translateX(${slideX})`, transition:slideTx,
        }}
        onPointerDown={screenIndex < 2 ? handlePointerDown : undefined}
        onPointerMove={screenIndex < 2 ? handlePointerMove : undefined}
        onPointerUp={screenIndex < 2 ? handlePointerUp : undefined}
        onPointerLeave={screenIndex < 2 ? handlePointerUp : undefined}
      >
        {/* Screen 0 — Welcome */}
        <div style={{ width:'33.333%', height:'100%', position:'relative', flexShrink:0 }}>
          <WelcomeScreen onGetStarted={() => goTo(1)} onSkip={() => goTo(2)} />
        </div>

        {/* Screen 1 — Features */}
        <div style={{ width:'33.333%', height:'100%', position:'relative', flexShrink:0 }}>
          <FeaturesScreen onContinue={() => goTo(2)} onBack={() => goTo(0)} />
        </div>

        {/* Screen 2 — Sign-in */}
        <div style={{ width:'33.333%', height:'100%', position:'relative', flexShrink:0 }}>
          <div style={{
            position:'absolute', top:0, left:0, right:0,
            bottom: compact ? '66%' : '46%',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'flex-end',
            padding:'0 24px 28px',
            transition:'bottom 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
            pointerEvents:'none',
          }}>
            <div className="animate-fade-up" style={{ textAlign:'center' }}>
              <div style={{ fontSize:38, fontWeight:900, color: COURSERA_BLUE, letterSpacing:'-1.5px', marginBottom:6 }}>
                Nexora
                <span style={{ marginLeft:8, background:`${COURSERA_BLUE}15`, border:`1px solid ${COURSERA_BLUE}30`, color: COURSERA_BLUE, fontSize:9, fontWeight:800, letterSpacing:'0.08em', padding:'2px 7px', borderRadius:6, verticalAlign:'middle' }}>BETA</span>
              </div>
              <p style={{ color:'#6B7280', fontSize:11, fontWeight:700, margin:0, letterSpacing:'0.16em' }}>
                ACE YOUR ENTRANCE EXAMS
              </p>
            </div>

            {!compact && (
              <div className="animate-fade-up" style={{ display:'flex', flexDirection:'column', gap:6, marginTop:20, width:'100%', pointerEvents:'auto' }}>
                {TRACK_GROUPS.map((group, i) => {
                  const open = !!expandedGroups[group.label]
                  const showRegionHeader = i === 0 || TRACK_GROUPS[i - 1].region !== group.region
                  return (
                    <div key={group.label}>
                      {showRegionHeader && (
                        <div style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', padding:'6px 2px 4px' }}>
                          {group.region}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedGroups(g => ({ ...g, [group.label]: !g[group.label] }))}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          width:'100%', background:'white',
                          border:'1px solid #E5E7EB',
                          borderRadius: open ? '10px 10px 0 0' : 10,
                          padding:'9px 13px', cursor:'pointer',
                          fontFamily:'Inter,sans-serif',
                          transition:'border-radius 0.22s ease',
                        }}
                      >
                        <span style={{ fontSize:10, fontWeight:800, color:'#374151', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                          {group.label}
                        </span>
                        <span style={{
                          fontSize:13, color:'#9CA3AF',
                          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition:'transform 0.25s ease', display:'block', lineHeight:1,
                        }}>▾</span>
                      </button>
                      {open && (
                        <div style={{
                          background:'white',
                          borderRadius:'0 0 10px 10px',
                          border:'1px solid #E5E7EB', borderTop:'none',
                          padding:'10px 10px 12px',
                        }}>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {group.chips.map(chip => (
                              <span key={chip} style={{ background:`${COURSERA_BLUE}10`, border:`1px solid ${COURSERA_BLUE}25`, borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700, color: COURSERA_BLUE }}>
                                {chip}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom sheet */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            background:'#FFFFFF', borderRadius:'24px 24px 0 0',
            padding:`24px 24px calc(40px + env(safe-area-inset-bottom, 0px))`,
            boxShadow:'0 -4px 24px rgba(0,0,0,0.08)',
            border:'1px solid #E5E7EB',
            maxHeight:'78dvh', overflowY:'auto',
          }}>
            <div style={{ width:32, height:4, borderRadius:2, background:'#E5E7EB', margin:'0 auto 20px' }} />
            {sheetBody()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoogleBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'white', border:'1.5px solid #E5E7EB', borderRadius:8, padding:'13px', fontWeight:700, fontSize:14, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:12, transition:'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      <GoogleIcon /> Continue with Google
    </button>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
      <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
      <span style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={labelS}>{label}</label>
      <input
        type={type} required name={type} autoComplete={type}
        value={value} onChange={onChange} placeholder={placeholder} style={inputS}
        onFocus={e => e.target.style.borderColor = COURSERA_BLUE}
        onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{ background:'#FDEAEC', border:'1px solid #C0152F30', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#C0152F', marginBottom:14 }}>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading   = { fontWeight:800, fontSize:22, color:'#1F1F1F', marginBottom:20, letterSpacing:'-0.4px' }
const labelS    = { display:'block', fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em', marginBottom:5 }
const inputS    = { width:'100%', padding:'12px 13px', borderRadius:8, fontSize:14, background:'#F5F7FA', border:'1.5px solid #E5E7EB', color:'#1F1F1F', outline:'none', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', boxSizing:'border-box' }
const toggleRow = { textAlign:'center', marginTop:16, fontSize:13, color:'#6B7280' }
const link      = { background:'none', border:'none', cursor:'pointer', color: COURSERA_BLUE, fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif', padding:0 }

const ctaBtnS = {
  display:'block', width:'100%',
  background: COURSERA_BLUE,
  color:'white', border:'none', borderRadius:8,
  padding:'14px', fontWeight:700, cursor:'pointer',
  fontSize:15, fontFamily:'Inter,sans-serif',
  transition:'opacity 0.2s',
}

const btnS = {
  display:'block', width:'100%', background: COURSERA_BLUE, color:'white', border:'none',
  borderRadius:8, padding:'14px', fontWeight:700, cursor:'pointer',
  fontSize:15, fontFamily:'Inter,sans-serif',
  transition:'opacity 0.2s', marginTop:4, marginBottom:4,
}

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .animate-fade-up   { animation: fadeUp 0.4s ease both; }
  @keyframes marqueeLeft  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes marqueeRight { from{transform:translateX(-50%)} to{transform:translateX(0)} }
  .marquee-left  { animation: marqueeLeft  18s linear infinite; }
  .marquee-right { animation: marqueeRight 18s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .marquee-left, .marquee-right { animation-play-state: paused; }
  }
`
