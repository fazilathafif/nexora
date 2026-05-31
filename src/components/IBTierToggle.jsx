import { useIBTier } from '../hooks/useIBTier.js'

/**
 * IBTierToggle — renders [SL][HL] pill selector for IB subjects.
 * Props: { subjectId, accent (hex color), onChange? }
 */
export default function IBTierToggle({ subjectId, accent = '#5B21B6', onChange }) {
  const [tier, setTier] = useIBTier(subjectId)

  function handleClick(t) {
    setTier(t)
    onChange?.(t)
  }

  return (
    <div style={{
      display: 'inline-flex',
      background: '#F1F5F9',
      borderRadius: 20,
      padding: 3,
      gap: 2,
    }}>
      {['sl', 'hl'].map(t => (
        <button
          key={t}
          onClick={() => handleClick(t)}
          style={{
            padding: '3px 10px',
            borderRadius: 16,
            border: 'none',
            background: tier === t ? accent : 'transparent',
            color: tier === t ? 'white' : '#64748B',
            fontSize: 10,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
