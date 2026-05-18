/**
 * LandingPage — stream selector shown on first visit.
 * Saves chosen stream to profile so user goes straight to home next time.
 */

import { useNavigate } from 'react-router-dom'
import { upsertProfile } from '../lib/db.js'

export default function LandingPage({ user, profile, refreshProfile }) {
  const navigate = useNavigate()

  async function chooseStream(stream) {
    if (user) {
      await upsertProfile(user.id, { stream })
      await refreshProfile()
    }
    navigate(`/${stream}`)
  }

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* UK flag watermark */}
      <div style={styles.mapWrap} aria-hidden="true">
        <svg
          viewBox="0 0 600 300"
          preserveAspectRatio="xMidYMid meet"
          style={styles.mapSvg}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blue field */}
          <rect width="600" height="300" fill="#012169"/>

          {/* St Andrew — white saltire */}
          <line x1="0" y1="0" x2="600" y2="300" stroke="white" strokeWidth="100"/>
          <line x1="600" y1="0" x2="0" y2="300" stroke="white" strokeWidth="100"/>

          {/* St Patrick — red saltire, countercharged (offset by quadrant) */}
          {/* Top-right & bottom-left quadrant: red above diagonal */}
          <polygon points="600,0 600,50 300,150 350,150" fill="#C8102E"/>
          <polygon points="0,300 0,250 300,150 250,150" fill="#C8102E"/>
          {/* Top-left & bottom-right quadrant: red below diagonal */}
          <polygon points="0,0 50,0 300,150 250,150" fill="#C8102E"/>
          <polygon points="600,300 550,300 300,150 350,150" fill="#C8102E"/>

          {/* St George — white cross */}
          <rect x="0" y="110" width="600" height="80" fill="white"/>
          <rect x="260" y="0" width="80" height="300" fill="white"/>

          {/* St George — red cross */}
          <rect x="0" y="125" width="600" height="50" fill="#C8102E"/>
          <rect x="275" y="0" width="50" height="300" fill="#C8102E"/>
        </svg>
      </div>

      <div style={styles.logo} className="animate-fade-up">
        <div style={styles.star}>✦</div>
        <h1 style={styles.title}>Nexora</h1>
        <p style={styles.sub}>UK EXAM PREP · CHOOSE YOUR TRACK</p>
      </div>

      <div style={styles.grid} className="animate-fade-up">
        {/* GCSE */}
        <button style={{...styles.card, ...styles.gcseCard}} onClick={() => chooseStream('gcse')}>
          <span style={styles.cardEmoji}>🧱</span>
          <span style={styles.cardTitle}>GCSE Track</span>
          <span style={styles.cardYears}>Years 8–10</span>
          <span style={styles.cardDesc}>Maths · English · Science · Verbal Reasoning</span>
          <span style={{...styles.cardBtn, background:'#0D9488'}}>Get Started →</span>
        </button>

        {/* A-Level */}
        <button style={{...styles.card, ...styles.aCard}} onClick={() => chooseStream('alevel')}>
          <span style={styles.cardEmoji}>🎯</span>
          <span style={styles.cardTitle}>A-Level Track</span>
          <span style={{...styles.cardYears, color:'#A5B4FC'}}>Years 11–12</span>
          <span style={{...styles.cardDesc, color:'#818CF8'}}>UCAT · LNAT · TMUA · ESAT · TSA · STEP</span>
          <span style={{...styles.cardBtn, background:'#4F46E5'}}>Get Started →</span>
        </button>
      </div>

      <div style={styles.pills}>
        {['Free Forever','AI Explanations','UK Curriculum','GDPR Safe','Spaced Repetition'].map(p => (
          <span key={p} style={styles.pill}>{p}</span>
        ))}
      </div>
    </div>
  )
}

const styles = {
  root:      { minHeight:'100vh', background:'#0A0A14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:'Georgia, serif', position:'relative', overflow:'hidden' },
  mapWrap:   { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' },
  mapSvg:    { width:'100%', height:'100%', opacity:0.12, transform:'scaleY(2)', transformOrigin:'center' },
  logo:      { textAlign:'center', marginBottom:40 },
  star:      { fontSize:48, color:'#F8FAFC', marginBottom:8, animation:'float 3s ease-in-out infinite' },
  title:     { fontSize:32, fontWeight:900, color:'#F8FAFC', letterSpacing:'-1px', margin:0 },
  sub:       { fontSize:12, color:'#64748B', marginTop:6, letterSpacing:'0.1em' },
  grid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:400 },
  card:      { borderRadius:24, padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, border:'2px solid transparent', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s', textAlign:'center' },
  gcseCard:  { background:'linear-gradient(145deg,#0F766E,#134E4A)', borderColor:'#0D9488', boxShadow:'0 8px 32px #0F766E40' },
  aCard:     { background:'linear-gradient(145deg,#312E81,#1E1B4B)', borderColor:'#4F46E5', boxShadow:'0 8px 32px #4F46E540' },
  cardEmoji: { fontSize:34, marginBottom:4 },
  cardTitle: { fontSize:16, fontWeight:900, color:'#F8FAFC' },
  cardYears: { fontSize:12, color:'#99F6E4' },
  cardDesc:  { fontSize:11, color:'#5EEAD4', lineHeight:1.4 },
  cardBtn:   { marginTop:8, borderRadius:12, padding:'8px 20px', fontSize:13, fontWeight:700, color:'white', width:'100%', border:'none' },
  pills:     { display:'flex', gap:8, marginTop:32, flexWrap:'wrap', justifyContent:'center' },
  pill:      { background:'#1E293B', border:'1px solid #334155', borderRadius:20, padding:'4px 12px', fontSize:11, color:'#94A3B8', fontWeight:600 },
}

const css = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .animate-fade-up { animation: fadeUp 0.5s ease both; }
  button:hover { transform: translateY(-3px) !important; }
`
