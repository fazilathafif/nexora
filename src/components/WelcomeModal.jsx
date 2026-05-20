import { useState, useEffect } from 'react'

const SESSION_KEY = 'nx_welcome_shown'

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

  function sendFeedback() {
    window.open('mailto:afif@nexorauk.com?subject=Nexora Beta Feedback', '_blank')
  }

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
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:C.primary+'20',border:`1px solid ${C.primary}40`,borderRadius:20,padding:'4px 12px',marginBottom:16}}>
          <span style={{fontSize:12}}>🚀</span>
          <span style={{fontSize:10,fontWeight:800,color:C.primary,letterSpacing:'0.1em'}}>BETA VERSION</span>
        </div>

        {/* Heading — large enough to fill the card width */}
        <div style={{fontSize:30,fontWeight:900,color:C.navy,marginBottom:14,lineHeight:1.1,letterSpacing:'-0.5px'}}>
          Welcome to Nexora <span style={{color:C.primary}}>✦</span>
        </div>

        {/* Body — 1–2 sentences */}
        <p style={{fontSize:14,color:C.muted,lineHeight:1.7,margin:'0 0 24px'}}>
          You're one of our first users — thank you for being here.{' '}
          <strong style={{color:C.navy}}>Share your feedback</strong> and help shape what we build next.
        </p>

        {/* Actions */}
        <div style={{display:'flex',gap:10}}>
          <button
            onClick={sendFeedback}
            style={{
              flex:1, background:C.primary, color:'white', border:'none',
              borderRadius:12, padding:'13px', fontSize:14, fontWeight:800,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            Share Feedback ✉️
          </button>
          <button
            onClick={() => setVisible(false)}
            style={{
              flex:1, background:'transparent', border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:'13px', fontSize:14, fontWeight:700,
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
