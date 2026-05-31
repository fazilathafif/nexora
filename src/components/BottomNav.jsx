import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { getColors } from '../pages/HomePage.jsx'
import { NAV_HEIGHT } from '../styles/tokens.js'
import { SIDEBAR_W } from '../styles/breakpoints.js'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { useTheme } from '../hooks/useTheme.js'
import { COURSERA_BLUE } from '../styles/courseraTokens.js'

function useStream() {
  const { pathname } = useLocation()
  const m = pathname.match(/^\/(gcse|alevel|sat|act|ap|psat|igcse|ib)/)
  return m ? m[1] : null
}

function useActiveTab(stream) {
  const { pathname } = useLocation()
  if (!stream) return null
  if (pathname === `/${stream}`) return 'home'
  if (pathname.includes('/resources'))  return 'resources'
  if (pathname.includes('/settings'))   return 'me'
  if (pathname.includes('/learn-hub') ||
    pathname.includes('/progress') ||
    pathname.includes('/today') ||
    pathname.includes('/plan')
  ) return 'learn'
  if (pathname.includes('/quiz/') ||
    pathname.includes('/mock/') ||
    pathname.includes('/flashcards/') ||
    pathname.includes('/match/')
  ) return 'learn'
  return 'home'
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function HomeIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5v-5a1.5 1.5 0 00-3 0v5H4a1 1 0 01-1-1z"
        stroke={color} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function PracticeIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.9} />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color} strokeWidth={1.9} strokeLinecap="round"
      />
    </svg>
  )
}

function LearnIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function MeIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
    </svg>
  )
}

function ResourcesIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="11" height="15" rx="2" stroke={color} strokeWidth={1.9}/>
      <path d="M8 7h5M8 10h5M8 13h3" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
      <path d="M15 7h1a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2" stroke={color} strokeWidth={1.9} strokeLinecap="round"/>
    </svg>
  )
}

