import { useState } from 'react'

const CAS_GOAL = 150

const PILLARS = [
  { key: 'creativity', label: 'Creativity', emoji: '🎨' },
  { key: 'activity',   label: 'Activity',   emoji: '⚽' },
  { key: 'service',    label: 'Service',     emoji: '🤝' },
]

const CAS_DEFAULTS = {
  creativity: [
    { id:'c1', name:'Art / Photography', hours:0 },
    { id:'c2', name:'Music practice', hours:0 },
    { id:'c3', name:'Creative writing / Blogging', hours:0 },
    { id:'c4', name:'Learning a new skill', hours:0 },
    { id:'c5', name:'Drama / Theatre', hours:0 },
  ],
  activity: [
    { id:'a1', name:'School sports team', hours:0 },
    { id:'a2', name:'Running / Gym', hours:0 },
    { id:'a3', name:'Swimming', hours:0 },
    { id:'a4', name:'Yoga / Martial arts', hours:0 },
    { id:'a5', name:'Dance / Aerobics', hours:0 },
  ],
  service: [
    { id:'s1', name:'Tutoring younger students', hours:0 },
    { id:'s2', name:'Volunteering at local charity', hours:0 },
    { id:'s3', name:'Environmental clean-up', hours:0 },
    { id:'s4', name:'Community fundraising', hours:0 },
    { id:'s5', name:'Mentoring / Teaching', hours:0 },
  ],
}

function loadCAS(userId) {
  try {
    const raw = localStorage.getItem(`nx_cas_${userId}`)
    if (raw) {
      const stored = JSON.parse(raw)
      // Merge defaults into any pillar that has no activities yet
      const merged = {}
      for (const key of ['creativity', 'activity', 'service']) {
        const pillar = stored[key] ?? { hours: 0, activities: [] }
        merged[key] = {
          hours: pillar.hours ?? 0,
          activities: pillar.activities?.length > 0
            ? pillar.activities
            : CAS_DEFAULTS[key],
        }
      }
      return merged
    }
  } catch {}
  return {
    creativity: { hours: 0, activities: CAS_DEFAULTS.creativity },
    activity:   { hours: 0, activities: CAS_DEFAULTS.activity },
    service:    { hours: 0, activities: CAS_DEFAULTS.service },
  }
}

function saveCAS(userId, data) {
  localStorage.setItem(`nx_cas_${userId}`, JSON.stringify(data))
}

function progressColor(total) {
  if (total >= 100) return '#10B981'
  if (total >= 50)  return '#F59E0B'
  return '#EF4444'
}

export default function CASTracker({ userId, C }) {
  const [data, setData]         = useState(() => loadCAS(userId))
  const [collapsed, setCollapsed] = useState({ creativity: false, activity: false, service: false })
  const [inputs, setInputs]     = useState({ creativity: '', activity: '', service: '' })

  const totalHours = PILLARS.reduce((sum, p) => sum + (data[p.key]?.hours ?? 0), 0)
  const pct        = Math.min(100, Math.round((totalHours / CAS_GOAL) * 100))
  const barColor   = progressColor(totalHours)

  function update(newData) {
    setData(newData)
    saveCAS(userId, newData)
  }

  function adjustHours(key, delta) {
    const current = data[key].hours
    const next    = Math.max(0, Math.round((current + delta) * 2) / 2) // snap to 0.5 steps
    update({ ...data, [key]: { ...data[key], hours: next } })
  }

  function addActivity(key) {
    const text = inputs[key].trim()
    if (!text) return
    const next = {
      ...data,
      [key]: {
        ...data[key],
        activities: [...data[key].activities, { id: Date.now(), name: text }],
      },
    }
    update(next)
    setInputs(prev => ({ ...prev, [key]: '' }))
  }

  function deleteActivity(key, id) {
    update({
      ...data,
      [key]: {
        ...data[key],
        activities: data[key].activities.filter(a => a.id !== id),
      },
    })
  }

  function toggleCollapse(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
          IB CAS
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.navy, letterSpacing: '-0.3px' }}>
          CAS Hours Tracker
        </div>
      </div>

      {/* Total progress */}
      <div style={{
        background: C.bg,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 20,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Total Hours</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: barColor, letterSpacing: '-0.5px' }}>
            {totalHours}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}> / {CAS_GOAL}</span>
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: `${barColor}20`, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 4,
            background: barColor,
            transition: 'width 0.35s ease, background 0.35s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontWeight: 600 }}>
          {pct}% complete
          {totalHours >= CAS_GOAL ? ' — Goal reached! 🎉' : ` — ${CAS_GOAL - totalHours}h remaining`}
        </div>
      </div>

      {/* Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PILLARS.map(pillar => {
          const { key, label, emoji } = pillar
          const section  = data[key]
          const isOpen   = !collapsed[key]

          return (
            <div key={key} style={{
              border: `1.5px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>

              {/* Section header */}
              <button
                onClick={() => toggleCollapse(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: C.bg,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: C.primary,
                    background: `${C.primary}15`,
                    padding: '2px 7px',
                    borderRadius: 20,
                  }}>
                    {section.hours}h
                  </span>
                </div>
                <span style={{ fontSize: 12, color: C.muted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  ▾
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 14px' }}>

                  {/* Hour adjuster */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 14 }}>
                    <button
                      onClick={() => adjustHours(key, -0.5)}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: `1.5px solid ${C.border}`,
                        background: C.card,
                        color: C.navy, fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >−</button>
                    <span style={{ fontSize: 16, fontWeight: 900, color: C.navy, minWidth: 48, textAlign: 'center' }}>
                      {section.hours}h
                    </span>
                    <button
                      onClick={() => adjustHours(key, 0.5)}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: `1.5px solid ${C.border}`,
                        background: C.card,
                        color: C.navy, fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >+</button>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>+/− 0.5h</span>
                  </div>

                  {/* Add activity */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder={`Add ${label.toLowerCase()} activity…`}
                      value={inputs[key]}
                      onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addActivity(key)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 9,
                        border: `1.5px solid ${C.border}`,
                        background: C.bg,
                        color: C.navy,
                        fontSize: 13,
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => addActivity(key)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 9,
                        border: 'none',
                        background: C.primary,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        flexShrink: 0,
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {/* Activity list */}
                  {section.activities.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', paddingLeft: 2 }}>
                      No activities logged yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {section.activities.map(a => (
                        <div
                          key={a.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: `${C.primary}0a`,
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <span style={{ fontSize: 13, color: C.navy, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
                            {a.name ?? a.text}
                          </span>
                          <button
                            onClick={() => deleteActivity(key, a.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: C.muted,
                              fontSize: 16,
                              cursor: 'pointer',
                              lineHeight: 1,
                              padding: '0 2px',
                              flexShrink: 0,
                            }}
                            aria-label="Delete activity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
