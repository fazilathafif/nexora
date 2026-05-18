import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function UpdatePasswordPage() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

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

      <div style={s.logo} className="animate-fade-up">
        <div style={s.star}>✦</div>
        <h1 style={s.title}>Nexora</h1>
        <p style={s.sub}>UK EXAM PREP · SET NEW PASSWORD</p>
      </div>

      <div style={s.card} className="animate-fade-up">
        {done ? (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontWeight:800,color:'#F8FAFC',fontSize:16,marginBottom:8}}>Password updated!</div>
            <div style={{fontSize:13,color:'#94A3B8',lineHeight:1.6,marginBottom:18}}>
              Your password has been changed. You can now sign in with your new password.
            </div>
            <a href="/" style={{display:'block',...s.btn,textDecoration:'none',textAlign:'center',boxSizing:'border-box'}}>
              Go to Sign In
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:6,fontWeight:800,color:'#F8FAFC',fontSize:15}}>Choose a new password</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:18,lineHeight:1.6}}>
              Enter and confirm your new password below.
            </div>
            <div style={s.field}>
              <label style={s.label}>NEW PASSWORD</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6+ characters" style={s.input}
                onFocus={e => e.target.style.borderColor='#0D9488'}
                onBlur={e  => e.target.style.borderColor='#1E293B'}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>CONFIRM PASSWORD</label>
              <input
                type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" style={s.input}
                onFocus={e => e.target.style.borderColor='#0D9488'}
                onBlur={e  => e.target.style.borderColor='#1E293B'}
              />
            </div>
            {error && <div style={s.errBox}>{error}</div>}
            <button type="submit" disabled={loading} style={{...s.btn, opacity: loading ? 0.6 : 1}}>
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const s = {
  root:   { minHeight:'100vh', background:'#0A0A14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:'Georgia, serif', position:'relative', overflow:'hidden' },
  mapWrap:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' },
  mapSvg: { width:'100%', height:'100%', opacity:0.12, transform:'scaleY(2)', transformOrigin:'center' },
  logo:   { textAlign:'center', marginBottom:28 },
  star:   { fontSize:40, color:'#F8FAFC', marginBottom:6, animation:'float 3s ease-in-out infinite', display:'block' },
  title:  { fontSize:32, fontWeight:900, color:'#F8FAFC', letterSpacing:'-1px', margin:0 },
  sub:    { fontSize:11, color:'#64748B', marginTop:6, letterSpacing:'0.1em' },
  card:   { background:'#0F172A', border:'1.5px solid #1E293B', borderRadius:24, padding:'28px 24px', width:'100%', maxWidth:360, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' },
  field:  { marginBottom:16 },
  label:  { display:'block', fontSize:10, fontWeight:700, color:'#64748B', letterSpacing:'0.08em' },
  input:  { width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14, background:'#1E293B', border:'1.5px solid #1E293B', color:'#F8FAFC', outline:'none', fontFamily:'Georgia,serif', transition:'border-color 0.2s', boxSizing:'border-box' },
  errBox: { background:'#EF444420', border:'1px solid #EF4444', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#F87171', marginBottom:14 },
  btn:    { width:'100%', background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'white', border:'none', borderRadius:12, padding:'13px', fontWeight:800, cursor:'pointer', fontSize:15, fontFamily:'Georgia,serif', transition:'opacity 0.2s' },
}

const css = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .animate-fade-up { animation: fadeUp 0.5s ease both; }
`
