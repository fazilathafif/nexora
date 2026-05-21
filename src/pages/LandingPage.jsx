import { useNavigate } from 'react-router-dom'
import { upsertProfile } from '../lib/db.js'
import { STREAM_CONFIG } from '../data/questions.js'

// Bokeh — same warm palette as AuthGate for brand continuity
const BOKEH = [
  { w:320, h:320, top:'-10%', left:'-16%', r:'255,200,80',  o:0.50, blur:95  },
  { w:220, h:220, top:'5%',   right:'-7%', r:'255,80,200',  o:0.40, blur:65  },
  { w:170, h:170, top:'30%',  left:'10%',  r:'255,255,140', o:0.26, blur:48  },
  { w:260, h:260, top:'15%',  right:'-5%', r:'200,60,255',  o:0.30, blur:78  },
  { w:110, h:110, top:'55%',  left:'3%',   r:'255,180,80',  o:0.32, blur:38  },
  { w:190, h:190, top:'40%',  left:'46%',  r:'255,100,180', o:0.26, blur:62  },
]

export default function LandingPage({ user, profile, refreshProfile }) {
  const navigate = useNavigate()

  async function chooseStream(stream) {
    navigate(`/${stream}`)
    if (user) {
      upsertProfile(user.id, { stream })
        .then(() => refreshProfile?.())
        .catch(() => {})
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'linear-gradient(160deg,#FF6B35 0%,#FF3CAC 52%,#7B2FBE 100%)',
      overflow:'hidden', fontFamily:'Inter,sans-serif',
      display:'flex', flexDirection:'column',
    }}>
      <style>{css}</style>

      {/* Bokeh */}
      {BOKEH.map((b, i) => (
        <div key={i} style={{
          position:'absolute', width:b.w, height:b.h, borderRadius:'50%',
          background:`rgba(${b.r},${b.o})`, filter:`blur(${b.blur}px)`,
          top:b.top, left:b.left, right:b.right, pointerEvents:'none',
        }} />
      ))}

      {/* Back button */}
      {profile?.stream && (
        <button
          onClick={() => navigate(`/${profile.stream}`)}
          style={{
            position:'absolute', top:20, left:20, zIndex:10,
            background:'rgba(255,255,255,0.2)', backdropFilter:'blur(6px)',
            border:'1px solid rgba(255,255,255,0.35)', borderRadius:12,
            padding:'7px 16px', fontSize:12, fontWeight:700,
            color:'white', cursor:'pointer', fontFamily:'Inter,sans-serif',
          }}
        >
          ← Back
        </button>
      )}

      {/* Logo hero */}
      <div className="animate-fade-up" style={{ textAlign:'center', paddingTop:'14vh', paddingBottom:28, zIndex:1 }}>
        <span style={{ fontSize:36, display:'block', marginBottom:6, animation:'float 3s ease-in-out infinite', color:'white', textShadow:'0 2px 16px rgba(0,0,0,0.2)' }}>✦</span>
        <h1 style={{
          fontSize:52, fontWeight:900, color:'white', letterSpacing:'-2px', margin:'0 0 10px',
          fontFamily:"'Playfair Display', Georgia, serif",
          textShadow:'0 4px 28px rgba(0,0,0,0.22)',
        }}>Nexora</h1>
        <p style={{ color:'rgba(255,255,255,0.82)', fontSize:12, fontWeight:700, margin:0, letterSpacing:'0.16em' }}>
          UK EXAM PREP · CHOOSE YOUR TRACK
        </p>
      </div>

      {/* Stream cards */}
      <div className="animate-fade-up" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 20px', zIndex:1 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>

          {/* GCSE */}
          <button
            onClick={() => chooseStream('gcse')}
            style={cardStyle}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.18)' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#0D9488,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🧱</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#1E293B', letterSpacing:'-0.3px' }}>GCSE Track</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{STREAM_CONFIG.gcse.years} · {STREAM_CONFIG.gcse.subjects.length} subjects</div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:20, color:'#0D9488' }}>→</div>
            </div>
            <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
              {STREAM_CONFIG.gcse.subjects.map(s => (
                <span key={s.id} style={{ background:'#0D948812', border:'1px solid #0D948830', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#0D9488' }}>{s.emoji} {s.label}</span>
              ))}
            </div>
          </button>

          {/* A-Level */}
          <button
            onClick={() => chooseStream('alevel')}
            style={{ ...cardStyle, background:'#1A0E35', border:'none' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.50)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.40)' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#7C3AED,#C026D3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🎯</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#F0F4FF', letterSpacing:'-0.3px' }}>A-Level Track</div>
                <div style={{ fontSize:12, color:'#A78BFA', marginTop:2 }}>{STREAM_CONFIG.alevel.years} · University Entrance Exams</div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:20, color:'#A78BFA' }}>→</div>
            </div>
            <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
              {STREAM_CONFIG.alevel.subjects.filter(s => !s.deprecated).map(s => (
                <span key={s.id} style={{ background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#C4B5FD' }}>{s.emoji} {s.label}</span>
              ))}
            </div>
          </button>

          {/* Trust pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
            {['Free Forever','AI Explanations','Spaced Repetition','GDPR Safe'].map(p => (
              <span key={p} style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.28)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const cardStyle = {
  width:'100%', background:'white', borderRadius:24, padding:'18px 20px',
  border:'none', cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
  boxShadow:'0 12px 40px rgba(0,0,0,0.18)',
  transition:'transform 0.2s ease, box-shadow 0.2s ease',
}

const css = `
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .animate-fade-up   { animation: fadeUp 0.5s ease both; }
`
