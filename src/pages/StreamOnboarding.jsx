/**
 * StreamOnboarding — shown once after first login when profile.stream is null.
 * Replaces the LandingPage intermediate step by embedding track selection
 * directly in the post-auth flow. Unmounts automatically once a stream is saved.
 */

import { useState } from 'react'
import { upsertProfile } from '../lib/db.js'

const BOKEH = [
  { w:320, h:320, top:'-10%', left:'-16%', r:'255,200,80',  o:0.50, blur:95  },
  { w:220, h:220, top:'5%',   right:'-7%', r:'255,80,200',  o:0.40, blur:65  },
  { w:170, h:170, top:'30%',  left:'10%',  r:'255,255,140', o:0.26, blur:48  },
  { w:260, h:260, top:'15%',  right:'-5%', r:'200,60,255',  o:0.30, blur:78  },
  { w:110, h:110, top:'55%',  left:'3%',   r:'255,180,80',  o:0.32, blur:38  },
]

const STREAMS = [
  {
    id:       'gcse',
    icon:     '📚',
    title:    'GCSE',
    subjects: 'Maths · English · Science · more',
    gradient: 'linear-gradient(135deg,#0F766E,#0D9488)',
    bg:       '#F0FDF9',
    border:   '#99F6E4',
  },
  {
    id:       'alevel',
    icon:     '🎓',
    title:    'A-Level Entrance',
    subjects: 'UCAT · LNAT · TMUA · ESAT · TSA · STEP',
    gradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    bg:       '#FAF5FF',
    border:   '#C4B5FD',
  },
]

export default function StreamOnboarding({ user, refreshProfile }) {
  const [selecting, setSelecting] = useState(null)

  async function choose(stream) {
    if (selecting) return
    setSelecting(stream)
    await upsertProfile(user.id, { stream })
    await refreshProfile()
  }

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'linear-gradient(160deg,#FF6B35 0%,#FF3CAC 52%,#7B2FBE 100%)',
      fontFamily:'Inter,sans-serif', overflow:'hidden',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .so-hero { animation: fadeUp 0.5s 0.1s ease both; }
        .so-sheet { animation: fadeUp 0.45s 0.2s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      `}</style>

      {/* Bokeh */}
      {BOKEH.map((b, i) => (
        <div key={i} style={{
          position:'absolute', width:b.w, height:b.h, borderRadius:'50%',
          background:`rgba(${b.r},${b.o})`, filter:`blur(${b.blur}px)`,
          top:b.top, left:b.left, right:b.right, pointerEvents:'none',
        }} />
      ))}

      {/* Hero area */}
      <div className="so-hero" style={{
        position:'absolute', top:0, left:0, right:0, bottom:'55%',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-end',
        padding:'0 24px 28px',
        pointerEvents:'none',
      }}>
        <span style={{ fontSize:36, color:'white', display:'block', marginBottom:8, animation:'float 3s ease-in-out infinite' }}>✦</span>
        <h1 style={{
          fontSize:48, fontWeight:900, letterSpacing:'-2px', margin:'0 0 10px',
          fontFamily:"'Playfair Display', Georgia, serif",
          color:'white', textShadow:'0 4px 28px rgba(0,0,0,0.22)',
        }}>Nexora</h1>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:15, fontWeight:700, margin:0, letterSpacing:'0.04em' }}>
          Which track are you studying?
        </p>
      </div>

      {/* Bottom sheet */}
      <div className="so-sheet" style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'white', borderRadius:'28px 28px 0 0',
        padding:`28px 20px calc(44px + env(safe-area-inset-bottom, 0px))`,
        boxShadow:'0 -16px 56px rgba(0,0,0,0.22)',
      }}>
        {/* Drag pill */}
        <div style={{ width:36, height:4, borderRadius:2, background:'#CBD5E1', margin:'0 auto 24px' }} />

        <div style={{ fontWeight:900, fontSize:20, color:'#1E293B', marginBottom:6, letterSpacing:'-0.4px' }}>
          Choose your track
        </div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:22, lineHeight:1.6 }}>
          You can switch anytime from the app.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {STREAMS.map(s => {
            const isLoading = selecting === s.id
            const isDimmed  = selecting && selecting !== s.id
            return (
              <button
                key={s.id}
                onClick={() => choose(s.id)}
                disabled={!!selecting}
                style={{
                  background: s.bg,
                  border: `2px solid ${s.border}`,
                  borderRadius:18, padding:'18px 16px 18px 18px',
                  display:'flex', alignItems:'center', gap:14,
                  cursor: selecting ? 'wait' : 'pointer',
                  opacity: isDimmed ? 0.45 : 1,
                  transition:'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
                  boxShadow: isLoading ? `0 0 0 3px ${s.border}` : '0 4px 16px rgba(0,0,0,0.07)',
                  transform: isLoading ? 'scale(0.98)' : 'scale(1)',
                  textAlign:'left', width:'100%',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                {/* Icon chip */}
                <div style={{
                  width:52, height:52, borderRadius:14, flexShrink:0,
                  background: s.gradient,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24,
                  boxShadow:`0 4px 14px ${s.border}`,
                }}>
                  {isLoading ? '⏳' : s.icon}
                </div>

                {/* Labels */}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1E293B', marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5 }}>{s.subjects}</div>
                </div>

                {/* Chevron */}
                <div style={{ fontSize:20, color:'#CBD5E1', flexShrink:0 }}>›</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
