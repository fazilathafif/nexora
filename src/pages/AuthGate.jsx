import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// Bokeh circles — warm depth-of-field feel
const BOKEH = [
  { w:360, h:360, top:'-12%', left:'-18%', r:'255,200,80',  o:0.55, blur:100 },
  { w:240, h:240, top:'6%',   right:'-8%', r:'255,80,200',  o:0.45, blur:70  },
  { w:160, h:160, top:'32%',  left:'12%',  r:'255,255,160', o:0.28, blur:45  },
  { w:280, h:280, top:'16%',  right:'-5%', r:'200,60,255',  o:0.32, blur:80  },
  { w:130, h:130, top:'52%',  left:'2%',   r:'255,180,80',  o:0.38, blur:38  },
  { w:200, h:200, top:'38%',  left:'46%',  r:'255,100,180', o:0.28, blur:65  },
  { w:110, h:110, top:'12%',  left:'38%',  r:'255,255,255', o:0.18, blur:28  },
  { w:180, h:180, top:'68%',  right:'8%',  r:'255,140,60',  o:0.25, blur:55  },
]

const TRACK_GROUPS = [
  {
    label: 'GCSE',
    chips: ['📐 Maths', '📚 English', '🔬 Science', '🏛️ History', '🌍 Geography', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '💻 CS', '☯️ RS', '💼 Business'],
  },
  {
    label: 'A-Level Entrance',
    chips: ['🏥 UCAT', '⚖️ LNAT', '∑ TMUA', '⚗️ ESAT', '🧠 TARA', '📐 MAT', '⚛️ PAT', '📊 STEP'],
  },
]

const FEATURES = [
  { icon:'✨', title:'AI Explanations', desc:'Instant, personalised explanations for every question' },
  { icon:'🔁', title:'Spaced Repetition', desc:'Smart algorithm shows the right questions at the right time' },
  { icon:'📊', title:'Progress Tracking', desc:'Topic-by-topic accuracy and exam readiness scores' },
]

const BG   = 'linear-gradient(160deg,#FF6B35 0%,#FF3CAC 52%,#7B2FBE 100%)'
const GRAD = 'linear-gradient(135deg,#FF6B35,#FF3CAC)'

// ── Shared sub-components ─────────────────────────────────────────────────────

function BokehLayer() {
  return BOKEH.map((b, i) => (
    <div key={i} style={{
      position:'absolute', width:b.w, height:b.h, borderRadius:'50%',
      background:`rgba(${b.r},${b.o})`, filter:`blur(${b.blur}px)`,
      top:b.top, left:b.left, right:b.right, pointerEvents:'none',
    }} />
  ))
}

