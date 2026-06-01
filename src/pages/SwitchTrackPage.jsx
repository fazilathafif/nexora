import { useNavigate } from 'react-router-dom'
import { STREAM_CONFIG } from '../data/questions.js'
import { COURSERA_BLUE, TRACK_COLORS } from '../styles/courseraTokens.js'
import { getEffectivePlan } from '../lib/subscription.js'

export default function SwitchTrackPage({ profile }) {
  const navigate = useNavigate()

  const enrolledStreams = profile?.streams?.length
    ? profile.streams
    : profile?.stream ? [profile.stream] : []

  const activeStream = profile?.active_stream ?? profile?.stream

  // Free plan: only 1 track, no switching needed
  const isFree = getEffectivePlan(profile) === 'free'
  if (isFree || enrolledStreams.length <= 1) {
    navigate(activeStream ? `/${activeStream}` : '/landing', { replace: true })
    return null
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F7FA',
      fontFamily: 'Inter,sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: COURSERA_BLUE, letterSpacing: '-0.5px' }}>
          Nexora
        </div>
        <button
          onClick={() => navigate(`/${activeStream}`)}
          style={{
            background: 'transparent',
            border: `1.5px solid ${COURSERA_BLUE}`,
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: COURSERA_BLUE,
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ padding: '28px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1F1F1F', letterSpacing: '-0.4px', marginBottom: 6 }}>
          Switch track
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
          Jump to one of your enrolled tracks.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enrolledStreams.map(t => {
            const accent = TRACK_COLORS[t] ?? COURSERA_BLUE
            const cfg = STREAM_CONFIG[t]
            const isActive = t === activeStream
            return (
              <button
                key={t}
                onClick={() => navigate(`/${t}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '16px',
                  background: isActive ? `${accent}08` : 'white',
                  border: `1.5px solid ${isActive ? accent : '#E5E7EB'}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter,sans-serif',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}>
                  {cfg?.subjects[0]?.emoji ?? '📚'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1F1F1F' }}>
                    {cfg?.label ?? t.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {cfg?.years ?? ''}
                  </div>
                </div>
                {isActive && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: accent,
                    background: `${accent}15`,
                    border: `1px solid ${accent}40`,
                    borderRadius: 20,
                    padding: '3px 9px',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}>
                    CURRENT
                  </span>
                )}
                {!isActive && (
                  <span style={{ fontSize: 18, color: accent }}>›</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Edit tracks escape hatch */}
        <button
          onClick={() => navigate('/landing')}
          style={{
            marginTop: 28,
            width: '100%',
            padding: '12px 0',
            background: 'none',
            border: `1.5px solid #E5E7EB`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#6B7280',
            cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          + Enrol in more tracks
        </button>
      </div>
    </div>
  )
}
