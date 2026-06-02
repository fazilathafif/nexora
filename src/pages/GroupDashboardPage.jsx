/**
 * GroupDashboardPage.jsx — Teacher / Parent group management portal
 * Route: /group/dashboard
 *
 * Accessible to users with role='teacher' or role='parent' who have a group.
 * Three tabs: My Group | Progress Overview | Billing & Seats
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { Shell, getColors } from './HomePage.jsx'
import { STREAM_CONFIG } from '../data/questions.js'
import { TRACK_COLORS, COURSERA_BLUE } from '../styles/courseraTokens.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return (
    <span style={{ background: bg ?? `${color}15`, border:`1px solid ${color}30`, borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:800, color, letterSpacing:'0.04em' }}>
      {label}
    </span>
  )
}

function StatCard({ icon, value, label, color, C }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px', textAlign:'center' }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:900, color: color ?? C.primary, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:4, fontWeight:600 }}>{label}</div>
    </div>
  )
}

// ── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated, C }) {
  const [form, setForm] = useState({ label:'', group_type:'class', seats_total:5 })
  const [tracks, setTracks] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const allTracks = Object.entries(STREAM_CONFIG).map(([id, cfg]) => ({
    id, label: cfg.label?.replace(' Track','').replace(' Prep','') ?? id.toUpperCase(), emoji: cfg.subjects?.[0]?.emoji ?? '📚',
  }))

  function toggleTrack(id) {
    setTracks(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])
  }

  async function create() {
    if (!form.label || !tracks.length) { setError('Enter a name and select at least one track.'); return }
    setSaving(true); setError(null)
    try {
      const { data, error: err } = await supabase.rpc('create_group', {
        p_label:       form.label,
        p_group_type:  form.group_type,
        p_tracks:      tracks,
        p_seats_total: parseInt(form.seats_total),
      })
      if (err) throw err
      onCreated(data)
    } catch (e) {
      setError(e?.message ?? 'Failed to create group')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:20 }}>Create a Group</div>

        <label style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Group Name</label>
        <input value={form.label} onChange={e => setForm(f => ({ ...f, label:e.target.value }))}
          placeholder='e.g. "Year 11 Maths" or "Smith Family"'
          style={{ width:'100%', padding:'10px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:13, color:'#1E293B', marginBottom:14, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />

        <label style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Group Type</label>
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {[['class','🏫','Class / School'],['family','👨‍👩‍👧','Family'],['tutor','📖','Tutor']].map(([val, emoji, label]) => (
            <button key={val} onClick={() => setForm(f => ({ ...f, group_type:val }))}
              style={{ flex:1, padding:'9px 4px', background: form.group_type===val ? COURSERA_BLUE : 'transparent', border:`1.5px solid ${form.group_type===val ? COURSERA_BLUE : '#E2E8F0'}`, borderRadius:9, fontSize:11, fontWeight:700, color: form.group_type===val ? 'white' : '#64748B', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              {emoji} {label}
            </button>
          ))}
        </div>

        <label style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Tracks Included</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14, maxHeight:200, overflowY:'auto' }}>
          {allTracks.map(t => {
            const accent = TRACK_COLORS[t.id] ?? COURSERA_BLUE
            const checked = tracks.includes(t.id)
            return (
              <button key={t.id} onClick={() => toggleTrack(t.id)}
                style={{ display:'flex', alignItems:'center', gap:10, background: checked ? `${accent}10` : 'white', border:`1.5px solid ${checked ? accent : '#E2E8F0'}`, borderRadius:10, padding:'9px 12px', cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
                <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, background: checked ? accent : 'white', border:`2px solid ${checked ? accent : '#CBD5E1'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {checked && <span style={{ fontSize:10, color:'white', fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:12 }}>{t.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#1E293B' }}>{t.label}</span>
                <span style={{ fontSize:11, color:'#94A3B8', marginLeft:'auto' }}>£4.99/student/mo</span>
              </button>
            )
          })}
        </div>

        <label style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Number of Seats</label>
        <input type="number" min={2} max={200} value={form.seats_total}
          onChange={e => setForm(f => ({ ...f, seats_total: e.target.value }))}
          style={{ width:'100%', padding:'10px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:13, color:'#1E293B', marginBottom:6, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <div style={{ fontSize:11, color:'#64748B', marginBottom:16 }}>
          Estimated cost: <strong style={{ color:COURSERA_BLUE }}>£{(tracks.length * 4.99 * parseInt(form.seats_total || 0)).toFixed(2)}/month</strong>
        </div>

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#DC2626', marginBottom:12 }}>{error}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', background:'transparent', border:'1.5px solid #E2E8F0', borderRadius:9, fontSize:13, fontWeight:700, color:'#64748B', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Cancel</button>
          <button onClick={create} disabled={saving || !form.label || !tracks.length}
            style={{ flex:2, padding:'12px', background: form.label && tracks.length ? COURSERA_BLUE : '#D1D5DB', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor: form.label && tracks.length ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: My Group ───────────────────────────────────────────────────────────

function MyGroupTab({ dashboard, groupId, C, navigate }) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('student')
  const [inviting, setInviting]       = useState(false)
  const [inviteLink, setInviteLink]   = useState(null)
  const [copied, setCopied]           = useState(false)
  const [joinCodeCopied, setJoinCodeCopied] = useState(false)

  if (!dashboard) return <div style={{ textAlign:'center', color:C.muted, padding:'40px', fontSize:13 }}>Loading…</div>

  const { group, members = [], stats = {} } = dashboard
  const pct = group.seats_total > 0 ? Math.round((group.seats_used / group.seats_total) * 100) : 0

  async function createInvite() {
    setInviting(true)
    const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
    const { error } = await supabase.from('group_invites').insert({
      group_id: groupId, email: inviteEmail || null, token, role: inviteRole,
      expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    if (!error) {
      const link = `${window.location.origin}/join/${token}`
      setInviteLink(link)
      setInviteEmail('')
    }
    setInviting(false)
  }

  function copyJoinCode() {
    navigator.clipboard.writeText(group.join_code)
    setJoinCodeCopied(true); setTimeout(() => setJoinCodeCopied(false), 2000)
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const ROLE_COLOR = { student:'#0056D2', teacher:'#7C3AED', parent:'#059669' }

  return (
    <div>
      {/* Group header card */}
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:16, padding:'18px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#1E293B', letterSpacing:'-0.3px' }}>{group.label ?? 'My Group'}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              {group.group_type === 'family' ? '👨‍👩‍👧 Family' : group.group_type === 'tutor' ? '📖 Tutor Group' : '🏫 Class'} · {group.tracks?.length ?? 0} track{group.tracks?.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Join Code</div>
            <button onClick={copyJoinCode}
              style={{ background: joinCodeCopied ? '#ECFDF5' : `${COURSERA_BLUE}10`, border:`1.5px solid ${joinCodeCopied ? '#10B981' : COURSERA_BLUE}40`, borderRadius:9, padding:'6px 14px', fontSize:14, fontWeight:900, color: joinCodeCopied ? '#10B981' : COURSERA_BLUE, cursor:'pointer', fontFamily:'Inter,sans-serif', letterSpacing:'0.1em' }}>
              {joinCodeCopied ? '✓ Copied' : group.join_code}
            </button>
          </div>
        </div>
        {/* Seat usage bar */}
        <div style={{ fontSize:11, color:C.muted, marginBottom:6, display:'flex', justifyContent:'space-between' }}>
          <span>Seats used</span>
          <span style={{ fontWeight:700, color: pct >= 90 ? '#EF4444' : '#1E293B' }}>{group.seats_used} / {group.seats_total}</span>
        </div>
        <div style={{ height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : COURSERA_BLUE, borderRadius:3, transition:'width 0.4s' }} />
        </div>
        {/* Tracks */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:12 }}>
          {(group.tracks ?? []).map(t => {
            const cfg = STREAM_CONFIG[t]
            const accent = TRACK_COLORS[t] ?? COURSERA_BLUE
            return <span key={t} style={{ background:`${accent}12`, border:`1px solid ${accent}30`, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:accent }}>{cfg?.subjects?.[0]?.emoji} {cfg?.label?.replace(' Track','').replace(' Prep','') ?? t}</span>
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:14 }}>
        <StatCard icon="👥" value={stats.member_count ?? 0}   label="Members"      C={C} />
        <StatCard icon="🔥" value={stats.avg_streak ?? 0}     label="Avg Streak"   C={C} color="#F97316" />
        <StatCard icon="⚡" value={stats.avg_xp ?? 0}         label="Avg XP"       C={C} color={COURSERA_BLUE} />
        <StatCard icon="✅" value={stats.active_today ?? 0}   label="Active Today" C={C} color="#10B981" />
      </div>

      {/* Invite section */}
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Invite Members</div>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          {['student','teacher','parent'].map(r => (
            <button key={r} onClick={() => setInviteRole(r)}
              style={{ flex:1, padding:'7px 4px', background: inviteRole===r ? ROLE_COLOR[r] : 'transparent', border:`1.5px solid ${ROLE_COLOR[r]}40`, borderRadius:8, fontSize:11, fontWeight:700, color: inviteRole===r ? 'white' : ROLE_COLOR[r], cursor:'pointer', fontFamily:'Inter,sans-serif', textTransform:'capitalize' }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder="Email (optional)" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            style={{ flex:1, padding:'9px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:13, color:'#1E293B', fontFamily:'Inter,sans-serif', outline:'none' }} />
          <button onClick={createInvite} disabled={inviting}
            style={{ padding:'9px 16px', background:COURSERA_BLUE, color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', flexShrink:0 }}>
            {inviting ? '…' : 'Generate Link'}
          </button>
        </div>
        {inviteLink && (
          <div style={{ marginTop:10, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:9, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, fontSize:11, color:'#065F46', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inviteLink}</div>
            <button onClick={copyInviteLink}
              style={{ flexShrink:0, padding:'5px 11px', background: copied ? '#10B981' : '#065F46', color:'white', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Member list */}
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Members ({members.length})
        </div>
        {members.length === 0 ? (
          <div style={{ padding:'24px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No members yet. Share the join code or invite link above.
          </div>
        ) : members.map((m, i) => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ width:36, height:36, borderRadius:18, background:`${COURSERA_BLUE}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:COURSERA_BLUE, flexShrink:0 }}>
              {(m.display_name || 'S')[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{m.display_name ?? 'Student'}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{m.email ?? ''} · {(m.streams ?? []).join(', ') || 'No tracks'}</div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#F97316' }}>🔥{m.streak}</span>
              <span style={{ fontSize:11, fontWeight:700, color:COURSERA_BLUE }}>⚡{m.xp}</span>
              <Badge label={m.role ?? 'student'} color={ROLE_COLOR[m.role ?? 'student']} />
              {m.last_active_date === new Date().toISOString().split('T')[0] && (
                <Badge label="Active" color="#10B981" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 2: Progress Overview ──────────────────────────────────────────────────

function ProgressTab({ dashboard, C }) {
  if (!dashboard) return <div style={{ textAlign:'center', color:C.muted, padding:'40px', fontSize:13 }}>Loading…</div>
  const { members = [] } = dashboard
  if (!members.length) return <div style={{ textAlign:'center', color:C.muted, padding:'40px', fontSize:13 }}>No members yet.</div>

  return (
    <div>
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Member Progress
        </div>
        {members.map((m, i) => {
          const streakPct = Math.min(100, (m.streak / 30) * 100)
          const xpPct     = Math.min(100, (m.xp / 1000) * 100)
          return (
            <div key={m.id} style={{ padding:'14px 16px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:32, height:32, borderRadius:16, background:`${COURSERA_BLUE}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:COURSERA_BLUE, flexShrink:0 }}>
                  {(m.display_name || 'S')[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{m.display_name ?? 'Student'}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{(m.streams ?? []).join(', ') || 'No tracks'}</div>
                </div>
                <div style={{ fontSize:11, color:C.muted, textAlign:'right' }}>
                  {m.last_active_date ? new Date(m.last_active_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : 'Never'}
                </div>
              </div>
              {/* Streak bar */}
              <div style={{ marginBottom:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginBottom:2 }}>
                  <span>🔥 Streak</span><span>{m.streak} days</span>
                </div>
                <div style={{ height:4, background:'#F1F5F9', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${streakPct}%`, background:'#F97316', borderRadius:2 }} />
                </div>
              </div>
              {/* XP bar */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginBottom:2 }}>
                  <span>⚡ XP</span><span>{m.xp} pts</span>
                </div>
                <div style={{ height:4, background:'#F1F5F9', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${xpPct}%`, background:COURSERA_BLUE, borderRadius:2 }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 3: Billing & Seats ────────────────────────────────────────────────────

function BillingTab({ dashboard, C, navigate }) {
  if (!dashboard) return null
  const { group } = dashboard
  const monthly = (group.tracks?.length ?? 0) * 4.99 * (group.seats_total ?? 0)

  return (
    <div>
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'18px', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Current Plan</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#1E293B' }}>Group Plan — {group.group_type === 'family' ? 'Family' : 'Class/Tutor'}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{group.seats_total} seats · {group.tracks?.length ?? 0} track{group.tracks?.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:900, color:COURSERA_BLUE }}>£{monthly.toFixed(2)}</div>
            <div style={{ fontSize:11, color:C.muted }}>per month</div>
          </div>
        </div>
        <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px' }}>
          {(group.tracks ?? []).map(t => {
            const cfg = STREAM_CONFIG[t]
            return (
              <div key={t} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'#1E293B', fontWeight:600 }}>{cfg?.subjects?.[0]?.emoji} {cfg?.label?.replace(' Track','') ?? t}</span>
                <span style={{ color:C.muted }}>£4.99 × {group.seats_total} = £{(4.99 * (group.seats_total ?? 0)).toFixed(2)}/mo</span>
              </div>
            )
          })}
          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800, color:'#1E293B' }}>
            <span>Total</span><span>£{monthly.toFixed(2)}/month</span>
          </div>
        </div>
      </div>

      <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:14, padding:'16px', marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#1D4ED8', marginBottom:6 }}>Stripe Billing</div>
        <div style={{ fontSize:12, color:'#3730A3', lineHeight:1.6, marginBottom:12 }}>
          Payment is managed through Stripe. To add seats, change tracks, or cancel, go to the Stripe Customer Portal.
        </div>
        <button
          onClick={() => navigate('/ib/subscription')}
          style={{ width:'100%', padding:'11px', background:'#1D4ED8', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          Manage Billing →
        </button>
      </div>

      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px' }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Pricing Formula</div>
        <div style={{ fontSize:12, color:'#475569', lineHeight:1.8 }}>
          <div>• £4.99 per track · per student · per month</div>
          <div>• Minimum 2 seats (family) or 5 seats (class)</div>
          <div>• All members get unlimited questions, mock exams, AI explanations</div>
          <div>• Cancel anytime — no lock-in</div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GroupDashboardPage({ user, profile, isDark }) {
  const navigate  = useNavigate()
  const stream    = profile?.active_stream ?? profile?.stream ?? 'gcse'
  const C         = getColors(stream, null, isDark)

  const [tab,          setTab]          = useState('group')
  const [dashboard,    setDashboard]    = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [error,        setError]        = useState(null)

  const groupId    = profile?.group_id
  const isGroupAdmin = ['teacher','parent','admin'].includes(profile?.role) && !!groupId

  async function loadDashboard() {
    if (!groupId) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error: err } = await supabase.rpc('get_group_dashboard', { p_group_id: groupId })
      if (err) throw err
      setDashboard(data)
    } catch (e) {
      setError(e?.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadDashboard() }, [groupId])

  // Gate: must be signed in
  if (!user?.id) {
    return (
      <Shell C={C} isDark={isDark}>
        <div style={{ textAlign:'center', padding:'60px 24px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
          <div style={{ fontSize:16, fontWeight:800, color:C.navy, marginBottom:8 }}>Sign in required</div>
          <button onClick={() => navigate('/')} style={{ background:C.primary, color:'white', border:'none', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Sign In →</button>
        </div>
      </Shell>
    )
  }

  const TABS = [
    { id:'group',    label:'My Group',  icon:'👥' },
    { id:'progress', label:'Progress',  icon:'📊' },
    { id:'billing',  label:'Billing',   icon:'💳' },
  ]

  return (
    <Shell C={C} isDark={isDark}>
      <button onClick={() => navigate(`/${stream}`)}
        style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, fontWeight:700, padding:0, fontFamily:'Inter,sans-serif', marginBottom:16 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:'-0.4px', fontFamily:"'Playfair Display',Georgia,serif" }}>
            Group Dashboard
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
            {profile?.role === 'parent' ? 'Family plan' : 'Teacher / class plan'} · manage members & progress
          </div>
        </div>
        {!groupId && (
          <button onClick={() => setShowCreate(true)}
            style={{ background:C.primary, color:'white', border:'none', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            + Create Group
          </button>
        )}
      </div>

      {/* No group yet */}
      {!groupId && !loading && (
        <div style={{ textAlign:'center', padding:'40px 24px', background:'white', border:`1px solid ${C.border}`, borderRadius:16 }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🏫</div>
          <div style={{ fontSize:16, fontWeight:800, color:C.navy, marginBottom:8 }}>No group yet</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6, maxWidth:320, margin:'0 auto 20px' }}>
            Create a group to manage your students or family members, track their progress, and share a group subscription.
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ background:C.primary, color:'white', border:'none', borderRadius:12, padding:'13px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Create Group →
          </button>
        </div>
      )}

      {/* Dashboard */}
      {groupId && (
        <>
          {/* Tab bar */}
          <div style={{ display:'flex', gap:4, background:'#F1F5F9', borderRadius:14, padding:4, marginBottom:20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'9px 4px', background: tab===t.id ? 'white' : 'transparent', border:'none', borderRadius:10, fontSize:12, fontWeight: tab===t.id ? 800 : 600, color: tab===t.id ? C.primary : '#94A3B8', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow: tab===t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition:'all 0.18s' }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {tab === 'group'    && <MyGroupTab    dashboard={dashboard} groupId={groupId} C={C} navigate={navigate} />}
          {tab === 'progress' && <ProgressTab   dashboard={dashboard} C={C} />}
          {tab === 'billing'  && <BillingTab    dashboard={dashboard} C={C} navigate={navigate} />}
        </>
      )}

      {/* Join by code */}
      {!groupId && !loading && (
        <JoinByCode C={C} onJoined={loadDashboard} />
      )}

      {showCreate && (
        <CreateGroupModal
          C={C}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); window.location.reload() }}
        />
      )}
    </Shell>
  )
}

// ── Join by code (shown when user has no group) ───────────────────────────────

function JoinByCode({ C, onJoined }) {
  const [code, setCode]   = useState('')
  const [joining, setJoining] = useState(false)
  const [result, setResult]   = useState(null)

  async function join() {
    if (!code.trim()) return
    setJoining(true); setResult(null)
    const { data, error } = await supabase.rpc('join_group_by_code', { p_join_code: code.trim() })
    if (error || data?.error) {
      setResult({ error: data?.error ?? error?.message })
    } else {
      setResult({ success: true, label: data.label })
      setTimeout(onJoined, 1200)
    }
    setJoining(false)
  }

  return (
    <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginTop:14 }}>
      <div style={{ fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Have a join code?</div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 8-character code…"
          style={{ flex:1, padding:'9px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:13, color:'#1E293B', fontFamily:'Inter,sans-serif', outline:'none', letterSpacing:'0.1em', fontWeight:700 }} />
        <button onClick={join} disabled={joining || !code.trim()}
          style={{ padding:'9px 16px', background: code.trim() ? COURSERA_BLUE : '#D1D5DB', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor: code.trim() ? 'pointer' : 'default', fontFamily:'Inter,sans-serif', flexShrink:0 }}>
          {joining ? '…' : 'Join'}
        </button>
      </div>
      {result?.error   && <div style={{ marginTop:8, fontSize:12, color:'#DC2626' }}>{result.error}</div>}
      {result?.success && <div style={{ marginTop:8, fontSize:12, color:'#10B981', fontWeight:700 }}>✓ Joined "{result.label}"</div>}
    </div>
  )
}
