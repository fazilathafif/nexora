import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { adminGetAllUsers, adminUpdateProfile, adminDeleteProfile } from '../lib/db.js'
import { PLANS, getEffectivePlan, trialDaysLeft } from '../lib/subscription.js'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// ── Welcome Email Button ──────────────────────────────────────────────────────

function WelcomeEmailBtn({ user, C }) {
  const [status,    setStatus]    = useState('idle') // idle | sending | sent | error
  const [showMenu,  setShowMenu]  = useState(false)
  const [custom,    setCustom]    = useState('')
  const [showCustom, setShowCustom] = useState(false)

  async function send(template, customMsg) {
    if (!user?.email) return
    setStatus('sending'); setShowMenu(false); setShowCustom(false)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` },
        body: JSON.stringify({ to_email: user.email, to_name: user.display_name, template, custom_message: customMsg }),
      })
      setStatus(res.ok ? 'sent' : 'error')
      if (res.ok) setTimeout(() => setStatus('idle'), 3000)
    } catch { setStatus('error'); setTimeout(() => setStatus('idle'), 3000) }
  }

  if (!user?.email) return null

  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <button
        onClick={() => { if (status === 'idle') setShowMenu(m => !m) }}
        title="Send welcome email"
        style={{
          width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`,
          background: status==='sent' ? '#ECFDF5' : status==='error' ? '#FEF2F2' : status==='sending' ? '#F1F5F9' : 'white',
          color: status==='sent' ? '#10B981' : status==='error' ? '#EF4444' : C.muted,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: status==='idle' ? 'pointer' : 'default',
          fontSize:15, transition:'all 0.15s',
        }}
      >
        {status==='sending' ? '⏳' : status==='sent' ? '✓' : status==='error' ? '✕' : '✉️'}
      </button>

      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, zIndex:50 }} />
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            background:'white', border:`1.5px solid ${C.border}`,
            borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
            zIndex:51, minWidth:220, overflow:'hidden', fontFamily:'Inter,sans-serif',
          }}>
            <div style={{ padding:'10px 14px 6px', fontSize:11, fontWeight:800, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Send to {user.display_name ?? user.email}
            </div>
            {[
              { id:'new_user',      icon:'🎓', label:'Warm Welcome',      desc:'First-time welcome + getting started tips' },
              { id:'encouragement', icon:'⚡', label:'Encouragement',     desc:'Keep going — motivational nudge' },
            ].map(t => (
              <button key={t.id} onClick={() => send(t.id, undefined)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'white', border:'none', borderTop:`1px solid ${C.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.primary}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.label}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{t.desc}</div>
                </div>
              </button>
            ))}
            <button onClick={() => { setShowCustom(s => !s); setShowMenu(false) }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'white', border:'none', borderTop:`1px solid ${C.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.primary}08`}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <span style={{ fontSize:16 }}>✏️</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>Custom message</div>
                <div style={{ fontSize:10, color:C.muted }}>Write your own email body</div>
              </div>
            </button>
          </div>
        </>
      )}

      {showCustom && (
        <>
          <div onClick={() => setShowCustom(false)} style={{ position:'fixed', inset:0, zIndex:50 }} />
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            background:'white', border:`1.5px solid ${C.border}`,
            borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
            zIndex:51, width:280, padding:'14px', fontFamily:'Inter,sans-serif',
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Custom message to {user.display_name ?? 'user'}</div>
            <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={4} placeholder="Type your message…"
              style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:12, color:C.navy, background:'#1E293B', resize:'vertical', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
            <button onClick={() => send('new_user', custom)} disabled={custom.trim().length < 10}
              style={{ marginTop:8, width:'100%', padding:'9px', background: custom.trim().length >= 10 ? C.primary : '#D1D5DB', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor: custom.trim().length >= 10 ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>
              Send →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const ALL_STREAMS = [
  { id:'gcse',   label:'GCSE'    },
  { id:'alevel', label:'A-Level' },
  { id:'sat',    label:'SAT'     },
  { id:'act',    label:'ACT'     },
  { id:'ap',     label:'AP'      },
  { id:'psat',   label:'PSAT'    },
]

const C = {
  bg:'#0A0A14', card:'#0F172A', border:'#1E293B',
  primary:'#0D9488', navy:'#F8FAFC', muted:'#64748B', muted2:'#94A3B8',
  success:'#4ADE80', warn:'#F59E0B', danger:'#EF4444',
  gcse:'#0D9488', alevel:'#7C3AED',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name, email) {
  if (name && name !== 'Student') return name.slice(0, 2).toUpperCase()
  return (email ?? '?').slice(0, 2).toUpperCase()
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30)  return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function toIST(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'16px 14px', textAlign:'center' }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:900, color:color ?? C.primary }}>{value ?? '—'}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
    </div>
  )
}

function StreamBadge({ stream }) {
  if (!stream) return <span style={{ fontSize:10, color:C.muted }}>—</span>
  const STREAM_COLORS = { gcse:'#0D9488', alevel:'#7C3AED', sat:'#0056D2', act:'#059669', ap:'#D97706', psat:'#0891B2' }
  const color = STREAM_COLORS[stream] ?? C.primary
  return (
    <span style={{ background:color+'20', color, border:`1px solid ${color}40`, borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800, textTransform:'uppercase' }}>
      {stream.toUpperCase()}
    </span>
  )
}

function TrackPills({ user }) {
  const tracks = user.streams?.length ? user.streams : user.stream ? [user.stream] : []
  if (!tracks.length) return <span style={{ fontSize:10, color:C.muted }}>—</span>
  return (
    <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'flex-end' }}>
      {tracks.map(s => <StreamBadge key={s} stream={s} />)}
    </div>
  )
}

function Avatar({ name, email, size = 38 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:C.primary+'25', border:`2px solid ${C.primary}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:900, color:C.primary, flexShrink:0 }}>
      {initials(name, email)}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ user, onClose, onSave, onDelete, defaultTrialDays = 7 }) {
  const enrolledInit = user.streams?.length
    ? user.streams
    : user.stream ? [user.stream] : []

  const [form,    setForm]    = useState({
    display_name:  user.display_name ?? '',
    xp:            user.xp ?? 0,
    streams:       enrolledInit,
    active_stream: user.active_stream ?? user.stream ?? enrolledInit[0] ?? '',
    stream:        user.stream ?? '',
    is_admin:      user.is_admin ?? false,
    plan:          user.plan ?? 'free',
    trial_ends_at: user.trial_ends_at ? user.trial_ends_at.slice(0, 10) : '',
  })
  const [saving,  setSaving]  = useState(false)
  const [confirm, setConfirm] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleTrack(id) {
    setForm(f => {
      const has = f.streams.includes(id)
      const next = has ? f.streams.filter(s => s !== id) : [...f.streams, id]
      // If removing the active stream, reset active to first remaining
      const active = next.includes(f.active_stream)
        ? f.active_stream
        : (next[0] ?? '')
      return { ...f, streams: next, active_stream: active, stream: active }
    })
  }

  function setActive(id) {
    setForm(f => ({ ...f, active_stream: id, stream: id }))
  }

  async function save() {
    setSaving(true)
    await onSave(user.id, {
      ...form,
      xp: Number(form.xp),
      // Ensure stream stays in sync with active_stream
      stream: form.active_stream || form.streams[0] || '',
    })
    setSaving(false)
    onClose()
  }

  async function del() {
    if (!confirm) { setConfirm(true); return }
    setSaving(true)
    await onDelete(user.id)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={onClose}>
      <div style={{ background:C.card, borderRadius:'20px 20px 0 0', padding:'24px 22px 44px', width:'100%', maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, background:C.border, borderRadius:2, margin:'0 auto 20px' }} />

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <Avatar name={user.display_name} email={user.email} size={44} />
          <div>
            <div style={{ fontWeight:800, color:C.navy, fontSize:15 }}>{user.display_name ?? 'Student'}</div>
            <div style={{ fontSize:12, color:C.muted }}>{user.email}</div>
          </div>
        </div>

        {[
          { label:'DISPLAY NAME', key:'display_name', type:'text' },
          { label:'XP',           key:'xp',           type:'number' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={lbl}>{label}</label>
            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
              style={inp}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>ENROLLED TRACKS</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {ALL_STREAMS.map(s => {
              const on = form.streams.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleTrack(s.id)}
                  style={{
                    padding:'8px 6px', borderRadius:9, border:`1.5px solid ${on ? C.primary : C.border}`,
                    background: on ? `${C.primary}18` : 'transparent',
                    color: on ? C.primary : C.muted, fontSize:12, fontWeight:700,
                    cursor:'pointer', fontFamily:'Inter,sans-serif',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                  }}
                >
                  <span style={{ fontSize:14 }}>{on ? '✓' : '○'}</span>
                  {s.label}
                </button>
              )
            })}
          </div>

          {form.streams.length > 0 && (
            <>
              <label style={{ ...lbl, marginTop:4 }}>ACTIVE TRACK</label>
              <select
                value={form.active_stream}
                onChange={e => setActive(e.target.value)}
                style={{ ...inp, cursor:'pointer' }}
              >
                {form.streams.map(id => {
                  const s = ALL_STREAMS.find(x => x.id === id)
                  return <option key={id} value={id}>{s?.label ?? id}</option>
                })}
              </select>
              <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>The track the student sees when they open the app.</div>
            </>
          )}

          {form.streams.length === 0 && (
            <div style={{ fontSize:11, color:C.warn, padding:'8px 10px', background:`${C.warn}12`, borderRadius:8 }}>
              No tracks selected — student won't have an active stream.
            </div>
          )}
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>PLAN</label>
          <select value={form.plan} onChange={e => set('plan', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
            {Object.entries(PLANS).map(([key, p]) => (
              <option key={key} value={key}>{p.name}</option>
            ))}
          </select>
        </div>

        {form.plan === 'trial' && (
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>TRIAL ENDS</label>

            {/* Quick-extend buttons */}
            <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + days)
                    set('trial_ends_at', d.toISOString().slice(0, 10))
                  }}
                  style={{ flex:1, minWidth:56, background:`${C.primary}15`, border:`1px solid ${C.primary}30`, borderRadius:8, padding:'7px 4px', fontSize:11, fontWeight:700, color:C.primary, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                >+{days}d</button>
              ))}
              {![7, 14, 30].includes(defaultTrialDays) && (
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + defaultTrialDays)
                    set('trial_ends_at', d.toISOString().slice(0, 10))
                  }}
                  style={{ flex:1, minWidth:56, background:`${C.success}15`, border:`1px solid ${C.success}40`, borderRadius:8, padding:'7px 4px', fontSize:11, fontWeight:700, color:C.success, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                >+{defaultTrialDays}d ★</button>
              )}
            </div>

            <input
              type="date"
              value={form.trial_ends_at}
              onChange={e => set('trial_ends_at', e.target.value)}
              style={inp}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
            <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Buttons set end date from today. Or pick a custom date above.</div>
          </div>
        )}

        <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22, cursor:'pointer' }}>
          <input type="checkbox" checked={form.is_admin} onChange={e => set('is_admin', e.target.checked)} style={{ width:16, height:16, accentColor:C.primary }} />
          <span style={{ fontSize:13, color:C.muted2, fontWeight:600 }}>Grant sysadmin access</span>
        </label>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={del} disabled={saving}
            style={{ flex:1, background:confirm ? C.danger+'20':'transparent', border:`1.5px solid ${C.danger}50`, borderRadius:12, padding:'12px', fontSize:13, fontWeight:700, color:C.danger, cursor:'pointer' }}>
            {confirm ? '⚠️ Confirm' : 'Delete'}
          </button>
          <button onClick={save} disabled={saving}
            style={{ flex:2, background:`linear-gradient(135deg,${C.primary},#0F766E)`, border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, color:'white', cursor:'pointer', opacity:saving ? 0.7:1 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SysAdminPage({ user }) {
  const navigate = useNavigate()
  const [tab,          setTab]          = useState('stats')
  const [stats,        setStats]        = useState(null)
  const [users,        setUsers]        = useState([])
  const [search,       setSearch]       = useState('')
  const [subSearch,    setSubSearch]    = useState('')
  const [planFilter,   setPlanFilter]   = useState('all')
  const [editUser,     setEditUser]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [error,        setError]        = useState(null)
  const [defaultTrialDays,  setDefaultTrialDays]  = useState(() => parseInt(localStorage.getItem('nx_admin_trial_days') ?? '7', 10))
  const [trialDaysInput,    setTrialDaysInput]    = useState(() => localStorage.getItem('nx_admin_trial_days') ?? '7')
  const [trialDaysSaved,    setTrialDaysSaved]    = useState(false)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) { navigate('/'); return }

    supabase.rpc('get_admin_stats')
      .then(({ data, error: e }) => {
        if (e) setError(e.message)
        else   setStats(data)
        setLoading(false)
      })
  }, []) // eslint-disable-line

  async function loadUsers() {
    if (users.length > 0) return
    setUsersLoading(true)
    const { data, error: e } = await adminGetAllUsers()
    if (!e && data) setUsers(data)
    setUsersLoading(false)
  }

  function switchTab(t) { setTab(t); if (t === 'users' || t === 'subscriptions') loadUsers() }

  async function handleSave(userId, updates) {
    // Convert trial_ends_at empty string to null
    if (updates.trial_ends_at === '') updates.trial_ends_at = null
    await adminUpdateProfile(userId, updates)
    setUsers(us => us.map(u => u.id === userId ? { ...u, ...updates } : u))
  }

  async function handleDelete(userId) {
    await adminDeleteProfile(userId)
    setUsers(us => us.filter(u => u.id !== userId))
  }

  function saveTrialDays() {
    const days = Math.max(1, parseInt(trialDaysInput, 10) || 7)
    localStorage.setItem('nx_admin_trial_days', String(days))
    setDefaultTrialDays(days)
    setTrialDaysSaved(true)
    setTimeout(() => setTrialDaysSaved(false), 2000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => !q || (u.email ?? '').toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q))
  }, [users, search])

  const subFiltered = useMemo(() => {
    const q = subSearch.toLowerCase()
    return users
      .filter(u => planFilter === 'all' || getEffectivePlan(u) === planFilter)
      .filter(u => !q || (u.email ?? '').toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q))
  }, [users, subSearch, planFilter])

  const statCards = stats ? [
    { icon:'👩‍🎓', label:'Total users',       value:stats.total_users,        color:C.primary  },
    { icon:'🆕',  label:'New this week',      value:stats.signups_this_week,  color:C.success  },
    { icon:'⚡',  label:'Sessions today',     value:stats.sessions_today,     color:C.warn     },
    { icon:'📅',  label:'Sessions this week', value:stats.sessions_this_week, color:C.primary  },
    { icon:'✅',  label:'Total sessions',     value:stats.total_sessions,     color:C.muted2   },
    { icon:'📝',  label:'Answers submitted',  value:stats.total_answers,      color:C.muted2   },
    { icon:'🧱',  label:'GCSE students',      value:stats.gcse_users,         color:C.gcse     },
    { icon:'🎯',  label:'A-Level students',   value:stats.alevel_users,       color:C.alevel   },
  ] : []

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Inter,sans-serif', color:C.navy }}>
      <style>{`*{box-sizing:border-box}input,select,button{font-family:inherit}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Top bar */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20, fontWeight:900 }}>Nexora <span style={{ color:C.primary }}>✦</span></span>
          <span style={{ background:C.primary+'20', color:C.primary, border:`1px solid ${C.primary}40`, borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:800, letterSpacing:'0.07em' }}>SYSADMIN</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:C.muted }}>{user?.email}</span>
          <button onClick={() => navigate('/')} style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 12px', color:C.muted, cursor:'pointer', fontSize:12 }}>← App</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', padding:'0 20px' }}>
        {[['stats','📊 Overview'],['users','👥 Users'],['subscriptions','💳 Subscriptions']].map(([key, label]) => (
          <button key={key} onClick={() => switchTab(key)}
            style={{ background:'transparent', border:'none', borderBottom: tab === key ? `2px solid ${C.primary}` : '2px solid transparent', padding:'12px 16px', fontSize:13, fontWeight:700, color: tab === key ? C.primary : C.muted, cursor:'pointer', transition:'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 16px' }}>

        {error && (
          <div style={{ background:C.danger+'15', border:`1px solid ${C.danger}40`, borderRadius:14, padding:'14px 16px', marginBottom:20, fontSize:13 }}>
            <span style={{ fontWeight:700, color:C.danger }}>⚠️ {error}</span>
            <div style={{ color:C.muted, marginTop:4, fontSize:12 }}>Run the SQL migration in Supabase → SQL Editor.</div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <>
            {loading && (
              <div style={{ textAlign:'center', marginTop:80 }}>
                <div style={{ fontSize:32, marginBottom:12, animation:'pulse 1.5s infinite' }}>📊</div>
                <div style={{ color:C.muted }}>Loading…</div>
              </div>
            )}
            {stats && (
              <div style={{ animation:'fadeUp 0.3s ease both' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:24 }}>
                  {statCards.map(s => <StatCard key={s.label} {...s} />)}
                </div>

                <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:14 }}>Engagement</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { label:'Avg answers / session', value: stats.total_sessions > 0 ? Math.round(stats.total_answers / stats.total_sessions) : 0 },
                      { label:'% active today',         value: stats.total_users > 0 ? Math.round((stats.sessions_today / stats.total_users) * 100) + '%' : '0%' },
                      { label:'GCSE / A-Level split',   value: `${stats.gcse_users} / ${stats.alevel_users}` },
                      { label:'New signups this week',  value: stats.signups_this_week },
                    ].map(r => (
                      <div key={r.label} style={{ background:C.bg, borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{r.label}</div>
                        <div style={{ fontSize:20, fontWeight:900, color:C.primary }}>{r.value ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background:C.primary+'15', border:`1px solid ${C.primary}30`, borderRadius:14, padding:'14px 16px', fontSize:13, color:C.primary, lineHeight:1.6 }}>
                  🚀 <strong>Beta phase</strong> — switch to <strong>Users</strong> to view and manage individual accounts.
                </div>

                {/* Platform Settings */}
                <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'20px', marginTop:16 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:16 }}>⚙️ Platform Settings</div>

                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.08em', marginBottom:6 }}>DEFAULT TRIAL PERIOD (DAYS)</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={trialDaysInput}
                        onChange={e => setTrialDaysInput(e.target.value)}
                        style={{ width:100, padding:'9px 12px', borderRadius:10, background:'#1E293B', border:`1.5px solid ${C.border}`, color:C.navy, fontSize:15, fontWeight:700, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif' }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                      <button
                        onClick={saveTrialDays}
                        style={{ background: trialDaysSaved ? C.success+'20' : `linear-gradient(135deg,${C.primary},#0F766E)`, border: trialDaysSaved ? `1.5px solid ${C.success}40` : 'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:800, color: trialDaysSaved ? C.success : 'white', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}
                      >
                        {trialDaysSaved ? '✓ Saved' : 'Save'}
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:8, lineHeight:1.6 }}>
                      Sets the default when granting or extending trials from the Users/Subscriptions tabs.
                      The quick-extend buttons in the edit modal use this value.
                    </div>
                  </div>

                  <div style={{ marginTop:14, padding:'10px 12px', background:C.bg, borderRadius:10, fontSize:11, color:C.muted, lineHeight:1.7 }}>
                    <strong style={{ color:C.muted2 }}>To apply to new signups automatically,</strong> run this in Supabase SQL Editor:
                    <code style={{ display:'block', marginTop:6, padding:'8px 10px', background:'#0D1117', borderRadius:8, fontSize:10, color:'#7DD3FC', letterSpacing:'0.02em', wordBreak:'break-all' }}>
                      {`UPDATE profiles SET trial_ends_at = created_at + INTERVAL '${defaultTrialDays} days' WHERE plan = 'trial' AND trial_ends_at IS NULL;`}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div style={{ animation:'fadeUp 0.3s ease both' }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <input
                placeholder="Search by email or name…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex:1, padding:'10px 14px', borderRadius:10, background:C.card, border:`1.5px solid ${C.border}`, color:C.navy, fontSize:14, outline:'none' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              {!usersLoading && users.length > 0 && (
                <span style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {usersLoading && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:28, animation:'pulse 1.5s infinite', marginBottom:8 }}>👥</div>
                <div style={{ color:C.muted, fontSize:13 }}>Loading users…</div>
              </div>
            )}

            {!usersLoading && users.length === 0 && (
              <div style={{ background:C.warn+'15', border:`1px solid ${C.warn}40`, borderRadius:14, padding:'16px 18px', fontSize:13, color:C.warn, lineHeight:1.7 }}>
                <strong>No users returned.</strong><br />
                Run the SQL migration in Supabase to enable the user list. See instructions below.
              </div>
            )}

            <div style={{ display:'grid', gap:8 }}>
              {filtered.map(u => (
                <div key={u.id} onClick={() => setEditUser(u)}
                  style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <Avatar name={u.display_name} email={u.email} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontWeight:800, color:C.navy, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {u.display_name ?? 'Student'}
                      </span>
                      {u.is_admin && (
                        <span style={{ background:C.primary+'25', color:C.primary, fontSize:9, fontWeight:800, padding:'1px 6px', borderRadius:6 }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                    <TrackPills user={u} />
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ fontSize:11, color:C.primary, fontWeight:700 }}>{u.xp ?? 0} XP</span>
                      <span style={{ fontSize:11, color:C.muted }}>🔥{u.streak ?? 0}</span>
                    </div>
                    <span style={{ fontSize:10, color:C.muted }}>Joined {timeAgo(u.created_at)}</span>
                    <span style={{ fontSize:10, color: u.last_sign_in_at ? '#10B981' : C.muted, fontWeight: u.last_sign_in_at ? 700 : 400 }}>
                      {u.last_sign_in_at ? `🕐 ${toIST(u.last_sign_in_at)}` : 'Never logged in'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTIONS TAB ── */}
        {tab === 'subscriptions' && (
          <div style={{ animation:'fadeUp 0.3s ease both' }}>

            {/* Plan summary row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8, marginBottom:20 }}>
              {Object.entries(PLANS).map(([key, p]) => {
                const count = users.filter(u => getEffectivePlan(u) === key).length
                return (
                  <div key={key} onClick={() => setPlanFilter(f => f === key ? 'all' : key)}
                    style={{ background: planFilter === key ? `${C.primary}20` : C.card, border:`1.5px solid ${planFilter === key ? C.primary : C.border}`, borderRadius:12, padding:'12px 14px', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:C.primary }}>{count}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{p.name}</div>
                  </div>
                )
              })}
            </div>

            {/* Search */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <input
                placeholder="Search by email or name…"
                value={subSearch} onChange={e => setSubSearch(e.target.value)}
                style={{ flex:1, padding:'10px 14px', borderRadius:10, background:C.card, border:`1.5px solid ${C.border}`, color:C.navy, fontSize:14, outline:'none' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              {planFilter !== 'all' && (
                <button onClick={() => setPlanFilter('all')} style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.muted, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                  Clear filter ×
                </button>
              )}
              {!usersLoading && <span style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>{subFiltered.length} user{subFiltered.length !== 1 ? 's' : ''}</span>}
            </div>

            {usersLoading && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:28, animation:'pulse 1.5s infinite', marginBottom:8 }}>💳</div>
                <div style={{ color:C.muted, fontSize:13 }}>Loading…</div>
              </div>
            )}

            <div style={{ display:'grid', gap:8 }}>
              {subFiltered.map(u => {
                const plan      = getEffectivePlan(u)
                const planMeta  = PLANS[plan] ?? PLANS.free
                const days      = trialDaysLeft(u)
                const trialBadge = u.plan === 'trial' && days > 0
                  ? `${days}d left`
                  : u.plan === 'trial' ? 'Expired' : null
                const planColor = planMeta.badgeColor ?? C.muted
                return (
                  <div key={u.id}
                    style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, transition:'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div onClick={() => setEditUser(u)} style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0, cursor:'pointer' }}>
                      <Avatar name={u.display_name} email={u.email} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, color:C.navy, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {u.display_name ?? 'Student'}
                        </div>
                        <div style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                      <span style={{ background:`${planColor}20`, color:planColor, border:`1px solid ${planColor}40`, borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800 }}>
                        {planMeta.badge}
                      </span>
                      {trialBadge && (
                        <span style={{ fontSize:10, color: days > 3 ? C.primary : C.warn, fontWeight:700 }}>{trialBadge}</span>
                      )}
                    </div>
                    {/* Welcome email button */}
                    <WelcomeEmailBtn user={u} C={C} />
                  </div>
                )
              })}
            </div>

            {!usersLoading && subFiltered.length === 0 && users.length > 0 && (
              <div style={{ textAlign:'center', padding:'32px', color:C.muted, fontSize:13 }}>No users match this filter.</div>
            )}
          </div>
        )}
      </div>

      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          defaultTrialDays={defaultTrialDays}
        />
      )}
    </div>
  )
}

const lbl = { display:'block', fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.08em', marginBottom:5 }
const inp = { width:'100%', padding:'10px 12px', borderRadius:10, background:'#1E293B', border:`1.5px solid ${C.border}`, color:C.navy, fontSize:14, outline:'none', transition:'border-color 0.2s', boxSizing:'border-box' }
