import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { getColors } from '../pages/HomePage.jsx'
import { NAV_HEIGHT, SERIF } from '../styles/tokens.js'
import { SIDEBAR_W } from '../styles/breakpoints.js'
import { useBreakpoint } from '../hooks/useBreakpoint.js'

function useStream() {
  const { pathname } = useLocation()
  const m = pathname.match(/^\/(gcse|alevel)/)
  return m ? m[1] : null
}

function useActiveTab(stream) {
  const { pathname } = useLocation()
  if (!stream) return null
  if (pathname === `/${stream}`) return 'home'
  if (pathname.includes('/progress'))  return 'progress'
  if (pathname.includes('/plan'))      return 'plan'
  if (pathname.includes('/quiz/') ||
    pathname.includes('/mock/') ||
    pathname.includes('/flashcards/') ||
    pathname.includes('/match/')
  ) return 'practice'
  if (pathname.includes('/settings')) return 'me'
  return 'home'
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function HomeIcon({ color, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5v-5a1.5 1.5 0 00-3 0v5H4a1 1 0 01-1-1z"
        stroke={color} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function PracticeIcon({ color, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Lightning bolt — energy, action */}
      <path
        d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12z"
        stroke={color} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function ProgressIcon({ color, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Trending up with arrow */}
      <polyline
        points="3,18 8,12 13,15 20,7"
        stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points="16,7 20,7 20,11"
        stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function PlanIcon({ color, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Calendar with checkmark */}
      <rect x="3" y="4" width="18" height="17" rx="2.5"
        stroke={color} strokeWidth={1.9} strokeLinejoin="round"
      />
      <path d="M16 2v4M8 2v4M3 9h18"
        stroke={color} strokeWidth={1.9} strokeLinecap="round"
      />
      <path d="M8.5 15l2 2 5-5"
        stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function MeIcon({ color, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
    </svg>
  )
}

// ── Subject picker bottom sheet ───────────────────────────────────────────────
function SubjectSheet({ stream, C, dark, onClose }) {
  const navigate = useNavigate()
  const cfg = STREAM_CONFIG[stream]

  function go(path) { onClose(); navigate(path) }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:110, background:'rgba(0,0,0,0.45)' }}
      />
      <div
        className="animate-slide-up"
        style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:120,
          background: C.card,
          borderRadius:'20px 20px 0 0',
          paddingBottom:`calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',
          maxHeight:'80dvh', overflowY:'auto',
        }}
      >
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:C.border }} />
        </div>
        <div style={{ padding:'8px 20px 16px', fontSize:17, fontWeight:800, color:C.navy, letterSpacing:'-0.3px' }}>
          Choose subject
        </div>
        {cfg.subjects.map(s => (
          <div key={s.id} style={{ marginBottom:2, borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px 10px' }}>
              <div style={{
                width:40, height:40, borderRadius:12, flexShrink:0,
                background:`${C.primary}18`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
              }}>
                {s.emoji}
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>{s.label}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:'0 20px 14px' }}>
              {[
                { label:'Quiz',  icon:'📝', path:`/${stream}/quiz/${s.id}` },
                { label:'Cards', icon:'🃏', path:`/${stream}/flashcards/${s.id}` },
                { label:'Mock',  icon:'📋', path:`/${stream}/mock/${s.id}` },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => go(m.path)}
                  style={{
                    background: dark ? `${C.primary}20` : `${C.primary}10`,
                    border: `1.5px solid ${C.primary}30`,
                    borderRadius:12, padding:'10px 4px',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    cursor:'pointer', fontFamily:'Inter,sans-serif',
                  }}
                >
                  <span style={{ fontSize:18 }}>{m.icon}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:C.primary }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const navigate      = useNavigate()
  const stream        = useStream()
  const activeTab     = useActiveTab(stream)
  const [showPicker, setShowPicker] = useState(false)
  const { isDesktop } = useBreakpoint()

  if (!stream) return null

  const C    = getColors(stream)
  const dark = stream === 'alevel'

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      Icon: HomeIcon,
      action: () => navigate(`/${stream}`),
    },
    {
      id: 'practice',
      label: 'Practice',
      Icon: PracticeIcon,
      action: () => setShowPicker(true),
    },
    {
      id: 'progress',
      label: 'Progress',
      Icon: ProgressIcon,
      action: () => navigate(`/${stream}/progress`),
    },
    {
      id: 'plan',
      label: 'Plan',
      Icon: PlanIcon,
      action: () => navigate(`/${stream}/plan`),
    },
    {
      id: 'me',
      label: 'Me',
      Icon: MeIcon,
      action: () => navigate(`/${stream}/settings`),
    },
  ]

  if (isDesktop) {
    return (
      <>
        {showPicker && (
          <SubjectSheet stream={stream} C={C} dark={dark} onClose={() => setShowPicker(false)} />
        )}
        <nav style={{
          position:'fixed', top:0, left:0, bottom:0,
          width:SIDEBAR_W, zIndex:100,
          display:'flex', flexDirection:'column',
          background:'linear-gradient(180deg,#7B2FBE 0%,#FF3CAC 60%,#FF6B35 100%)',
          boxShadow:'2px 0 20px rgba(0,0,0,0.25)',
          paddingTop:'env(safe-area-inset-top, 0px)',
        }}>
          {/* Logo */}
          <div style={{ padding:'28px 20px 24px', borderBottom:'1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.5px', fontFamily:SERIF }}>
              Nexora <span style={{ opacity:0.6 }}>✦</span>
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', marginTop:3, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              {stream === 'gcse' ? 'GCSE Track' : 'A-Level Track'}
            </div>
          </div>

          {/* Nav items */}
          <div style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:4 }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'11px 14px',
                    borderRadius:12,
                    border:'none',
                    background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                    cursor:'pointer',
                    fontFamily:'Inter,sans-serif',
                    WebkitTapHighlightColor:'transparent',
                    transition:'background 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <tab.Icon color={active ? 'white' : 'rgba(255,255,255,0.6)'} size={20} />
                  <span style={{
                    fontSize:13, fontWeight: active ? 800 : 500,
                    color: active ? 'white' : 'rgba(255,255,255,0.65)',
                    letterSpacing: active ? '-0.01em' : '0',
                  }}>
                    {tab.label}
                  </span>
                  {active && (
                    <div style={{ marginLeft:'auto', width:4, height:4, borderRadius:2, background:'white' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Bottom brand note */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.04em' }}>
            nexoralearn.app
          </div>
        </nav>
      </>
    )
  }

  return (
    <>
      {showPicker && (
        <SubjectSheet stream={stream} C={C} dark={dark} onClose={() => setShowPicker(false)} />
      )}

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: NAV_HEIGHT,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: dark
          ? '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.4)'
          : '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 20px rgba(0,0,0,0.07)',
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          const iconColor = active ? C.primary : C.muted

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '0 6px',
                position: 'relative',
                fontFamily: 'Inter,sans-serif',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active top bar */}
              <div style={{
                position: 'absolute',
                top: 0, left: '15%', right: '15%',
                height: 3,
                borderRadius: '0 0 3px 3px',
                background: active ? C.primary : 'transparent',
                transition: 'background 0.2s ease',
                boxShadow: active && dark ? `0 0 10px ${C.primary}` : 'none',
              }} />

              {/* Icon wrapper — fills most of the bar */}
              <div
                key={active ? 'active' : 'inactive'}
                className={active ? 'tab-icon-active' : ''}
                style={{
                  width: 46, height: 36,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? `${C.primary}18` : 'transparent',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}>
                <tab.Icon
                  color={iconColor}
                  size={26}
                />
              </div>

              {/* Label */}
              <span style={{
                fontSize: 10.5,
                fontWeight: active ? 800 : 500,
                color: iconColor,
                lineHeight: 1,
                letterSpacing: active ? '-0.01em' : '0',
                transition: 'color 0.2s ease, font-weight 0.1s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