// ── Subject picker bottom sheet ───────────────────────────────────────────────
function SubjectSheet({ stream, C, onClose }) {
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'0 20px 14px' }}>
              {[
                { label:'Quiz',  icon:'📝', path:`/${stream}/quiz/${s.id}` },
                { label:'Cards', icon:'🃏', path:`/${stream}/flashcards/${s.id}` },
                { label:'Mock',  icon:'📋', path:`/${stream}/mock/${s.id}` },
                { label:'Learn', icon:'🧠', path:`/${stream}/learn/${s.id}` },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => go(m.path)}
                  style={{
                    background:`${C.primary}10`,
                    border:`1.5px solid ${C.primary}30`,
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

// ── macOS-style spring tab item ───────────────────────────────────────────────
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const EASE   = 'cubic-bezier(0.4, 0, 0.2, 1)'

function NavTab({ tab, active, isDark, C }) {
  const [pressed, setPressed] = useState(false)

  const iconColor = active ? 'white' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)')
  const scale = pressed ? 0.88 : active ? 1.08 : 1

  return (
    <button
      onClick={tab.action}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '6px 4px 8px',
        fontFamily: 'Inter,sans-serif',
        WebkitTapHighlightColor: 'transparent',
        transform: `scale(${scale})`,
        transition: pressed
          ? `transform 0.12s ${EASE}`
          : `transform 0.38s ${SPRING}`,
      }}
    >
      {/* Icon pill */}
      <div style={{
        width: 44,
        height: 32,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? COURSERA_BLUE : 'transparent',
        boxShadow: active
          ? `0 2px 10px ${COURSERA_BLUE}55`
          : 'none',
        transition: `background 0.22s ${EASE}, box-shadow 0.22s ${EASE}`,
      }}>
        <tab.Icon color={iconColor} size={20} />
      </div>

      {/* Label */}
      <span style={{
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        color: active
          ? COURSERA_BLUE
          : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)'),
        lineHeight: 1,
        letterSpacing: active ? '-0.2px' : '0px',
        transition: `color 0.2s ${EASE}`,
      }}>
        {tab.label}
      </span>
    </button>
  )
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const navigate      = useNavigate()
  const stream        = useStream()
  const activeTab     = useActiveTab(stream)
  const { isDesktop } = useBreakpoint()
  const { isDark }    = useTheme()

  if (!stream) return null

  const C = getColors(stream, null, isDark)

  const tabs = [
    { id:'home',      label:'Home',      Icon:HomeIcon,      action:() => navigate(`/${stream}`) },
    { id:'learn',     label:'Learn',     Icon:LearnIcon,     action:() => navigate(`/${stream}/learn-hub`) },
    { id:'resources', label:'Resources', Icon:ResourcesIcon, action:() => navigate(`/${stream}/resources`) },
    { id:'me',        label:'Profile',   Icon:MeIcon,        action:() => navigate(`/${stream}/settings`) },
  ]

  // ── Desktop sidebar ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <nav style={{
        position:'fixed', top:0, left:0, bottom:0,
        width:SIDEBAR_W, zIndex:100,
        display:'flex', flexDirection:'column',
        background: isDark ? 'rgba(28,29,31,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        paddingTop:'env(safe-area-inset-top, 0px)',
        boxShadow: isDark
          ? '2px 0 20px rgba(0,0,0,0.4)'
          : '2px 0 20px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ padding:'28px 20px 24px', borderBottom:`1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
          <div style={{ fontSize:20, fontWeight:900, color:COURSERA_BLUE, letterSpacing:'-0.5px' }}>
            Nexora
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:3, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {STREAM_CONFIG[stream]?.label?.replace(' Track','').replace(' Prep','') ?? stream.toUpperCase()}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <DesktopNavItem
                key={tab.id}
                tab={tab}
                active={active}
                isDark={isDark}
                C={C}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 20px', borderTop:`1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, fontSize:10, color:C.muted, fontWeight:600, letterSpacing:'0.04em' }}>
          nexoralearn.app
        </div>
      </nav>
    )
  }

  // ── Mobile floating bar ─────────────────────────────────────────────────────
  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        left: 16,
        right: 16,
        height: 62,
        zIndex: 100,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 20,
        overflow: 'hidden',
        // Frosted glass
        background: isDark ? 'rgba(36,37,40,0.86)' : 'rgba(255,255,255,0.86)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {tabs.map(tab => (
        <NavTab
          key={tab.id}
          tab={tab}
          active={activeTab === tab.id}
          isDark={isDark}
          C={C}
        />
      ))}
    </nav>
  )
}

// ── Desktop sidebar item with spring hover ────────────────────────────────────
function DesktopNavItem({ tab, active, isDark, C }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const scale = pressed ? 0.96 : hovered && !active ? 1.02 : 1
  const tx    = hovered && !active ? 2 : 0

  return (
    <button
      key={tab.id}
      onClick={tab.action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'10px 12px',
        borderRadius:10,
        border:'none',
        background: active
          ? `${COURSERA_BLUE}14`
          : hovered ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
        cursor:'pointer',
        fontFamily:'Inter,sans-serif',
        WebkitTapHighlightColor:'transparent',
        transform: `scale(${scale}) translateX(${tx}px)`,
        transition: pressed
          ? `transform 0.1s ${EASE}, background 0.15s ${EASE}`
          : `transform 0.32s ${SPRING}, background 0.18s ${EASE}`,
        position:'relative',
      }}
    >
      {/* Active left bar */}
      {active && (
        <div style={{
          position:'absolute', left:0, top:'18%', bottom:'18%',
          width:3, borderRadius:'0 3px 3px 0',
          background:COURSERA_BLUE,
          boxShadow:`0 0 6px ${COURSERA_BLUE}80`,
          transition:`opacity 0.2s ${EASE}`,
        }} />
      )}

      {/* Icon container */}
      <div style={{
        width:32, height:32, borderRadius:8, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: active ? `${COURSERA_BLUE}18` : 'transparent',
        transition:`background 0.2s ${EASE}`,
      }}>
        <tab.Icon color={active ? COURSERA_BLUE : C.muted} size={18} />
      </div>

      <span style={{
        fontSize:13, fontWeight: active ? 700 : 500,
        color: active ? COURSERA_BLUE : C.muted,
        transition:`color 0.2s ${EASE}`,
      }}>
        {tab.label}
      </span>
    </button>
  )
}
