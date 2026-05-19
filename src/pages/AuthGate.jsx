import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthGate() {
  const [mode,       setMode]       = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error,      setError]      = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)
  const [resetSent,  setResetSent]  = useState(false)

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
    setLoading(true)
    setError(null)

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
        setError('An account with this email already exists. Please sign in below.')
        return
      }
      if (err) {
        const msg = err.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email address is already')) {
          switchMode('signin')
          setError('An account with this email already exists. Please sign in below.')
        } else {
          setError(err.message)
        }
        return
      }
      setDone(true)
      return
    }

    // sign in — set the remember-me flag BEFORE the API call so it's present
    // even if the onAuthStateChange fires and unmounts this component first
    if (rememberMe) localStorage.setItem('nexora_remember_me', '1')
    else            localStorage.removeItem('nexora_remember_me')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      // Sign-in failed — remove the flag we just set
      localStorage.removeItem('nexora_remember_me')
      const msg = err.message.toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first — check your inbox for the confirmation link.')
      } else {
        setError(err.message)
      }
    } else {
      sessionStorage.setItem('nexora_session_active', '1')
    }
    // on success onAuthStateChange in useAuth fires automatically
  }

  const subLabel = mode === 'signup' ? 'CREATE ACCOUNT'
    : mode === 'forgot' ? 'RESET PASSWORD'
    : 'SIGN IN TO CONTINUE'

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* UK flag watermark */}
      <div style={s.mapWrap} aria-hidden="true">
        <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" style={s.mapSvg} xmlns="http://www.w3.org/2000/svg">
          <rect width="600" height="300" fill="#012169"/>
          <line x1="0" y1="0" x2="600" y2="300" stroke="white" strokeWidth="100"/>
          <line x1="600" y1="0" x2="0" y2="300" stroke="white" strokeWidth="100"/>
          <polygon points="600,0 600,50 300,150 350,150" fill="#C8102E"/>
          <polygon points="0,300 0,250 300,150 250,150" fill="#C8102E"/>
          <polygon points="0,0 50,0 300,150 250,150" fill="#C8102E"/>
          <polygon points="600,300 550,300 300,150 350,150" fill="#C8102E"/>
          <rect x="0" y="110" width="600" height="80" fill="white"/>
          <rect x="260" y="0" width="80" height="300" fill="white"/>
          <rect x="0" y="125" width="600" height="50" fill="#C8102E"/>
          <rect x="275" y="0" width="50" height="300" fill="#C8102E"/>
        </svg>
      </div>

      {/* Logo */}
      <div style={s.logo} className="animate-fade-up">
        <div style={s.star}>✦</div>
        <h1 style={s.title}>Nexora</h1>
        <p style={s.sub}>Your Personal AI Coach · UK Entrance Exams</p>
      </div>

      {/* Card */}
      <div style={s.card} className="animate-fade-up">

        {/* Sign-up confirmation */}
        {done ? (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:40,marginBottom:12}}>📬</div>
            <div style={{fontWeight:800,color:'#F8FAFC',fontSize:16,marginBottom:8}}>Check your inbox</div>
            <div style={{fontSize:13,color:'#94A3B8',lineHeight:1.6}}>
              Confirmation link sent to <strong style={{color:'#0D9488'}}>{email}</strong>.<br/>
              Click it then come back to sign in.
            </div>
            <button onClick={() => switchMode('signin')} style={{marginTop:18,...s.btn}}>
              Back to Sign In
            </button>
          </div>

        /* Password reset sent */
        ) : resetSent ? (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:40,marginBottom:12}}>🔑</div>
            <div style={{fontWeight:800,color:'#F8FAFC',fontSize:16,marginBottom:8}}>Reset link sent</div>
            <div style={{fontSize:13,color:'#94A3B8',lineHeight:1.6}}>
              Check your inbox at <strong style={{color:'#0D9488'}}>{email}</strong>.<br/>
              Click the link to set a new password.
            </div>
            <button onClick={() => switchMode('signin')} style={{marginTop:18,...s.btn}}>
              Back to Sign In
            </button>
          </div>

        /* Forgot password form */
        ) : mode === 'forgot' ? (
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:6,fontWeight:800,color:'#F8FAFC',fontSize:15}}>Forgot your password?</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:18,lineHeight:1.6}}>
              Enter your email and we'll send you a reset link.
            </div>
            <div style={s.field}>
              <label style={s.label}>EMAIL</label>
              <input
                type="email" required name="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={s.input}
                onFocus={e => e.target.style.borderColor='#0D9488'}
                onBlur={e  => e.target.style.borderColor='#1E293B'}
              />
            </div>
            {error && <div style={s.errBox}>{error}</div>}
            <button type="submit" disabled={loading} style={{...s.btn, opacity: loading ? 0.6 : 1}}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <div style={s.toggle}>
              <button type="button" onClick={() => switchMode('signin')} style={s.link}>
                ← Back to Sign In
              </button>
            </div>
          </form>

        /* Sign in / Sign up form */
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={signInWithGoogle}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,background:'#fff',border:'1.5px solid #E2E8F0',borderRadius:12,padding:'11px',fontWeight:700,fontSize:14,color:'#1E293B',cursor:'pointer',fontFamily:'Inter,sans-serif',marginBottom:16,transition:'box-shadow 0.2s'}}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 0 3px rgba(66,133,244,0.2)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{flex:1,height:1,background:'#1E293B'}} />
              <span style={{fontSize:11,color:'#475569',fontWeight:600}}>or</span>
              <div style={{flex:1,height:1,background:'#1E293B'}} />
            </div>
            <div style={s.field}>
              <label style={s.label}>EMAIL</label>
              <input
                type="email" required name="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={s.input}
                onFocus={e => e.target.style.borderColor='#0D9488'}
                onBlur={e  => e.target.style.borderColor='#1E293B'}
              />
            </div>
            <div style={s.field}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <label style={{...s.label,marginBottom:0}}>PASSWORD</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => switchMode('forgot')} style={{...s.link,fontSize:11}}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password" required minLength={6}
                name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6+ characters" style={s.input}
                onFocus={e => e.target.style.borderColor='#0D9488'}
                onBlur={e  => e.target.style.borderColor='#1E293B'}
              />
            </div>
            {mode === 'signin' && (
              <label style={s.rememberRow}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={s.rememberCheck}
                />
                <span style={s.rememberLabel}>Remember me</span>
              </label>
            )}
            {error && <div style={s.errBox}>{error}</div>}
            <button type="submit" disabled={loading} style={{...s.btn, opacity: loading ? 0.6 : 1}}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In →'}
            </button>
            <div style={s.toggle}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={s.link}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={s.tracks}>
        <div style={{...s.trackGroup, border:'1px solid #0D948840'}}>
          <div style={{...s.trackLabel, color:'#0D9488'}}>GCSE TRACK</div>
          <div style={s.trackItems}>
            {[['📐','Maths'],['📚','English'],['🔬','Science'],['🧩','Verbal']].map(([e,n]) => (
              <span key={n} style={{...s.trackChip, background:'#0D948818', border:'1px solid #0D948840', color:'#2DD4BF'}}>{e} {n}</span>
            ))}
          </div>
        </div>
        <div style={s.divider} />
        <div style={{...s.trackGroup, border:'1px solid #7C3AED40'}}>
          <div style={{...s.trackLabel, color:'#A78BFA'}}>A-LEVEL TRACK</div>
          <div style={s.trackItems}>
            {[['🏥','UCAT'],['⚖️','LNAT'],['∑','TMUA'],['⚗️','ESAT'],['🧠','TSA'],['📏','STEP']].map(([e,n]) => (
              <span key={n} style={{...s.trackChip, background:'#7C3AED18', border:'1px solid #7C3AED40', color:'#C4B5FD'}}>{e} {n}</span>
            ))}
          </div>
        </div>
      </div>
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

