import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminGetAllUsers } from '../lib/db.js'
import { getColors, Shell, SectionLabel } from './HomePage.jsx'
import { shadow } from '../styles/tokens.js'

const PODIUM_MEDALS = ['🥇', '🥈', '🥉']

function PodiumCard({ entry, rank, C, isCurrentUser }) {
  const medal = PODIUM_MEDALS[rank]
  const heights = [96, 72, 56]
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        fontSize: 13, fontWeight: 800,
        color: isCurrentUser ? C.primary : '#1E293B',
        marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: 90, margin: '0 auto 6px',
      }}>
        {entry.display_name || 'Anonymous'}
      </div>
      <div style={{
        height: heights[rank], background: rank === 0
          ? `linear-gradient(135deg,${C.primary},${C.secondary ?? C.primary})`
          : C.card,
        borderRadius: '10px 10px 0 0',
        border: `2px solid ${rank === 0 ? C.primary : C.border}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: rank === 0 ? shadow.md : shadow.sm,
      }}>
        <div style={{ fontSize: 22 }}>{medal}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: rank === 0 ? 'rgba(255,255,255,0.9)' : C.muted, marginTop: 2 }}>
          {entry.xp ?? 0} XP
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage({ user, profile, isDark }) {
  const { stream }   = useParams()
  const navigate     = useNavigate()
  const C            = getColors(stream, null, isDark)
  const dark         = isDark

  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  useEffect(() => {
    setLoading(true)
    adminGetAllUsers()
      .then(({ data, error: err }) => {
        if (err) { setError(true); return }
        const list = (data ?? [])
          .filter(u => {
            const streams = u.streams ?? (u.stream ? [u.stream] : [])
            return streams.includes(stream) || u.active_stream === stream || u.stream === stream
          })
          .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
          .slice(0, 20)
        setEntries(list)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [stream])

  const myRank  = entries.findIndex(e => e.id === user?.id)
  const myEntry = myRank >= 0 ? entries[myRank] : null
  const inTop20 = myRank >= 0 && myRank < 20
  const top3    = entries.slice(0, 3)
  const rest    = entries.slice(3)

  return (
    <Shell C={C} isDark={isDark}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(`/${stream}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.muted, padding: '0 2px', lineHeight: 1 }}
          >←</button>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.4px' }}>
            Leaderboard
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px' }}>
          Weekly XP
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ background: C.border, borderRadius: 12, height: 56, animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Couldn't load leaderboard.</div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '36px 24px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 6 }}>No one here yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
            Complete quizzes to earn XP and climb the rankings.{'\n'}You could be #1!
          </div>
          <button
            onClick={() => navigate(`/${stream}`)}
            style={{
              background: C.primary, color: 'white', border: 'none',
              borderRadius: 8, padding: '12px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Inter,sans-serif',
            }}
          >
            Start a Quiz →
          </button>
          {profile?.xp > 0 && (
            <div style={{
              marginTop: 20, padding: '12px 16px',
              background: `${C.primary}10`, border: `1.5px solid ${C.primary}30`,
              borderRadius: 12, fontSize: 13, color: C.primary, fontWeight: 700,
            }}>
              You have {profile.xp} XP — invite friends to compete!
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <div style={{ background: C.card, borderRadius: 20, padding: '20px 16px 0', marginBottom: 16, boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.35)' : shadow.md }}>
              <SectionLabel C={C}>Top 3</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'center', paddingTop: 8 }}>
                {/* Reorder: 2nd, 1st, 3rd for classic podium shape */}
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((e, i) => {
                  const actualRank = entries.indexOf(e)
                  return (
                    <PodiumCard
                      key={e.id}
                      entry={e}
                      rank={actualRank}
                      C={C}
                      isCurrentUser={e.id === user?.id}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Ranked list 4–20 */}
          {rest.length > 0 && (
            <div style={{ background: C.card, borderRadius: 16, marginBottom: 14, overflow: 'hidden', boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.35)' : shadow.md }}>
              <div style={{ padding: '14px 16px 10px' }}>
                <SectionLabel C={C}>Rankings</SectionLabel>
              </div>
              {rest.map((e, i) => {
                const rank = i + 4
                const isMe = e.id === user?.id
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderTop: `1px solid ${C.border}`,
                      background: isMe ? `${C.primary}10` : 'transparent',
                    }}
                  >
                    <div style={{ width: 28, fontSize: 13, fontWeight: 800, color: C.muted, textAlign: 'center', flexShrink: 0 }}>
                      {rank}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: isMe ? 800 : 600, color: isMe ? C.primary : C.navy }}>
                      {e.display_name || 'Anonymous'}
                      {isMe && <span style={{ fontSize: 10, color: C.primary, marginLeft: 6 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>
                      {e.xp ?? 0} XP
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sticky current-user row if outside top 20 */}
          {!inTop20 && user && (
            <div style={{
              position: 'sticky', bottom: 72, left: 0, right: 0,
              background: `${C.primary}15`,
              border: `1.5px solid ${C.primary}40`,
              borderRadius: 14, padding: '12px 16px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 28, fontSize: 13, fontWeight: 800, color: C.primary, textAlign: 'center' }}>—</div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: C.primary }}>
                {profile?.display_name || 'You'}
                <span style={{ fontSize: 10, color: C.primary, marginLeft: 6 }}>(you)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>{profile?.xp ?? 0} XP</div>
            </div>
          )}

          {/* Privacy note */}
          <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 14 }}>
            Your name appears because leaderboard is enabled. Toggle it off in Settings → Privacy.
          </div>
        </>
      )}
    </Shell>
  )
}