function Dots({ total, current }) {
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height:7, width: i === current ? 22 : 7, borderRadius:999,
          background: i === current ? 'white' : 'rgba(255,255,255,0.38)',
          transition:'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

function MarqueeRow({ chips, direction }) {
  const doubled = [...chips, ...chips]
  const anim = direction === 'right'
    ? 'marqueeRight 20s linear infinite'
    : 'marqueeLeft 20s linear infinite'
  return (
    <div style={{ overflow:'hidden', width:'100%' }}>
      <div style={{ display:'flex', gap:8, animation:anim, willChange:'transform' }}>
        {doubled.map((chip, i) => (
          <span key={i} style={{
            flexShrink:0,
            background:'rgba(255,255,255,0.15)', backdropFilter:'blur(6px)',
            border:'1px solid rgba(255,255,255,0.28)',
            borderRadius:20, padding:'5px 12px',
            fontSize:12, fontWeight:700, color:'white', whiteSpace:'nowrap',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function CtaPanel({ children }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0,
      background:'white', borderRadius:'28px 28px 0 0',
      padding:`24px 24px calc(32px + env(safe-area-inset-bottom, 0px))`,
      boxShadow:'0 -16px 56px rgba(0,0,0,0.22)',
    }}>
      {children}
    </div>
  )
}

// ── Screen 0: Welcome ─────────────────────────────────────────────────────────

function WelcomeScreen({ goTo }) {
  return (
    <div style={{ width:'100vw', height:'100dvh', position:'relative', overflow:'hidden', background:BG, flexShrink:0 }}>
      <BokehLayer />

      {/* Skip */}
      <button
        onClick={() => goTo(2)}
        style={{
          position:'absolute', top:'max(20px, env(safe-area-inset-top, 20px))', right:20, zIndex:10,
          background:'rgba(255,255,255,0.2)', backdropFilter:'blur(6px)',
          border:'1px solid rgba(255,255,255,0.35)', borderRadius:12,
          padding:'7px 16px', fontSize:12, fontWeight:700,
          color:'white', cursor:'pointer', fontFamily:'Inter,sans-serif',
        }}
      >
        Skip
      </button>

      {/* Hero */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, bottom:'52%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
        padding:'0 24px 28px', pointerEvents:'none',
      }}>
        <span style={{ fontSize:40, display:'block', marginBottom:8, animation:'float 3s ease-in-out infinite', color:'white', textShadow:'0 2px 16px rgba(0,0,0,0.2)' }}>✦</span>
        <h1 style={{
          fontSize:64, fontWeight:900, color:'white', letterSpacing:'-3px', margin:'0 0 12px',
          fontFamily:"'Playfair Display', Georgia, serif",
          textShadow:'0 4px 28px rgba(0,0,0,0.22)',
        }}>Nexora</h1>
        <p style={{ color:'rgba(255,255,255,0.9)', fontSize:16, fontWeight:700, margin:0, letterSpacing:'0.04em', textAlign:'center' }}>
          Ace your UK entrance exams
        </p>
      </div>

      {/* Marquee rows */}
      <div style={{
        position:'absolute', bottom:'52%', left:0, right:0,
        display:'flex', flexDirection:'column', gap:10, paddingTop:20,
        pointerEvents:'none',
      }}>
        <MarqueeRow chips={TRACK_GROUPS[0].chips} direction="left" />
        <MarqueeRow chips={TRACK_GROUPS[1].chips} direction="right" />
      </div>

      <CtaPanel>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <Dots total={3} current={0} />
        </div>
        <button onClick={() => goTo(1)} style={btnS(GRAD)}>
          Get Started →
        </button>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button
            onClick={() => goTo(2)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:13, fontWeight:600, fontFamily:'Inter,sans-serif' }}
          >
            Already have an account? Sign In
          </button>
        </div>
      </CtaPanel>
    </div>
  )
}

// ── Screen 1: Features ────────────────────────────────────────────────────────

function FeaturesScreen({ goTo }) {
  return (
    <div style={{ width:'100vw', height:'100dvh', position:'relative', overflow:'hidden', background:BG, flexShrink:0 }}>
      <BokehLayer />

      {/* Header */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, bottom:'62%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
        padding:'0 24px 24px', pointerEvents:'none',
      }}>
        <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.65)', letterSpacing:'0.18em', marginBottom:12 }}>
          WHAT'S INSIDE
        </div>
        <h2 style={{
          fontSize:36, fontWeight:900, color:'white', letterSpacing:'-1px', margin:0, textAlign:'center',
          fontFamily:"'Playfair Display', Georgia, serif",
          textShadow:'0 3px 20px rgba(0,0,0,0.2)',
        }}>
          Everything you need to pass
        </h2>
      </div>

      {/* Feature cards */}
      <div style={{
        position:'absolute', bottom:'44%', left:0, right:0,
        display:'flex', flexDirection:'column', gap:10, padding:'0 20px',
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background:'rgba(255,255,255,0.18)',
            backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
            border:'1px solid rgba(255,255,255,0.32)', borderRadius:20,
            padding:'16px 20px', display:'flex', alignItems:'center', gap:16,
          }}>
            <span style={{ fontSize:28, flexShrink:0 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'white', marginBottom:3 }}>{f.title}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.78)', lineHeight:1.45 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <CtaPanel>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <Dots total={3} current={1} />
        </div>
        <button onClick={() => goTo(2)} style={btnS(GRAD)}>
          Continue →
        </button>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button
            onClick={() => goTo(0)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:13, fontWeight:600, fontFamily:'Inter,sans-serif' }}
          >
            ← Back
          </button>
        </div>
      </CtaPanel>
    </div>
  )
}

// ── Main AuthGate ─────────────────────────────────────────────────────────────

