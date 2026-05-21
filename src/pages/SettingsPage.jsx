import { useNavigate, useParams } from 'react-router-dom'
import { Shell } from './HomePage.jsx'
import { NAV_HEIGHT } from '../styles/tokens.js'

const APP_VERSION = '1.0.0-beta'

// Reuse the gradient for A-Level brand colour (purple)
const C = {
  primary:'#7C3AED', secondary:'#EC4899', accent:'#06B6D4',
  bg:'#EDE9FE', card:'#FFFFFF', navy:'#1E293B', soft:'#EDE9FE',
  muted:'#64748B', success:'#10B981', border:'#E2E8F0',
}

function SettingsRow({ icon, label, sublabel, onClick, right, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:14,
        background:'white', border:'none', borderRadius:0,
        padding:'14px 0', cursor: onClick ? 'pointer' : 'default',
        textAlign:'left', fontFamily:'Inter,sans-serif',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background: danger ? '#FEE2E2' : `${C.primary}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color: danger ? '#DC2626' : C.navy }}>{label}</div>
        {sublabel && <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{sublabel}</div>}
      </div>
      {right !== undefined ? right : onClick ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
          <path d="M9 18l6-6-6-6" stroke="#CBD5E1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : null}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
        {title}
      </div>
      <div style={{ background:'white', borderRadius:16, border:'1px solid #F1F5F9', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height:1, background:'#F1F5F9', marginLeft:50 }} />
}

export default function SettingsPage({ user, signOut }) {
  const navigate  = useNavigate()
  const { stream } = useParams()

  const heroEl = (
    <div style={{ padding:'max(18px, env(safe-area-inset-top, 18px)) 16px 0', display:'flex', alignItems:'center', gap:12 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div>
        <div style={{ fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.4px' }}>Settings</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>Account &amp; preferences</div>
      </div>
    </div>
  )

  const email = user?.email
  const isGuest = !email || user?.isGuest

  return (
    <Shell C={C} heroContent={heroEl}>
      {/* Account */}
      <Section title="Account">
        <SettingsRow
          icon="👤"
          label={isGuest ? 'Guest account' : email}
          sublabel={isGuest ? 'Sign in to save your progress' : 'Signed in'}
          onClick={null}
          right={null}
        />
        {!isGuest && (
          <>
            <Divider />
            <SettingsRow
              icon="🚪"
              label="Sign Out"
              sublabel="You can sign back in at any time"
              onClick={() => { signOut?.(); navigate('/') }}
              danger
              right={null}
            />
          </>
        )}
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <SettingsRow
          icon="⭐"
          label="Manage Subscription"
          sublabel="View plan, billing history, cancel"
          onClick={() => window.open('https://nexoralearn.app/billing', '_blank')}
        />
      </Section>

      {/* Legal */}
      <Section title="Legal">
        <SettingsRow
          icon="🔒"
          label="Privacy Policy"
          sublabel="How we collect and use your data"
          onClick={() => navigate('/privacy')}
        />
        <Divider />
        <SettingsRow
          icon="📄"
          label="Terms of Service"
          sublabel="Subscription terms, acceptable use"
          onClick={() => navigate('/terms')}
        />
      </Section>

      {/* Support */}
      <Section title="Support">
        <SettingsRow
          icon="✉️"
          label="Contact Support"
          sublabel="support@nexoralearn.app"
          onClick={() => window.open('mailto:support@nexoralearn.app')}
        />
        <Divider />
        <SettingsRow
          icon="🐞"
          label="Report a Bug"
          sublabel="Help us improve Nexora"
          onClick={() => window.open('mailto:support@nexoralearn.app?subject=Bug%20Report')}
        />
      </Section>

      {/* App info */}
      <div style={{ textAlign:'center', paddingBottom:8 }}>
        <div style={{ fontSize:12, color:'#CBD5E1', fontWeight:600 }}>Nexora · v{APP_VERSION}</div>
        <div style={{ fontSize:11, color:'#E2E8F0', marginTop:2 }}>nexoralearn.app</div>
      </div>
    </Shell>
  )
}
