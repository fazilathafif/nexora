import { useState } from 'react'

const CAS_GOAL = 150

const PILLARS = [
  { key: 'creativity', label: 'Creativity', emoji: '🎨' },
  { key: 'activity',   label: 'Activity',   emoji: '⚽' },
  { key: 'service',    label: 'Service',     emoji: '🤝' },
]

const CAS_DEFAULTS = {
  creativity: [
    { id:'c1', name:'Art / Photography',           hours:0 },
    { id:'c2', name:'Music practice',              hours:0 },
    { id:'c3', name:'Creative writing / Blogging', hours:0 },
    { id:'c4', name:'Learning a new skill',        hours:0 },
    { id:'c5', name:'Drama / Theatre',             hours:0 },
  ],
  activity: [
    { id:'a1', name:'School sports team',   hours:0 },
    { id:'a2', name:'Running / Gym',        hours:0 },
    { id:'a3', name:'Swimming',             hours:0 },
    { id:'a4', name:'Yoga / Martial arts',  hours:0 },
    { id:'a5', name:'Dance / Aerobics',     hours:0 },
  ],
  service: [
    { id:'s1', name:'Tutoring younger students',      hours:0 },
    { id:'s2', name:'Volunteering at local charity',  hours:0 },
    { id:'s3', name:'Environmental clean-up',         hours:0 },
    { id:'s4', name:'Community fundraising',          hours:0 },
    { id:'s5', name:'Mentoring / Teaching',           hours:0 },
  ],
}

function loadCAS(userId) {
  try {
    const raw = localStorage.getItem(`nx_cas_${userId}`)
    if (raw) {
      const stored = JSON.parse(raw)
      const merged = {}
      for (const key of ['creativity', 'activity', 'service']) {
        const pillar = stored[key] ?? { activities: [] }
        // Filter out blank activities (stale empty entries)
        const valid = (pillar.activities ?? []).filter(a => (a.name || '').trim() !== '')
        merged[key] = {
          activities: valid.length > 0 ? valid : CAS_DEFAULTS[key],
        }
      }
      return merged
    }
  } catch {}
  return {
    creativity: { activities: CAS_DEFAULTS.creativity },
    activity:   { activities: CAS_DEFAULTS.activity },
    service:    { activities: CAS_DEFAULTS.service },
  }
}

function saveCAS(userId, data) {
  localStorage.setItem(`nx_cas_${userId}`, JSON.stringify(data))
}

function pillarTotal(pillar) {
  return (pillar.activities ?? []).reduce((sum, a) => sum + (a.hours ?? 0), 0)
}

function progressColor(pct) {
  if (pct >= 100) return '#10B981'
  if (pct >= 50)  return '#F59E0B'
  return '#EF4444'
}

