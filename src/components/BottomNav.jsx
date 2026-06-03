import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { getColors } from '../pages/HomePage.jsx'
import { NAV_HEIGHT } from '../styles/tokens.js'
import { SIDEBAR_W } from '../styles/breakpoints.js'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { useTheme } from '../hooks/useTheme.js'
import { COURSERA_BLUE, TRACK_COLORS } from '../styles/courseraTokens.js'

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

function ContactIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"/>
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

  // ── Desktop — collapsible icon rail ────────────────────────────────────────
  if (isDesktop) {
    return <DesktopRail tabs={tabs} activeTab={activeTab} isDark={isDark} C={C} stream={stream} />
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
        // Frosted glass — Option A (subtle transparent frost)
        background: isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)'}`,
        boxShadow: isDark
          ? '0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
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

// ── Desktop Rail — collapsible icon rail (64px → 240px on hover) ─────────────

const RAIL_W = 180  // Fixed width — no hover expansion, clean and predictable

function DesktopRail({ tabs, activeTab, isDark, C, stream }) {
  const bg        = isDark ? 'rgba(18,19,22,0.92)' : 'rgba(255,255,255,0.92)'
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const trackLabel = STREAM_CONFIG[stream]?.label?.replace(' Track','').replace(' Prep','') ?? stream?.toUpperCase()

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position:'fixed', top:0, left:0, bottom:0,
        width: RAIL_W,
        zIndex:100,
        display:'flex', flexDirection:'column',
        background: bg,
        backdropFilter:'blur(28px) saturate(180%)',
        WebkitBackdropFilter:'blur(28px) saturate(180%)',
        borderRight:`1px solid ${borderCol}`,
        boxShadow: isDark ? '2px 0 24px rgba(0,0,0,0.4)' : '2px 0 16px rgba(0,0,0,0.06)',
        paddingTop:'env(safe-area-inset-top,0px)',
        overflow:'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        height:64, display:'flex', alignItems:'center',
        padding:'0 18px',
        borderBottom:`1px solid ${borderCol}`,
        flexShrink:0,
      }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`${COURSERA_BLUE}15`, display:'flex', alignItems:'center', justifyContent:'center', marginRight:10, flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:900, color:COURSERA_BLUE }}>N</span>
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:900, color:COURSERA_BLUE, letterSpacing:'-0.4px', whiteSpace:'nowrap' }}>Nexora</div>
          <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:1, whiteSpace:'nowrap' }}>
            {trackLabel}
          </div>
        </div>
      </div>

      {/* Nav items — compact, not stretched */}
      <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:1 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          const trackAccent = C.primary ?? COURSERA_BLUE
          return (
            <RailItem
              key={tab.id}
              tab={tab}
              active={active}
              expanded={true}
              isDark={isDark}
              C={C}
              accent={trackAccent}
            />
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height:1, background:borderCol, margin:'4px 12px' }} />

      {/* Active track info card */}
      <div style={{ margin:'8px 10px', padding:'12px 14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius:12, border:`1px solid ${borderCol}` }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Active Track</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:28, height:28, borderRadius:8, flexShrink:0,
            background:`${TRACK_COLORS[stream] ?? COURSERA_BLUE}20`,
            border:`1.5px solid ${TRACK_COLORS[stream] ?? COURSERA_BLUE}40`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{ width:10, height:10, borderRadius:5, background: TRACK_COLORS[stream] ?? COURSERA_BLUE }} />
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:800, color:C.navy, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:108 }}>
              {STREAM_CONFIG[stream]?.label?.replace(' Track','').replace(' Prep','') ?? stream?.toUpperCase()}
            </div>
            <div style={{ fontSize:10, color:C.muted, marginTop:1, whiteSpace:'nowrap' }}>{STREAM_CONFIG[stream]?.years ?? ''}</div>
          </div>
        </div>
      </div>

      {/* Spacer pushes footer down */}
      <div style={{ flex:1 }} />

      {/* Footer */}
      <div style={{
        padding:'12px 18px 16px',
        borderTop:`1px solid ${borderCol}`, flexShrink:0,
        display:'flex', flexDirection:'column', gap:4,
      }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:'0.04em' }}>nexoralearn.app</div>
        <div style={{ fontSize:9, color:C.muted, opacity:0.6 }}>v1.0.0-beta</div>
      </div>
    </nav>
  )
}

function RailItem({ tab, active, expanded, isDark, C, accent }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={tab.action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      title={!expanded ? tab.label : undefined}
      style={{
        display:'flex', alignItems:'center',
        gap: expanded ? 12 : 0,
        padding: expanded ? '8px 12px' : '8px 0',
        justifyContent: expanded ? 'flex-start' : 'center',
        borderRadius:10, border:'none',
        background: active
          ? `${accent}14`
          : hovered ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
        cursor:'pointer', fontFamily:'Inter,sans-serif',
        WebkitTapHighlightColor:'transparent',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition:`transform 0.12s ease, background 0.15s ease, padding 0.22s cubic-bezier(0.4,0,0.2,1), gap 0.22s cubic-bezier(0.4,0,0.2,1)`,
        position:'relative', overflow:'hidden', width:'100%',
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <div style={{
          position:'absolute', left:0, top:'20%', bottom:'20%',
          width:3, borderRadius:'0 3px 3px 0',
          background: accent,
          boxShadow:`0 0 8px ${accent}70`,
        }} />
      )}

      {/* Icon */}
      <div style={{
        width:36, height:36, borderRadius:9, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: active ? `${accent}18` : hovered ? `${accent}10` : 'transparent',
        transition:'background 0.15s ease',
      }}>
        <tab.Icon color={active ? accent : C.muted} size={20} />
      </div>

      {/* Label — only when expanded */}
      {expanded && (
        <span style={{
          fontSize:13, fontWeight: active ? 700 : 500,
          color: active ? accent : C.muted,
          whiteSpace:'nowrap', overflow:'hidden',
          opacity: expanded ? 1 : 0,
          transition:'opacity 0.15s ease',
        }}>
          {tab.label}
        </span>
      )}
    </button>
  )
}

// ── Legacy DesktopNavItem (kept for reference, no longer used) ─────────────────
function DesktopNavItem({ tab, active, isDark, C }) {
  return <RailItem tab={tab} active={active} expanded={true} isDark={isDark} C={C} accent={COURSERA_BLUE} />
}
