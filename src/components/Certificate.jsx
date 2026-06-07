import { forwardRef } from 'react'
import { TRACK_COLORS } from '../styles/courseraTokens.js'

const STREAM_LABELS = {
  gcse:'GCSE', alevel:'A-Level', sat:'SAT', act:'ACT',
  ap:'AP', psat:'PSAT', igcse:'IGCSE', ib:'IB Diploma',
}

// Off-screen render target — capture with html2canvas, export with jsPDF
const Certificate = forwardRef(function Certificate({ cert, profile }, ref) {
  const accent = TRACK_COLORS[cert.stream] ?? '#0056D2'
  const name   = profile?.display_name || profile?.email?.split('@')[0] || 'Scholar'
  const date   = cert.earnedAt
    ? new Date(cert.earnedAt).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  return (
    <div
      ref={ref}
      style={{
        width: 794, height: 562,
        background: 'white',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 8, background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />

      {/* Corner watermark circles */}
      <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:`${accent}08`, border:`2px solid ${accent}15` }} />
      <div style={{ position:'absolute', bottom:-80, left:-80, width:280, height:280, borderRadius:'50%', background:`${accent}06`, border:`2px solid ${accent}10` }} />

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 64px', position:'relative', zIndex:1 }}>

        {/* Logo — single clean horizontal lockup */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          <span style={{ fontSize:15, fontWeight:900, color:accent, letterSpacing:'0.14em', textTransform:'uppercase' }}>Nexora</span>
          <span style={{ width:1, height:14, background:`${accent}50`, display:'inline-block' }} />
          <span style={{ fontSize:11, fontWeight:600, color:`${accent}90`, letterSpacing:'0.2em', textTransform:'uppercase' }}>Learn</span>
        </div>

        {/* Certificate heading */}
        <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:10 }}>
          Certificate of Achievement
        </div>

        {/* Divider */}
        <div style={{ width:60, height:2, background:`linear-gradient(90deg, transparent, ${accent}, transparent)`, marginBottom:20 }} />

        {/* "This certifies that" */}
        <div style={{ fontSize:13, color:'#64748B', marginBottom:10, fontStyle:'italic' }}>
          This certifies that
        </div>

        {/* Name */}
        <div style={{ fontSize:32, fontWeight:900, color:'#1E293B', letterSpacing:'-0.8px', marginBottom:16, textAlign:'center' }}>
          {name}
        </div>

        {/* Achievement */}
        <div style={{ fontSize:14, color:'#64748B', marginBottom:8, textAlign:'center' }}>
          has demonstrated outstanding achievement in
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:accent, letterSpacing:'-0.4px', marginBottom:6, textAlign:'center' }}>
          {cert.title}
        </div>
        {cert.subtitle && (
          <div style={{ fontSize:13, color:'#64748B', marginBottom:0, textAlign:'center' }}>
            {cert.subtitle}
          </div>
        )}

        {/* Divider */}
        <div style={{ width:40, height:1, background:`${accent}40`, margin:'20px 0' }} />

        {/* Meta row */}
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
          {cert.stream && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>Track</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{STREAM_LABELS[cert.stream] ?? cert.stream.toUpperCase()}</div>
            </div>
          )}
          {cert.score != null && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>Score</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{cert.score}%</div>
            </div>
          )}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>Date Awarded</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{date}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>Certificate ID</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{cert.certId}</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height:36, background:`${accent}08`, borderTop:`1px solid ${accent}18`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px' }}>
        <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>nexoralearn.app · Verify at nexoralearn.app/cert/{cert.certId}</div>
        <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>© {new Date().getFullYear()} Nexora</div>
      </div>
    </div>
  )
})

export default Certificate
