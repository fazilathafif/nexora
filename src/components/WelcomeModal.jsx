import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const SESSION_KEY = 'nx_welcome_shown'

export default function WelcomeModal({ user, C, dark }) {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const { stream } = useParams()

  useEffect(() => {
    if (!user) return
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }
  }, [user])

  if (!visible) return null

  function sendFeedback() {
    setVisible(false)
    navigate(`/${stream ?? 'gcse'}/settings?contact=1`)
  }

  return (
    <div
      onClick={() => setVisible(false)}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius:24, padding:'32px 26px', width:'100%', maxWidth:380,
          boxShadow:'0 24px 80px rgba(0,0,0,0.22)',
          fontFamily:'Inter,sans-serif',
        }}
      >
        {/* Badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#FF6B3518',border:'1px solid #FF6B3540',borderRadius:20,padding:'4px 12px',marginBottom:16}}>
          <span style={{fontSize:12}}>🚀</span>
          <span style={{fontSize:10,fontWeight:800,color:'#FF6B35',letterSpacing:'0.1em'}}>BETA VERSION</span>
        </div>

        {/* Heading */}
        <div style={{fontSize:30,fontWeight:900,color:'#1E293B',marginBottom:14,lineHeight:1.1,letterSpacing:'-0.5px'}}>
          Welcome to Nexora <span style={{color:'#FF6B35'}}>✦</span>
        </div>

        {/* Body */}
        <p style={{fontSize:14,color:'#64748B',lineHeight:1.7,margin:'0 0 24px'}}>
          You're one of our first users — thank you for being here.{' '}
          <strong style={{color:'#1E293B'}}>Share your feedback</strong> and help shape what we build next.
        </p>

        {/* Actions */}
        <div style={{display:'flex',gap:10}}>
          <button
            onClick={sendFeedback}
            style={{
              flex:1, background:'linear-gradient(135deg,#FF6B35,#FF3CAC)', color:'white', border:'none',
              borderRadius:12, padding:'13px', fontSize:14, fontWeight:800,
              cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            Share Feedback ✉️
          </button>
          <button
            onClick={() => setVisible(false)}
            style={{
              flex:1, background:'transparent', border:'1.5px solid #E2E8F0',
              borderRadius:12, padding:'13px', fontSize:14, fontWeight:700,
              color:'#64748B', cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            Start Learning →
          </button>
        </div>
      </div>
    </div>
  )
}
