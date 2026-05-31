import { useState, useEffect } from 'react'

const IA_MILESTONES = [
  'Choose research question / topic',
  'Read supervisor feedback requirements',
  'Complete primary research / experiment / data collection',
  'Write first draft',
  'Check word count (max ~2,000–4,000 depending on subject)',
  'Submit to supervisor for feedback',
  'Incorporate supervisor feedback',
  'Final submission',
]

const IB_IA_SUBJECTS = [
  { id: 'ib_maths_aa',         label: 'Maths AA' },
  { id: 'ib_maths_ai',         label: 'Maths AI' },
  { id: 'ib_biology',          label: 'Biology' },
  { id: 'ib_chemistry',        label: 'Chemistry' },
  { id: 'ib_physics',          label: 'Physics' },
  { id: 'ib_cs',               label: 'Computer Science' },
  { id: 'ib_ess',              label: 'ESS' },
  { id: 'ib_history',          label: 'History' },
  { id: 'ib_economics',        label: 'Economics' },
  { id: 'ib_geography',        label: 'Geography' },
  { id: 'ib_psychology',       label: 'Psychology' },
  { id: 'ib_business',         label: 'Business Management' },
  { id: 'ib_english_a_lanlit', label: 'English A: Lang & Lit' },
  { id: 'ib_english_a_lit',    label: 'English A: Literature' },
]

function loadChecklist(subjectId) {
  try {
    const raw = localStorage.getItem(`nx_ia_${subjectId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveChecklist(subjectId, data) {
  localStorage.setItem(`nx_ia_${subjectId}`, JSON.stringify(data))
}

export default function IAChecklist({ userId, C }) {
  const [subjectId, setSubjectId] = useState(IB_IA_SUBJECTS[0].id)
  const [checked, setChecked] = useState(() => loadChecklist(IB_IA_SUBJECTS[0].id))

  useEffect(() => {
    setChecked(loadChecklist(subjectId))
  }, [subjectId])

  function toggle(idx) {
    const next = { ...checked, [idx]: !checked[idx] }
    setChecked(next)
    saveChecklist(subjectId, next)
  }

  const done  = IA_MILESTONES.filter((_, i) => checked[i]).length
  const total = IA_MILESTONES.length
  const pct   = Math.round((done / total) * 100)
  const allDone = done === total

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: C.card,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      padding: '20px 18px',
      maxWidth: 480,
      width: '100%',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
          IB Internal Assessment
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.navy, letterSpacing: '-0.3px' }}>
          IA Checklist
        </div>
      </div>

      {/* Subject selector */}
      <select
        value={subjectId}
        onChange={e => setSubjectId(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          background: C.bg,
          color: C.navy,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 16,
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 32,
        }}
      >
        {IB_IA_SUBJECTS.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: allDone ? '#10B981' : C.primary }}>
            {done}/{total}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: `${C.primary}18`, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 4,
            background: allDone ? '#10B981' : C.primary,
            transition: 'width 0.35s ease',
          }} />
        </div>
      </div>

      {/* Completion badge */}
      {allDone && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#10B98115',
          border: '1.5px solid #10B98140',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>IA Complete!</div>
            <div style={{ fontSize: 11, color: '#059669', opacity: 0.8 }}>All milestones checked off.</div>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {IA_MILESTONES.map((milestone, i) => {
          const isChecked = !!checked[i]
          return (
            <label
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 10,
                background: isChecked ? `${C.primary}0d` : 'transparent',
                border: `1px solid ${isChecked ? `${C.primary}30` : C.border}`,
                cursor: 'pointer',
                transition: 'background 0.18s ease, border-color 0.18s ease',
              }}
            >
              {/* Custom checkbox */}
              <div
                onClick={() => toggle(i)}
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: `2px solid ${isChecked ? C.primary : C.border}`,
                  background: isChecked ? C.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                  transition: 'background 0.18s ease, border-color 0.18s ease',
                }}
              >
                {isChecked && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <span
                onClick={() => toggle(i)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: isChecked ? C.muted : C.navy,
                  textDecoration: isChecked ? 'line-through' : 'none',
                  transition: 'color 0.18s ease',
                }}
              >
                {milestone}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