const s = {
  root:   { minHeight:'100vh', background:'#0A0A14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden' },
  mapWrap:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' },
  mapSvg: { width:'100%', height:'100%', opacity:0.12, transform:'scaleY(2)', transformOrigin:'center', filter:'grayscale(1)' },
  logo:   { textAlign:'center', marginBottom:28 },
  star:   { fontSize:40, color:'#F8FAFC', marginBottom:6, animation:'float 3s ease-in-out infinite', display:'block' },
  title:  { fontSize:36, fontWeight:900, color:'#F8FAFC', letterSpacing:'-1px', margin:0, fontFamily:"'Playfair Display', Georgia, serif" },
  sub:    { fontSize:12, color:'#94A3B8', marginTop:6, letterSpacing:'0.03em' },
  card:   { background:'#0F172A', border:'1.5px solid #1E293B', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:360, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' },
  field:  { marginBottom:16 },
  label:  { display:'block', fontSize:10, fontWeight:700, color:'#64748B', letterSpacing:'0.08em' },
  input:  { width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14, background:'#1E293B', border:'1.5px solid #1E293B', color:'#F8FAFC', outline:'none', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', boxSizing:'border-box' },
  errBox: { background:'#EF444420', border:'1px solid #EF4444', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#F87171', marginBottom:14 },
  btn:    { width:'100%', background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'white', border:'none', borderRadius:12, padding:'13px', fontWeight:800, cursor:'pointer', fontSize:15, fontFamily:'Inter,sans-serif', transition:'opacity 0.2s' },
  toggle: { textAlign:'center', marginTop:14, fontSize:12, color:'#64748B' },
  link:   { background:'none', border:'none', cursor:'pointer', color:'#0D9488', fontWeight:700, fontSize:12, fontFamily:'Inter,sans-serif' },
  rememberRow:   { display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer' },
  rememberCheck: { width:15, height:15, accentColor:'#0D9488', cursor:'pointer' },
  rememberLabel: { fontSize:13, color:'#94A3B8', userSelect:'none' },
  tracks:     { marginTop:24, width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:10 },
  trackGroup: { background:'#0F172A', border:'1px solid #1E293B', borderRadius:14, padding:'12px 16px' },
  trackLabel: { fontSize:9, fontWeight:800, color:'#334155', letterSpacing:'0.12em', marginBottom:8 },
  trackItems: { display:'flex', flexWrap:'wrap', gap:6 },
  trackChip:  { background:'#1E293B', border:'1px solid #334155', borderRadius:20, padding:'4px 11px', fontSize:12, color:'#94A3B8', fontWeight:600 },
  divider:    { display:'none' },
}

const css = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .animate-fade-up { animation: fadeUp 0.5s ease both; }
`
