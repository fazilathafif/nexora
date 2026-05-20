import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { getColors } from '../pages/HomePage.jsx'
import { NAV_HEIGHT } from '../styles/tokens.js'

// Parse stream from path so this works outside a <Route> context
function useStream() {
  const { pathname } = useLocation()
  const m = pathname.match(/^\/(gcse|alevel)/)
  return m ? m[1] : null
}

function useActiveTab(stream) {
  const { pathname } = useLocation()
  if (!stream) return null
  if (pathname === `/${stream}`) return 'home'
  if (pathname.includes('/progress'))           return 'progress'
  if (pathname.includes('/plan'))               return 'plan'
  if (
    pathname.includes('/quiz/') ||
    pathname.includes('/mock/') ||
    pathname.includes('/flashcards/') ||
    pathname.includes('/match/')
  ) return 'practice'
  return 'home'
}

// ── Subject picker bottom sheet ───────────────────────────────────────────────
function SubjectSheet({ stream, C, dark, onClose }) {
  const navigate = useNavigate()
  const cfg = STREAM_CONFIG[stream]

  function go(path) { onClose(); navigate(path) }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 110,
          background: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 120,
          background: C.card,
          borderRadius: '20px 20px 0 0',
          paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          maxHeight: '80dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
        </div>

        {/* Title */}
        <div style={{
          padding: '8px 20px 16px',
          fontSize: 17, fontWeight: 800, color: C.navy, letterSpacing: '-0.3px',
        }}>
          Choose subject
        </div>

        {/* Subject rows */}
        {cfg.subjects.map(s => (
          <div key={s.id} style={{
            marginBottom: 2,
            borderTop: `1px solid ${C.border}`,
          }}>
            {/* Subject header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px 10px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${C.primary}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {s.emoji}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{s.label}</div>
            </div>

            {/* Mode buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 20px 14px' }}>
              {[
                { label: 'Quiz',   icon: '📝', path: `/${stream}/quiz/${s.id}` },
                { label: 'Cards',  icon: '🃏', path: `/${stream}/flashcards/${s.id}` },
                { label: 'Mock',   icon: '📋', path: `/${stream}/mock/${s.id}` },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => go(m.path)}
                  style={{
                    background: dark ? `${C.primary}20` : `${C.primary}10`,
                    border: `1.5px solid ${C.primary}30`,
                    borderRadius: 12,
                    padding: '10px 4px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>{m.label}</span>
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
  const navigate   = useNavigate()
  const stream     = useStream()
  const activeTab  = useActiveTab(stream)
  const [showPicker, setShowPicker] = useState(false)

  if (!stream) return null

  const C    = getColors(stream)
  const dark = stream === 'alevel'

  const tabs = [
    { id: 'home',     icon: '🏠', label: 'Home',     action: () => navigate(`/${stream}`) },
    { id: 'practice', icon: '📝', label: 'Practice',  action: () => setShowPicker(true) },
    { id: 'progress', icon: '📊', label: 'Progress',  action: () => navigate(`/${stream}/progress`) },
    { id: 'plan',     icon: '📅', label: 'Plan',      action: () => navigate(`/${stream}/plan`) },
  ]

  return (
    <>
      {showPicker && (
        <SubjectSheet
          stream={stream}
          C={C}
          dark={dark}
          onClose={() => setShowPicker(false)}
        />
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
        boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px 4px 0',
                position: 'relative',
                fontFamily: 'Inter,sans-serif',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 28, borderRadius: 10,
                  background: `${C.primary}18`,
                }} />
              )}

              <span style={{
                fontSize: 20, lineHeight: 1,
                position: 'relative', zIndex: 1,
                transform: active ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 10, fontWeight: active ? 800 : 500,
                color: active ? C.primary : C.muted,
                lineHeight: 1.2,
                transition: 'color 0.15s ease',
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
