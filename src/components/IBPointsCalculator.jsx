import { useMemo } from 'react'
import { getIBTotal, getIBGrade, getIBGradeColor } from '../lib/igcseGrades.js'
import { STREAM_CONFIG } from '../data/questions.js'

/**
 * IBPointsCalculator
 *
 * Renders a projected IB score out of 45 based on existing topic/session stats.
 *
 * Props:
 *   topicStats — array of { topic, pct, subjectId } from ProgressPage
 *   C          — colour theme object from getColors()
 */
export default function IBPointsCalculator({ topicStats = [], C }) {
  const ibSubjects = STREAM_CONFIG.ib?.subjects ?? []

  // Build a map of subjectId -> average pct across all topics for that subject
  const accuracyMap = useMemo(() => {
    const grouped = {}
    for (const entry of topicStats) {
      if (!entry.subjectId) continue
      if (!grouped[entry.subjectId]) grouped[entry.subjectId] = []
      grouped[entry.subjectId].push(entry.pct)
    }
    const result = {}
    for (const [id, values] of Object.entries(grouped)) {
      result[id] = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    }
    return result
  }, [topicStats])

  const hasData = Object.keys(accuracyMap).length > 0

  const { total, breakdown, bonusPoints } = useMemo(
    () => getIBTotal(accuracyMap, ibSubjects),
    [accuracyMap, ibSubjects]
  )

  // Subjects that have at least one data point
  const subjectsWithData = breakdown.filter(b => b.grade !== null)

  if (!hasData) {
    return (
      <div style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        padding: '28px 20px',
        textAlign: 'center',
        fontFamily: 'Inter,sans-serif',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          Complete at least one session per IB subject to see your projected score.
        </p>
      </div>
    )
  }

  // Dial geometry
  const RADIUS      = 54
  const STROKE      = 10
  const SIZE        = (RADIUS + STROKE) * 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const fillRatio   = total / 45
  const dashOffset  = CIRCUMFERENCE * (1 - fillRatio)
  const dialColor   = total >= 38 ? '#10B981' : total >= 28 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{
      background: C.card,
      border: `1.5px solid ${C.border}`,
      borderRadius: 16,
      padding: '24px 20px',
      fontFamily: 'Inter,sans-serif',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 10 }}>
        <div style={{
          background: `${C.primary}18`,
          borderRadius: 10,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}>
          🎓
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text ?? '#1E293B' }}>
            Projected IB Score
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            Based on your quiz accuracy
          </div>
        </div>
      </div>

      {/* Circular dial */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={C.border}
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={dialColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Centre label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: dialColor, lineHeight: 1 }}>
              {total}
            </span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
              / 45
            </span>
          </div>
        </div>
      </div>

      {/* Bonus points row */}
      {bonusPoints > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 20,
          padding: '6px 14px',
          background: `${C.primary}12`,
          borderRadius: 20,
          width: 'fit-content',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>
            +{bonusPoints} ToK/EE bonus {bonusPoints === 3 ? 'points' : 'point'}
          </span>
        </div>
      )}

      {/* Per-subject breakdown table */}
      {subjectsWithData.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {['Subject', 'Grade', 'Accuracy'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === 'Subject' ? 'left' : 'center',
                      padding: '6px 8px',
                      color: C.muted,
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectsWithData.map(({ subjectId, grade, pct }) => {
                const subject = ibSubjects.find(s => s.id === subjectId)
                const gradeColor = getIBGradeColor(grade)
                return (
                  <tr
                    key={subjectId}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <td style={{ padding: '9px 8px', color: C.text ?? '#1E293B', fontWeight: 500 }}>
                      {subject?.emoji && (
                        <span style={{ marginRight: 6 }}>{subject.emoji}</span>
                      )}
                      {subject?.label ?? subjectId}
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: `${gradeColor}18`,
                        color: gradeColor,
                        fontWeight: 900,
                        fontSize: 13,
                      }}>
                        {grade}
                      </span>
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                      <span style={{
                        color: pct >= 75 ? '#10B981' : pct >= 50 ? C.primary : '#EF4444',
                        fontWeight: 700,
                      }}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer note */}
      <p style={{
        margin: 0,
        fontSize: 11,
        color: C.muted,
        lineHeight: 1.5,
        textAlign: 'center',
        padding: '0 4px',
      }}>
        Based on your quiz accuracy. Requires at least 1 session per subject.
      </p>

    </div>
  )
}
