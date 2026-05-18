import { useState, useEffect } from 'react'

const SESSION_KEY = 'nx_welcome_shown'

/**
 * Shown once per login session — disappears on dismiss, reappears next login.
 * Uses sessionStorage so it fires on every new sign-in but not on page navigation.
 */
export default function WelcomeModal({ user, C, dark }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }
  }, [user])

  if (!visible) return null

  return (
    <div
      onClick={() => setVisible(false)}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: dark ? '#1A1A2E' : '#FFFFFF',
          border: `1.5px solid ${C.border}`,
          borderRadius:24, padding:'32px 26px', width:'100%', maxWidth:380,
          boxShadow:'0 24px 80px rgba(0,0,0,0.5)',
          fontFamily:'Inter,sans-serif',
        }}
      >
        {/* Badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:C.primary+'20',border:`1px solid ${C.primary}40`,borderRadius:20,padding:'4px 12px',marginBottom:18}}>
          <span style={{fontSize:12}}>🚀</span>
          <span style={{fontSize:10,fontWeight:800,color:C.primary,letterSpacing:'0.1em'}}>BETA VERSION</span>
        </div>

        {/* Heading */}
        <div style={{fontSize:22,fontWeight:900,color:C.navy,marginBottom:10,lineHeight:1.2}}>
          Welcome to Nexora <span style={{color:C.primary}}>✦</span>
        </div>

        {/* Body */}
        <p style={{fontSize:14,color:C.muted,lineHeight:1.75,margin:'0 0 10px'}}>
          You're one of our <strong style={{color:C.navy}}>early users</strong> — thank you for being here.
        </p>
        <p style={{fontSize:14,color:C.muted,lineHeight:1.75,margin:'0 0 20px'}}>
          Nexora is currently in <strong style={{color:C.primary}}>beta</strong>. Everything works, but we're still
          polishing and expanding. Your feedback directly shapes what we build next.
        </p>

        {/* Feedback prompt */}
        <div style={{
          background: C.primary+'12', border:`1px solid ${C.primary}30`,
          borderRadius:14, padding:'14px 16px', marginBottom:22,
          fontSize:13, color: dark ? '#A5B4FC' : C.primary, lineHeight:1.6,
        }}>
          💡 <strong>Got an idea or spotted a bug?</strong><br/>
          We'd love to hear it — every suggestion is read and considered.
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:10}}>
          <a
            href="mailto:feedback@nexorauk.com?subject=Nexora Beta Feedback"
            style={{
              flex:1, background:C.primary, color:'white', border:'none',
              borderRadius:12, padding:'12px', fontSize:14, fontWeight:800,
              cursor:'pointer', textAlign:'center', textDecoration:'none',
              fontFamily:'Inter,sans-serif',
            }}
          >
            Share Feedback ✉️
          </a>
          <button
            onClick={() => setVisible(false)}
            style={{
              flex:1, background:'transparent', border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:'12px', fontSize:14, fontWeight:700,
              color:C.muted, cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            Start Learning →
          </button>
        </div>
      </div>
    </div>
  )
}
