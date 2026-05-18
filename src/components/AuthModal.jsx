import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

/**
 * Email sign-in / sign-up modal.
 * Pass `dark` for the A-Level colour scheme and `onClose` to dismiss.
 */
export default function AuthModal({ C, dark, onClose }) {
  const [mode,      setMode]      = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)   // signup confirmation sent
  const [resetSent, setResetSent] = useState(false)

  function switchMode(next) {
    setMode(next); setError(null); setDone(false); setResetSent(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) { setError('Authentication not available in demo mode.'); return }
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

    // sign in
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      const msg = err.message.toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first — check your inbox.')
      } else {
        setError(err.message)
      }
      return
    }
    onClose()
  }

  const inputStyle = {
    width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14,
    background: dark ? '#1A1A2E' : '#F8FAFC',
    border: `1.5px solid ${C.border}`,
    color: C.navy, outline:'none', fontFamily:'Georgia,serif',
  }
  const labelStyle = { fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.06em', display:'block', marginBottom:4 }
  const linkStyle  = { background:'none', border:'none', cursor:'pointer', color:C.primary, fontWeight:700, fontSize:11, fontFamily:'Georgia,serif' }

  return (
    <div
      onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{background:dark?'#1A1A2E':'#FFFFFF',borderRadius:24,padding:'28px 24px',width:'100%',maxWidth:360,border:`1.5px solid ${C.border}`,boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}
      >
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div style={{fontWeight:900,color:C.navy,fontSize:18}}>
              {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In'}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Save your progress across devices</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:20,lineHeight:1}}>×</button>
        </div>

        {/* Sign-up confirmation */}
        {done ? (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:36,marginBottom:12}}>📬</div>
            <div style={{fontWeight:800,color:C.navy,marginBottom:6}}>Check your inbox</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
              We sent a confirmation link to <strong style={{color:C.primary}}>{email}</strong>.
              Click it to activate your account.
            </div>
            <button onClick={onClose} style={{marginTop:18,background:C.primary,color:'white',border:'none',borderRadius:12,padding:'11px 28px',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'Georgia,serif'}}>
              Got it
            </button>
          </div>

        /* Password reset sent */
        ) : resetSent ? (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:36,marginBottom:12}}>🔑</div>
            <div style={{fontWeight:800,color:C.navy,marginBottom:6}}>Reset link sent</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
              Check your inbox at <strong style={{color:C.primary}}>{email}</strong>.<br/>
              Click the link to set a new password.
            </div>
            <button onClick={() => switchMode('signin')} style={{marginTop:18,background:C.primary,color:'white',border:'none',borderRadius:12,padding:'11px 28px',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'Georgia,serif'}}>
              Back to Sign In
            </button>
          </div>

        /* Forgot password form */
        ) : mode === 'forgot' ? (
          <form onSubmit={handleSubmit}>
            <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>
              Enter your email and we'll send you a reset link.
            </div>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor=C.primary}
                onBlur={e  => e.target.style.borderColor=C.border}
              />
            </div>
            {error && (
              <div style={{background:'#EF444420',border:'1px solid #EF4444',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#EF4444',marginBottom:14}}>
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              style={{width:'100%',background:loading?C.muted:C.primary,color:'white',border:'none',borderRadius:12,padding:'13px',fontWeight:800,cursor:loading?'default':'pointer',fontSize:15,fontFamily:'Georgia,serif',transition:'background 0.2s'}}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <div style={{textAlign:'center',marginTop:14,fontSize:12,color:C.muted}}>
              <button type="button" onClick={() => switchMode('signin')} style={linkStyle}>← Back to Sign In</button>
            </div>
          </form>

        /* Sign in / Sign up form */
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor=C.primary}
                onBlur={e  => e.target.style.borderColor=C.border}
              />
            </div>
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <label style={{...labelStyle,marginBottom:0}}>PASSWORD</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => switchMode('forgot')} style={linkStyle}>Forgot password?</button>
                )}
              </div>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6+ characters" style={inputStyle}
                onFocus={e => e.target.style.borderColor=C.primary}
                onBlur={e  => e.target.style.borderColor=C.border}
              />
            </div>

            {error && (
              <div style={{background:'#EF444420',border:'1px solid #EF4444',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#EF4444',marginBottom:14}}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{width:'100%',background:loading?C.muted:C.primary,color:'white',border:'none',borderRadius:12,padding:'13px',fontWeight:800,cursor:loading?'default':'pointer',fontSize:15,fontFamily:'Georgia,serif',transition:'background 0.2s'}}
            >
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <div style={{textAlign:'center',marginTop:14,fontSize:12,color:C.muted}}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                style={{background:'none',border:'none',cursor:'pointer',color:C.primary,fontWeight:700,fontSize:12,fontFamily:'Georgia,serif'}}
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