export default function CASTracker({ userId, C }) {
  const [data, setData]       = useState(() => loadCAS(userId))
  const [collapsed, setCollapsed] = useState({ creativity: false, activity: false, service: false })
  const [newName, setNewName] = useState({ creativity: '', activity: '', service: '' })

  const totals = {
    creativity: pillarTotal(data.creativity),
    activity:   pillarTotal(data.activity),
    service:    pillarTotal(data.service),
  }
  const grandTotal = totals.creativity + totals.activity + totals.service
  const pct        = Math.min(100, Math.round((grandTotal / CAS_GOAL) * 100))
  const barColor   = progressColor(pct)

  function persist(newData) {
    setData(newData)
    saveCAS(userId, newData)
  }

  function adjustActivity(pillarKey, actId, delta) {
    const activities = data[pillarKey].activities.map(a =>
      a.id === actId
        ? { ...a, hours: Math.max(0, Math.round((a.hours + delta) * 2) / 2) }
        : a
    )
    persist({ ...data, [pillarKey]: { activities } })
  }

  function addActivity(pillarKey) {
    const name = newName[pillarKey].trim()
    if (!name) return
    const activities = [...data[pillarKey].activities, { id: Date.now(), name, hours: 0 }]
    persist({ ...data, [pillarKey]: { activities } })
    setNewName(prev => ({ ...prev, [pillarKey]: '' }))
  }

  function deleteActivity(pillarKey, actId) {
    const activities = data[pillarKey].activities.filter(a => a.id !== actId)
    persist({ ...data, [pillarKey]: { activities } })
  }

  return (
    <div style={{ fontFamily:'Inter,sans-serif' }}>

      {/* Grand total bar */}
      <div style={{
        background: C.bg, border:`1px solid ${C.border}`,
        borderRadius:14, padding:'14px 16px', marginBottom:14,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>Total CAS Hours</span>
          <span style={{ fontSize:20, fontWeight:900, color:barColor }}>
            {grandTotal}
            <span style={{ fontSize:13, fontWeight:600, color:C.muted }}> / {CAS_GOAL}h</span>
          </span>
        </div>
        <div style={{ height:7, borderRadius:4, background:`${barColor}20`, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:barColor, transition:'width 0.35s ease' }} />
        </div>
        <div style={{ display:'flex', gap:14, marginTop:8 }}>
          {PILLARS.map(p => (
            <div key={p.key} style={{ fontSize:11, color:C.muted, fontWeight:600 }}>
              {p.emoji} {totals[p.key]}h
            </div>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {PILLARS.map(({ key, label, emoji }) => {
          const pillar  = data[key]
          const total   = totals[key]
          const isOpen  = !collapsed[key]

          return (
            <div key={key} style={{ border:`1.5px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>

              {/* Pillar header */}
              <button
                onClick={() => setCollapsed(p => ({ ...p, [key]: !p[key] }))}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'11px 14px', background:C.bg, border:'none',
                  cursor:'pointer', fontFamily:'Inter,sans-serif', WebkitTapHighlightColor:'transparent',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:17 }}>{emoji}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:C.navy }}>{label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:C.primary, background:`${C.primary}15`, borderRadius:20, padding:'2px 8px' }}>
                    {total}h
                  </span>
                </div>
                <span style={{ fontSize:12, color:C.muted, transform:isOpen?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
              </button>

              {isOpen && (
                <div style={{ padding:'0 14px 14px' }}>

                  {/* Activity rows */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10, marginBottom:10 }}>
                    {pillar.activities.map(a => (
                      <div key={a.id} style={{
                        display:'flex', alignItems:'center', gap:8,
                        background:`${C.primary}08`, border:`1px solid ${C.border}`,
                        borderRadius:10, padding:'8px 10px',
                      }}>
                        {/* Name */}
                        <span style={{ flex:1, fontSize:12, fontWeight:600, color:C.navy, lineHeight:1.4, minWidth:0 }}>
                          {a.name}
                        </span>
                        {/* Hour adjuster */}
                        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                          <button
                            onClick={() => adjustActivity(key, a.id, -0.5)}
                            style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:'white', color:C.navy, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}
                          >−</button>
                          <span style={{ fontSize:13, fontWeight:800, color:C.primary, minWidth:32, textAlign:'center' }}>
                            {a.hours}h
                          </span>
                          <button
                            onClick={() => adjustActivity(key, a.id, 0.5)}
                            style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:'white', color:C.navy, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}
                          >+</button>
                        </div>
                        {/* Delete */}
                        <button
                          onClick={() => deleteActivity(key, a.id)}
                          style={{ background:'none', border:'none', color:C.muted, fontSize:16, cursor:'pointer', lineHeight:1, padding:'0 2px', flexShrink:0 }}
                          aria-label="Remove"
                        >×</button>
                      </div>
                    ))}
                  </div>

                  {/* Add custom activity */}
                  <div style={{ display:'flex', gap:6 }}>
                    <input
                      type="text"
                      placeholder={`Add ${label.toLowerCase()} activity…`}
                      value={newName[key]}
                      onChange={e => setNewName(p => ({ ...p, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addActivity(key)}
                      style={{ flex:1, padding:'8px 11px', borderRadius:8, border:`1.5px solid ${C.border}`, background:C.bg, color:C.navy, fontSize:12, fontFamily:'Inter,sans-serif', outline:'none' }}
                    />
                    <button
                      onClick={() => addActivity(key)}
                      style={{ padding:'8px 12px', borderRadius:8, border:'none', background:C.primary, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0 }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
