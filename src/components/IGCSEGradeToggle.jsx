import { useState } from 'react'

const LS_KEY = 'nx_igcse_scheme'
const SCHEMES = ['9-1', 'A*-G']

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useIGCSEScheme() {
  const [scheme, setSchemeState] = useState(
    () => localStorage.getItem(LS_KEY) ?? '9-1'
  )
  const setScheme = (s) => {
    localStorage.setItem(LS_KEY, s)
    setSchemeState(s)
  }
  return [scheme, setScheme]
}

// ── Toggle component ──────────────────────────────────────────────────────────

export default function IGCSEGradeToggle({ C, onChange }) {
  const [scheme, setScheme] = useIGCSEScheme()

  function select(s) {
    setScheme(s)
    onChange?.(s)
  }

  return (
    <div
      role="group"
      aria-label="IGCSE grading scheme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: `${C.primary}14`,
        border: `1.5px solid ${C.primary}30`,
        borderRadius: 24,
        padding: 3,
        gap: 0,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {SCHEMES.map((s, i) => {
        const active = scheme === s
        return (
          <button
            key={s}
            onClick={() => select(s)}
            aria-pressed={active}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: 'none',
              background: active ? C.primary : 'transparent',
              color: active ? 'white' : C.primary,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.18s ease, color 0.18s ease',
              letterSpacing: '-0.1px',
              // Tighten gap between the two pills
              marginLeft: i === 0 ? 0 : 0,
              boxShadow: active ? `0 2px 8px ${C.primary}40` : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