export default function AuthGate() {
  const [screenIndex, setScreenIndex] = useState(
    () => localStorage.getItem('nexora_onboarded') ? 2 : 0
  )
  const [mode,          setMode]          = useState('signin')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [error,         setError]         = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [done,          setDone]          = useState(false)
  const [resetSent,     setResetSent]     = useState(false)
  const [emailExpanded, setEmailExpanded] = useState(false)

  const sliderRef = useRef(null)
  const dragRef   = useRef(null)

  function goTo(n) {
    if (n >= 2) localStorage.setItem('nexora_onboarded', '1')
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)'
      sliderRef.current.style.transform  = `translateX(-${n * 100}vw)`
    }
    setScreenIndex(n)
  }

  function onPointerDown(e) {
    if (screenIndex === 2) return
    dragRef.current = { startX: e.clientX, pointerId: e.pointerId, captured: false }
  }

  function onPointerMove(e) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    if (!dragRef.current.captured && Math.abs(dx) > 8) {
      dragRef.current.captured = true
      sliderRef.current.setPointerCapture(dragRef.current.pointerId)
      sliderRef.current.style.transition = 'none'
    }
    if (!dragRef.current.captured) return
    sliderRef.current.style.transform = `translateX(calc(-${screenIndex * 100}vw + ${dx}px))`
  }

  function onPointerUp(e) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    dragRef.current = null
    sliderRef.current.style.transition = 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)'
    if (Math.abs(dx) > 60) {
      const next = dx < 0
        ? Math.min(screenIndex + 1, 2)
        : Math.max(screenIndex - 1, 0)
      if (next >= 2) localStorage.setItem('nexora_onboarded', '1')
      sliderRef.current.style.transform = `translateX(-${next * 100}vw)`
      setScreenIndex(next)
    } else {
      sliderRef.current.style.transform = `translateX(-${screenIndex * 100}vw)`
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  function switchMode(next) {
    setMode(next); setError(null); setDone(false); setResetSent(false)
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
        <div style={{ fontWeight:800, fontSize:18, color:'#1E293B', marginBottom:8 }}>Check your inbox</div>
        <div style={{ fontSize:13, color:'#64748B', lineHeight:1.65 }}>
          Confirmation link sent to <strong style={{ color:'#FF6B35' }}>{email}</strong>.<br/>
          Click it then come back to sign in.
        </div>
        <button onClick={() => { switchMode('signin'); setEmailExpanded(false) }} style={btnS(GRAD)}>
          Back to Sign In
        </button>
      </div>
    )

    if (resetSent) return (
      <div style={{ textAlign:'center', padding:'8px 0' }}>
        <div style={{ fontSize:44, marginBottom:10 }}>🔑</div>
        <div style={{ fontWeight:800, fontSize:18, color:'#1E293B', marginBottom:8 }}>Reset link sent</div>
        <div style={{ fontSize:13, color:'#64748B', lineHeight:1.65 }}>
          Check <strong style={{ color:'#FF6B35' }}>{email}</strong> for the link.
        </div>
        <button onClick={() => { switchMode('signin'); setEmailExpanded(false) }} style={btnS(GRAD)}>
          Back to Sign In
        </button>
      </div>
    )

    if (mode === 'forgot') return (
      <form onSubmit={handleSubmit}>
        <div style={heading}>Reset password</div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:18 }}>
          Enter your email and we'll send a reset link.
        </div>
        <Field label="EMAIL" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <ErrBox>{error}</ErrBox>}
        <button type="submit" disabled={loading} style={{ ...btnS(GRAD), opacity: loading ? 0.65 : 1 }}>
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

        <GoogleBtn onClick={signInWithGoogle} />

        {!emailExpanded ? (
          <>
            <Divider label="OR" />
            <button
              onClick={() => setEmailExpanded(true)}
              style={{ width:'100%', background:'transparent', border:'1.5px solid #CBD5E1', borderRadius:16, padding:'15px', fontWeight:700, fontSize:14, color:'#475569', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#FF6B35'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#CBD5E1'}
            >
              Sign in with email
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Divider label="OR WITH EMAIL" />
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
                onFocus={e => e.target.style.borderColor='#FF6B35'}
                onBlur={e  => e.target.style.borderColor='#E2E8F0'}
              />
            </div>
            {error && <ErrBox>{error}</ErrBox>}
            <button type="submit" disabled={loading} style={{ ...btnS(GRAD), opacity: loading ? 0.65 : 1 }}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In →'}
            </button>
            <div style={toggleRow}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={link}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', fontFamily:'Inter,sans-serif' }}>
      <style>{css}</style>

      <div
        ref={sliderRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          display:'flex', width:'300vw', height:'100dvh',
          transform:`translateX(-${screenIndex * 100}vw)`,
          transition:'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange:'transform',
        }}
      >
        {/* Screen 0 */}
        <WelcomeScreen goTo={goTo} />

        {/* Screen 1 */}
        <FeaturesScreen goTo={goTo} />

        {/* Screen 2 — existing auth form, unchanged */}
        <div style={{ width:'100vw', height:'100dvh', position:'relative', flexShrink:0, background:BG, overflow:'hidden' }}>
          {BOKEH.map((b, i) => (
            <div key={i} style={{
              position:'absolute', width:b.w, height:b.h, borderRadius:'50%',
              background:`rgba(${b.r},${b.o})`, filter:`blur(${b.blur}px)`,
              top:b.top, left:b.left, right:b.right, pointerEvents:'none',
            }} />
          ))}

          {/* Logo / hero */}
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
              <span style={{ fontSize:36, display:'block', marginBottom:4, animation:'float 3s ease-in-out infinite', color:'white', textShadow:'0 2px 16px rgba(0,0,0,0.2)' }}>✦</span>
              <div style={{ position:'relative', display:'inline-block', marginBottom:10 }}>
                <h1 style={titleS}>Nexora</h1>
                <span style={{ position:'absolute', top:6, right:-40, background:'rgba(255,255,255,0.25)', backdropFilter:'blur(4px)', color:'white', fontSize:9, fontWeight:800, letterSpacing:'0.08em', padding:'2px 7px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)' }}>BETA</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.82)', fontSize:11, fontWeight:700, margin:0, letterSpacing:'0.16em' }}>
                ACE YOUR ENTRANCE EXAMS
              </p>
            </div>

            {!compact && (
              <div className="animate-fade-up" style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20, width:'100%' }}>
                {TRACK_GROUPS.map(group => (
                  <div key={group.label}>
                    <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.55)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>
                      {group.label}
                    </div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {group.chips.map(chip => (
                        <span key={chip} style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.28)', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700, color:'white' }}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom sheet */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            background:'#FFFFFF', borderRadius:'28px 28px 0 0',
            padding:`24px 24px calc(40px + env(safe-area-inset-bottom, 0px))`,
            boxShadow:'0 -16px 56px rgba(0,0,0,0.22)',
            maxHeight:'78dvh', overflowY:'auto',
          }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'#CBD5E1', margin:'0 auto 22px' }} />
            {sheetBody()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Auth sub-components ───────────────────────────────────────────────────────

function GoogleBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'white', border:'1.5px solid #E2E8F0', borderRadius:16, padding:'15px', fontWeight:700, fontSize:14, color:'#1E293B', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', marginBottom:12, transition:'box-shadow 0.2s,transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.14)'; e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(0)' }}
    >
      <GoogleIcon /> Continue with Google
    </button>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
      <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
      <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
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
        onFocus={e => e.target.style.borderColor='#FF6B35'}
        onBlur={e  => e.target.style.borderColor='#E2E8F0'}
      />
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{ background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#BE123C', marginBottom:14 }}>
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

const titleS = {
  fontSize:54, fontWeight:900, letterSpacing:'-2px', margin:'0 0 2px',
  fontFamily:"'Playfair Display', Georgia, serif",
  color:'white', textShadow:'0 4px 28px rgba(0,0,0,0.22)',
}

const heading = {
  fontWeight:900, fontSize:22, color:'#1E293B',
  marginBottom:20, letterSpacing:'-0.4px',
}

const labelS = {
  display:'block', fontSize:10, fontWeight:700, color:'#94A3B8',
  letterSpacing:'0.1em', marginBottom:5,
}

const inputS = {
  width:'100%', padding:'13px 14px', borderRadius:12,
  fontSize:14, background:'#F8FAFC', border:'1.5px solid #E2E8F0',
  color:'#1E293B', outline:'none',
  fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', boxSizing:'border-box',
}

const toggleRow = {
  textAlign:'center', marginTop:16, fontSize:13, color:'#64748B',
}

const link = {
  background:'none', border:'none', cursor:'pointer',
  color:'#FF6B35', fontWeight:700, fontSize:13,
  fontFamily:'Inter,sans-serif', padding:0,
}

function btnS(bg) {
  return {
    display:'block', width:'100%', background:bg, color:'white', border:'none',
    borderRadius:16, padding:'15px', fontWeight:800, cursor:'pointer',
    fontSize:15, fontFamily:'Inter,sans-serif',
    transition:'opacity 0.2s', marginTop:4, marginBottom:4,
    boxShadow:'0 4px 18px rgba(255,107,53,0.35)',
  }
}

const css = `
  @keyframes float        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes fadeUp       { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes marqueeLeft  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes marqueeRight { from{transform:translateX(-50%)} to{transform:translateX(0)} }
  .animate-fade-up        { animation: fadeUp 0.5s ease both; }
  @media (prefers-reduced-motion: reduce) {
    [style*="marqueeLeft"], [style*="marqueeRight"] { animation-play-state: paused !important; }
  }
`
