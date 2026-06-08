import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { COURSERA_BLUE } from '../styles/courseraTokens.js'
import { useBreakpoint } from '../hooks/useBreakpoint.js'

const GCSE_CHIPS = ['📐 Maths', '📚 English', '🔬 Science', '🏛️ History', '🌍 Geography', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '💻 CS', '☯️ RS', '💼 Business']
const US_CHIPS   = ['🇺🇸 SAT Math', '📝 SAT R&W', '🧮 ACT', '🏆 AP Calc', '🏆 AP Bio', '⚗️ AP Chem', '✏️ PSAT', '🏥 UCAT', '⚖️ LNAT', '∑ TMUA', '⚛️ PAT', '🧠 TARA']

const TRACK_GROUPS = [
  { region: '🇬🇧 United Kingdom', label: 'GCSE',              chips: ['📐 Maths', '📚 English', '🔬 Science', '🏛️ History', '🌍 Geography', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '💻 CS', '☯️ RS', '💼 Business'] },
  { region: '🇬🇧 United Kingdom', label: 'A-Level Entrance',  chips: ['🏥 UCAT', '⚖️ LNAT', '∑ TMUA', '⚗️ ESAT', '🧠 TARA', '📐 MAT', '⚛️ PAT', '📊 STEP'] },
  { region: '🌍 International',   label: 'IGCSE',             chips: ['📐 Maths', '📚 English Lang', '✍️ English Lit', '🧬 Biology', '⚗️ Chemistry', '⚛️ Physics', '🔬 Combined Sci', '🏛️ History', '🌍 Geography', '💹 Economics', '💻 CS', '💼 Business', '🇪🇸 Spanish', '🇫🇷 French'] },
  { region: '🌍 International',   label: 'IB Diploma',        chips: ['∑ Maths AA', '📊 Maths AI', '🧬 Biology', '⚗️ Chemistry', '⚛️ Physics', '📚 English A', '🇫🇷 French B', '🇪🇸 Spanish B', '🏛️ History', '💹 Economics', '🌍 Geography', '🧠 Psychology', '💼 Business', '🤔 ToK', '💻 CS', '🌱 ESS', '🎨 Visual Arts'] },
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
            background:'rgba(255,255,255,0.15)',
            border:'1px solid rgba(255,255,255,0.3)',
            backdropFilter:'blur(8px)',
            borderRadius:20,
            padding:'5px 11px', fontSize:11, fontWeight:700, color:'white', flexShrink:0,
          }}>{chip}</span>
        ))}
      </div>
    </div>
  )
}

const WHY_POINTS = [
  { icon:'🕹️', text:'5 Dynamic Study Modes – Quizzes, Flashcards, Mock Exams, Active Recall, Match Games.' },
  { icon:'🧠', text:'Instant AI Tutoring – Step-by-step explanation after every question.' },
  { icon:'📈', text:'Scientific Spaced Repetition – Smart scheduling cuts study time in half.' },
  { icon:'🎓', text:'Global Coverage – GCSE, A-Level, IGCSE, IB, SAT, ACT, AP & beyond.' },
  { icon:'📅', text:'Countdown to Success – Personalised study plan tied to your exam date.' },
  { icon:'🎁', text:'Student-Friendly Freemium Plans – Start free, upgrade only when you need more.' },
]

function WhyNexoraPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ maxWidth:340, margin:'0 auto', textAlign:'left' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.3)',
          borderRadius: open ? '12px 12px 0 0' : 12,
          padding:'10px 16px', cursor:'pointer',
          fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:15 }}>✨</span>
          <span style={{ fontSize:13, fontWeight:700, color:'white' }}>Why Nexora?</span>
        </div>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{
          background:'rgba(15,23,42,0.82)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.15)', borderTop:'none',
          borderRadius:'0 0 12px 12px', padding:'14px 16px',
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {WHY_POINTS.map((p, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{p.icon}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.80)', lineHeight:1.5, fontWeight:500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [refCopied,      setRefCopied]      = useState(false)

  function handleReferral() {
    const url = 'https://nexoralearn.app?ref=invite'
    navigator.clipboard.writeText(url).then(() => {
      setRefCopied(true); setTimeout(() => setRefCopied(false), 2500)
    })
  }
  const [expandedGroups, setExpandedGroups] = useState({})
  const [screenIndex,    setScreenIndex]    = useState(
    () => localStorage.getItem('nexora_onboarded') ? 2 : 0
  )
  const [dragOffset, setDragOffset] = useState(0)
  const dragRef = useRef({ startX:0, dx:0, active:false })
  const navigate = useNavigate()
  const { isDesktop } = useBreakpoint()

  async function signInWithGoogle() {
    const redirectTo = import.meta.env.VITE_APP_URL ?? window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
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
                  style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:8, padding:'13px', fontWeight:700, fontSize:14, color:'white', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
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

        {/* Follow us */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em' }}>FOLLOW US</span>
          <a href="https://www.facebook.com/profile.php?id=61590581013106" target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', textDecoration:'none' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/nexoralearn" target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', textDecoration:'none' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>

        {/* Refer a friend */}
        <button
          onClick={handleReferral}
          style={{
            marginTop:12, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
            borderRadius:10, padding:'10px 16px', cursor:'pointer',
            fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
            transition:'background 0.2s',
          }}
        >
          {refCopied
            ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="white" strokeWidth={2}/><line x1="19" y1="8" x2="19" y2="14" stroke="white" strokeWidth={2} strokeLinecap="round"/><line x1="22" y1="11" x2="16" y2="11" stroke="white" strokeWidth={2} strokeLinecap="round"/></svg>
          }
          <span style={{ fontSize:12, fontWeight:700, color:'white' }}>
            {refCopied ? 'Invite link copied!' : 'Refer a friend — share Nexora'}
          </span>
        </button>

      </>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', fontFamily:'Inter,sans-serif' }}>
      <style>{css}</style>

      {/* ── Full-bleed campus gate background ── */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'url(/campus-gate.jpg)',
        backgroundSize:'cover',
        backgroundPosition:'center top',
        backgroundRepeat:'no-repeat',
      }} />

      {/* Dark overlay — stronger at bottom for text readability */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.9) 100%)',
      }} />

      {/* ── Content ── */}
      <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Logo area — sits over the arch */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'flex-end',
          paddingBottom:28, paddingTop:`max(28px, env(safe-area-inset-top, 28px))`,
          textAlign:'center', padding:'max(40px, env(safe-area-inset-top, 40px)) 24px 32px',
        }}>
          <div className="animate-fade-up">
            <div style={{ fontSize:42, fontWeight:900, color:'white', letterSpacing:'-2px', marginBottom:8, fontFamily:"'Playfair Display', Georgia, serif", textShadow:'0 2px 20px rgba(0,0,0,0.5)' }}>
              Nexora
            </div>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12, fontWeight:600, margin:'0 0 20px', letterSpacing:'0.12em', textTransform:'uppercase', textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
              Your path to the world's top universities
            </p>
            {/* Why Nexora — expandable */}
            <WhyNexoraPanel />
          </div>
        </div>

        {/* ── Sign-in sheet — frosted glass bottom panel ── */}
        {isDesktop ? (
          /* Desktop: centred card over image */
          <div style={{
            position:'absolute', top:'50%', right:48,
            transform:'translateY(-50%)',
            width:400, background:'rgba(255,255,255,0.18)',
            backdropFilter:'blur(28px) saturate(180%)',
            WebkitBackdropFilter:'blur(28px) saturate(180%)',
            borderRadius:24, padding:'32px 28px',
            boxShadow:'0 24px 80px rgba(0,0,0,0.4)',
            border:'1px solid rgba(255,255,255,0.4)',
            maxHeight:'90vh', overflowY:'auto',
          }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:28, fontWeight:900, color: COURSERA_BLUE, letterSpacing:'-1px', marginBottom:4 }}>
                Nexora
                <span style={{ marginLeft:8, background:`${COURSERA_BLUE}15`, border:`1px solid ${COURSERA_BLUE}30`, color: COURSERA_BLUE, fontSize:9, fontWeight:800, letterSpacing:'0.08em', padding:'2px 7px', borderRadius:6, verticalAlign:'middle' }}>BETA</span>
              </div>
              <p style={{ color:'#6B7280', fontSize:11, fontWeight:700, margin:0, letterSpacing:'0.14em', textTransform:'uppercase' }}>
                Ace your entrance exams
              </p>
            </div>
            {sheetBody()}
          </div>
        ) : (
          /* Mobile: bottom sheet rising over image */
          <div style={{
            background:'rgba(255,255,255,0.18)',
            backdropFilter:'blur(28px) saturate(180%)',
            WebkitBackdropFilter:'blur(28px) saturate(180%)',
            borderRadius:'24px 24px 0 0',
            padding:`24px 24px calc(40px + env(safe-area-inset-bottom, 0px))`,
            boxShadow:'0 -8px 40px rgba(0,0,0,0.35)',
            border:'1px solid rgba(255,255,255,0.25)',
            borderBottom:'none',
            maxHeight:'72dvh', overflowY:'auto',
          }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.4)', margin:'0 auto 20px' }} />
            {sheetBody()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoogleBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(255,255,255,0.92)', border:'none', borderRadius:8, padding:'13px', fontWeight:700, fontSize:14, color:'#1F1F1F', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 2px 12px rgba(0,0,0,0.2)', marginBottom:12, transition:'opacity 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <GoogleIcon /> Continue with Google
    </button>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.25)' }} />
      <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.08em' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.25)' }} />
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
    <div style={{ background:'rgba(192,21,47,0.25)', border:'1px solid rgba(192,21,47,0.5)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#FFB3B3', marginBottom:14 }}>
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

const heading   = { fontWeight:800, fontSize:22, color:'white', marginBottom:20, letterSpacing:'-0.4px' }
const labelS    = { display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:'0.1em', marginBottom:5 }
const inputS    = { width:'100%', padding:'12px 13px', borderRadius:8, fontSize:14, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.3)', color:'white', outline:'none', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', boxSizing:'border-box' }
const toggleRow = { textAlign:'center', marginTop:16, fontSize:13, color:'rgba(255,255,255,0.7)' }
const link      = { background:'none', border:'none', cursor:'pointer', color:'white', fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif', padding:0, textDecoration:'underline' }

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
