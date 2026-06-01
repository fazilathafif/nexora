/**
 * IBSandboxPage.jsx — IB Survival Sandbox workspace
 * Route: /ib/sandbox
 *
 * Three tabs: IA Blueprinting | CAS Linker | Deadline Calendar
 * Gated: IB track + non-free plan + VITE_IB_SANDBOX_ENABLED=true
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell, getColors } from './HomePage.jsx'
import { getEffectivePlan } from '../lib/subscription.js'
import { getQuestions, STREAM_CONFIG } from '../data/questions.js'
import { supabase } from '../lib/supabase.js'

const FEATURE_FLAG = import.meta.env.VITE_IB_SANDBOX_ENABLED === 'true'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

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

const IB_SUBJECTS = STREAM_CONFIG.ib?.subjects?.filter(s => !s.deprecated) ?? []

const ASSESSMENT_TYPES = [
  { value:'ia_draft',       label:'IA Draft' },
  { value:'ia_final',       label:'IA Final Submission' },
  { value:'ee_draft',       label:'Extended Essay Draft' },
  { value:'ee_final',       label:'EE Final Submission' },
  { value:'tok_essay',      label:'ToK Essay' },
  { value:'tok_exhibition', label:'ToK Exhibition' },
  { value:'mock',           label:'Mock Exam' },
  { value:'other',          label:'Other' },
]

// ── IA Blueprinting Tab ───────────────────────────────────────────────────────

function IABlueprinting({ userId, navigate, C }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ subject_id:'', syllabus_topic_id:'', title:'', rq:'', due_date:'' })
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase.from('sb_ia_tracker').select('*').eq('user_id', userId).order('created_at')
      setItems(data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  async function save() {
    if (!form.subject_id) return
    setSaving(true)
    try {
      await supabase.from('sb_ia_tracker').upsert({
        user_id: userId, ...form, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject_id' })
      await load()
      setForm({ subject_id:'', syllabus_topic_id:'', title:'', rq:'', due_date:'' })
    } catch {}
    setSaving(false)
  }

  async function toggleMilestone(itemId, milestoneIdx, currentFlags) {
    const updated = { ...currentFlags, [milestoneIdx]: !currentFlags[milestoneIdx] }
    await supabase.from('sb_ia_tracker').update({ milestone_flags: updated, updated_at: new Date().toISOString() }).eq('id', itemId)
    await load()
  }

  const subj = IB_SUBJECTS.find(s => s.id === form.subject_id)
  const topicsForSubject = subj ? [...new Set(getQuestions('ib', form.subject_id).map(q => q.topic))] : []

  return (
    <div>
      {/* Add / Edit form */}
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Add IA Subject</div>
        <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id:e.target.value, syllabus_topic_id:'' }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none' }}>
          <option value="">Choose IB subject…</option>
          {IB_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
        </select>
        {topicsForSubject.length > 0 && (
          <select value={form.syllabus_topic_id} onChange={e => setForm(p => ({ ...p, syllabus_topic_id:e.target.value }))}
            style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none' }}>
            <option value="">Choose syllabus topic…</option>
            {topicsForSubject.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <input placeholder="IA Title (optional)" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <input placeholder="Research question…" value={form.rq} onChange={e => setForm(p => ({ ...p, rq:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:10, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <button onClick={save} disabled={saving || !form.subject_id}
          style={{ width:'100%', background: saving || !form.subject_id ? '#D1D5DB' : C.primary, color:'white', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor: form.subject_id ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>
          {saving ? 'Saving…' : '+ Add IA Subject'}
        </button>
      </div>

      {/* IA items */}
      {loading ? <div style={{ textAlign:'center', color:C.muted, padding:'20px', fontSize:13 }}>Loading…</div> : items.length === 0 ? (
        <div style={{ textAlign:'center', color:C.muted, padding:'20px', fontSize:13 }}>No IA subjects yet. Add one above.</div>
      ) : items.map(item => {
        const subj = IB_SUBJECTS.find(s => s.id === item.subject_id)
        const completedCount = Object.values(item.milestone_flags ?? {}).filter(Boolean).length
        const pct = Math.round((completedCount / IA_MILESTONES.length) * 100)
        const isOpen = selected === item.id
        return (
          <div key={item.id} style={{ background:'white', border:`1.5px solid ${C.border}`, borderRadius:14, marginBottom:10, overflow:'hidden' }}>
            <button onClick={() => setSelected(p => p === item.id ? null : item.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'white', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
              <span style={{ fontSize:20 }}>{subj?.emoji ?? '📚'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.navy }}>{subj?.label ?? item.subject_id}</div>
                {item.title && <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{item.title}</div>}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color: pct === 100 ? '#10B981' : pct > 50 ? '#F59E0B' : C.primary }}>{pct}%</div>
                <div style={{ fontSize:9, color:C.muted }}>{completedCount}/{IA_MILESTONES.length}</div>
              </div>
              <span style={{ fontSize:12, color:C.muted, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
            </button>
            {isOpen && (
              <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}` }}>
                {item.rq && <div style={{ fontSize:12, color:C.muted, padding:'10px 0 8px', lineHeight:1.5, fontStyle:'italic' }}>"{item.rq}"</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                  {IA_MILESTONES.map((m, i) => {
                    const done = !!item.milestone_flags?.[i]
                    return (
                      <button key={i} onClick={() => toggleMilestone(item.id, i, item.milestone_flags ?? {})}
                        style={{ display:'flex', alignItems:'center', gap:10, background: done ? '#ECFDF5' : C.bg, border:`1px solid ${done ? '#10B98140' : C.border}`, borderRadius:9, padding:'9px 12px', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left' }}>
                        <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background: done ? '#10B981' : 'white', border:`2px solid ${done ? '#10B981' : '#CBD5E1'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {done && <span style={{ fontSize:11, color:'white', fontWeight:900 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color: done ? '#065F46' : C.navy, flex:1 }}>{m}</span>
                      </button>
                    )
                  })}
                </div>
                {/* Launch quiz for this IA topic */}
                {item.syllabus_topic_id && (
                  <button onClick={() => navigate(`/ib/quiz/${item.subject_id}?topic=${encodeURIComponent(item.syllabus_topic_id)}`)}
                    style={{ marginTop:12, width:'100%', background:C.primary, color:'white', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    🎯 Practice "{item.syllabus_topic_id}" questions →
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── CAS Linker Tab ────────────────────────────────────────────────────────────

const UNI_PROMPTS = [
  'Describe a challenge you overcame',
  'Tell us about a leadership experience',
  'How have you contributed to your community?',
  'Describe a creative project you are proud of',
  'How do you balance academic and extracurricular commitments?',
]

function CASLinker({ userId, C }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ pillar:'creativity', activity_name:'', hours_logged:0, learning_outcome:'', uni_prompt_hook:'' })
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!userId) return
    const { data } = await supabase.from('sb_cas_linker').select('*').eq('user_id', userId).order('created_at', { ascending:false })
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [userId])

  async function save() {
    if (!form.activity_name) return
    setSaving(true)
    await supabase.from('sb_cas_linker').insert({ user_id: userId, ...form, updated_at: new Date().toISOString() })
    await load()
    setForm({ pillar:'creativity', activity_name:'', hours_logged:0, learning_outcome:'', uni_prompt_hook:'' })
    setSaving(false)
  }

  async function del(id) {
    await supabase.from('sb_cas_linker').delete().eq('id', id)
    await load()
  }

  const PILLAR_META = { creativity:{ emoji:'🎨', color:'#7C3AED' }, activity:{ emoji:'⚽', color:'#0056D2' }, service:{ emoji:'🤝', color:'#059669' } }

  return (
    <div>
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Link CAS to University Applications</div>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          {['creativity','activity','service'].map(p => {
            const m = PILLAR_META[p]
            return (
              <button key={p} onClick={() => setForm(f => ({ ...f, pillar:p }))}
                style={{ flex:1, padding:'8px 0', background: form.pillar === p ? m.color : 'transparent', border:`1.5px solid ${m.color}40`, borderRadius:8, fontSize:11, fontWeight:700, color: form.pillar === p ? 'white' : m.color, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                {m.emoji} {p}
              </button>
            )
          })}
        </div>
        <input placeholder="Activity name…" value={form.activity_name} onChange={e => setForm(p => ({ ...p, activity_name:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <input type="number" min={0} step={0.5} placeholder="Hours" value={form.hours_logged}
            onChange={e => setForm(p => ({ ...p, hours_logged: parseFloat(e.target.value) || 0 }))}
            style={{ width:80, padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, fontFamily:'Inter,sans-serif', outline:'none' }} />
          <select value={form.uni_prompt_hook} onChange={e => setForm(p => ({ ...p, uni_prompt_hook:e.target.value }))}
            style={{ flex:1, padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, fontFamily:'Inter,sans-serif', outline:'none' }}>
            <option value="">Link to uni prompt (optional)…</option>
            {UNI_PROMPTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <input placeholder="IB Learning Outcome (optional)…" value={form.learning_outcome} onChange={e => setForm(p => ({ ...p, learning_outcome:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:10, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <button onClick={save} disabled={saving || !form.activity_name}
          style={{ width:'100%', background: form.activity_name ? C.primary : '#D1D5DB', color:'white', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor: form.activity_name ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>
          {saving ? 'Linking…' : '+ Link Activity'}
        </button>
      </div>

      {items.map(item => {
        const m = PILLAR_META[item.pillar] ?? PILLAR_META.creativity
        return (
          <div key={item.id} style={{ background:'white', border:`1.5px solid ${m.color}30`, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:10 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{m.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{item.activity_name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{item.hours_logged}h · {item.pillar}</div>
              {item.uni_prompt_hook && <div style={{ fontSize:11, color:m.color, marginTop:4, fontStyle:'italic' }}>"{item.uni_prompt_hook}"</div>}
              {item.learning_outcome && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>LO: {item.learning_outcome}</div>}
            </div>
            <button onClick={() => del(item.id)} style={{ background:'none', border:'none', color:C.muted, fontSize:16, cursor:'pointer' }}>×</button>
          </div>
        )
      })}
    </div>
  )
}

// ── Deadline Calendar Tab ─────────────────────────────────────────────────────

function DeadlineCalendar({ userId, C, onStressChange }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title:'', deadline_date:'', assessment_type:'ia_draft', stress_weight:3, subject_id:'', notes:'' })
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!userId) return
    const { data } = await supabase.from('sb_assessment_deadline').select('*').eq('user_id', userId).order('deadline_date')
    setItems(data ?? [])
    // Compute stress index for interceptor
    const today = new Date(); today.setHours(0,0,0,0)
    const in7  = new Date(today); in7.setDate(today.getDate() + 7)
    const upcoming = (data ?? []).filter(d => !d.completed && new Date(d.deadline_date) >= today && new Date(d.deadline_date) <= in7)
    const S = upcoming.reduce((s, d) => s + (d.stress_weight ?? 0), 0)
    onStressChange?.(S)
  }

  useEffect(() => { load() }, [userId])

  async function save() {
    if (!form.title || !form.deadline_date) return
    setSaving(true)
    await supabase.from('sb_assessment_deadline').insert({ user_id: userId, ...form, updated_at: new Date().toISOString() })
    await load()
    setForm({ title:'', deadline_date:'', assessment_type:'ia_draft', stress_weight:3, subject_id:'', notes:'' })
    setSaving(false)
  }

  async function toggle(id, completed) {
    await supabase.from('sb_assessment_deadline').update({ completed: !completed, updated_at: new Date().toISOString() }).eq('id', id)
    await load()
  }

  const STRESS_COLORS = { 1:'#10B981', 2:'#84CC16', 3:'#F59E0B', 4:'#EF4444', 5:'#991B1B' }

  return (
    <div>
      <div style={{ background:'white', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Add Deadline</div>
        <input placeholder="Deadline title…" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, marginBottom:8, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <input type="date" value={form.deadline_date} onChange={e => setForm(p => ({ ...p, deadline_date:e.target.value }))}
            style={{ flex:1, padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, fontFamily:'Inter,sans-serif', outline:'none' }} />
          <select value={form.assessment_type} onChange={e => setForm(p => ({ ...p, assessment_type:e.target.value }))}
            style={{ flex:1, padding:'9px 12px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.navy, background:C.bg, fontFamily:'Inter,sans-serif', outline:'none' }}>
            {ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Stress Weight: {form.stress_weight}/5</div>
          <div style={{ display:'flex', gap:4 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm(p => ({ ...p, stress_weight:n }))}
                style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', background: form.stress_weight >= n ? STRESS_COLORS[n] : '#F1F5F9', color: form.stress_weight >= n ? 'white' : '#94A3B8', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving || !form.title || !form.deadline_date}
          style={{ width:'100%', background: form.title && form.deadline_date ? C.primary : '#D1D5DB', color:'white', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor: form.title && form.deadline_date ? 'pointer' : 'default', fontFamily:'Inter,sans-serif' }}>
          {saving ? 'Saving…' : '+ Add Deadline'}
        </button>
      </div>

      {items.map(item => {
        const daysLeft = Math.ceil((new Date(item.deadline_date) - new Date()) / 86400000)
        const urgent   = daysLeft <= 7 && !item.completed
        return (
          <div key={item.id} style={{ background: item.completed ? '#F0FDF4' : 'white', border:`1.5px solid ${urgent ? STRESS_COLORS[item.stress_weight] : item.completed ? '#10B98130' : C.border}`, borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => toggle(item.id, item.completed)}
              style={{ width:22, height:22, borderRadius:6, flexShrink:0, background: item.completed ? '#10B981' : 'white', border:`2px solid ${item.completed ? '#10B981' : '#CBD5E1'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none' }}>
              {item.completed && <span style={{ fontSize:12, color:'white', fontWeight:900 }}>✓</span>}
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color: item.completed ? '#065F46' : C.navy, textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {new Date(item.deadline_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                {!item.completed && ` · ${daysLeft > 0 ? `${daysLeft}d left` : 'Due today!'}`}
              </div>
            </div>
            <div style={{ width:10, height:10, borderRadius:5, background: STRESS_COLORS[item.stress_weight], flexShrink:0 }} title={`Stress: ${item.stress_weight}/5`} />
          </div>
        )
      })}
    </div>
  )
}

// ── Stress Interceptor Banner ─────────────────────────────────────────────────

function StressBanner({ stressIndex, C }) {
  if (stressIndex <= 8) return null
  return (
    <div style={{
      background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)',
      border:'1.5px solid #F59E0B50', borderRadius:14,
      padding:'14px 16px', marginBottom:16,
      display:'flex', alignItems:'flex-start', gap:12,
    }}>
      <span style={{ fontSize:22, flexShrink:0 }}>⚡</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:800, color:'#92400E', marginBottom:4 }}>
          De-stress Target Adjuster Active
        </div>
        <div style={{ fontSize:12, color:'#B45309', lineHeight:1.6 }}>
          Your weekly stress index is <strong>{stressIndex}</strong> (threshold: 8).
          Your daily practice target has been automatically reduced by <strong>50%</strong> to protect your wellbeing.
          Focus on your most urgent deadlines first.
        </div>
      </div>
    </div>
  )
}

// ── Coursework Question Recommender Widget ────────────────────────────────────

export function CourseWorkRecommenderWidget({ recommendations, navigate, C }) {
  const [idx, setIdx] = useState(0)
  if (!recommendations?.length) return null
  const rec = recommendations[idx]
  return (
    <div style={{ background:'white', border:`1.5px solid ${C.primary}30`, borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>
        🧪 IA Practice Recommender ({idx + 1}/{recommendations.length})
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:4 }}>{rec.ia_title}</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Topic: {rec.syllabus_topic_id}</div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => navigate(rec.quiz_launch_url)}
          style={{ flex:1, background:C.primary, color:'white', border:'none', borderRadius:9, padding:'9px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          Practice this topic →
        </button>
        {recommendations.length > 1 && (
          <button onClick={() => setIdx(p => (p + 1) % recommendations.length)}
            style={{ padding:'9px 12px', background:'transparent', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:12, fontWeight:700, color:C.muted, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Next ›
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IBSandboxPage({ user, profile, isDark }) {
  const navigate = useNavigate()
  const C        = getColors('ib', null, isDark)

  // Gate: feature flag + IB track + paid plan
  const plan     = getEffectivePlan(profile)
  const isIBUser = profile?.streams?.includes('ib') || profile?.active_stream === 'ib' || profile?.stream === 'ib'

  if (!FEATURE_FLAG || !isIBUser || plan === 'free') {
    return (
      <Shell C={C} isDark={isDark}>
        <div style={{ textAlign:'center', padding:'60px 24px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
          <div style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:8 }}>IB Survival Sandbox</div>
          <div style={{ fontSize:14, color:C.muted, marginBottom:24, lineHeight:1.6 }}>
            {!isIBUser ? 'This feature is for IB Diploma students only.' : !FEATURE_FLAG ? 'Coming soon.' : 'Upgrade to access the IB Survival Sandbox.'}
          </div>
          <button onClick={() => navigate('/ib/subscription')}
            style={{ background:C.primary, color:'white', border:'none', borderRadius:12, padding:'13px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            {plan === 'free' ? 'Upgrade →' : 'Go to IB Track →'}
          </button>
        </div>
      </Shell>
    )
  }

  const [tab, setTab]           = useState('ia')
  const [stressIndex, setStressIndex] = useState(0)

  const TABS = [
    { id:'ia',       label:'IA Blueprinting', icon:'📋' },
    { id:'cas',      label:'CAS Linker',       icon:'🌱' },
    { id:'deadlines',label:'Deadlines',         icon:'📅' },
  ]

  return (
    <Shell C={C} isDark={isDark}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <button onClick={() => navigate('/ib/learn-hub')}
          style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, fontWeight:700, padding:0, fontFamily:'Inter,sans-serif', marginBottom:12 }}>
          ← Back to Learn Hub
        </button>
        <div style={{ fontSize:24, fontWeight:900, color:C.navy, letterSpacing:'-0.4px', fontFamily:"'Playfair Display', Georgia, serif" }}>
          IB Survival Sandbox
        </div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>IA blueprinting · CAS linker · Deadline management</div>
      </div>

      {/* Stress interceptor banner */}
      <StressBanner stressIndex={stressIndex} C={C} />

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, background:'#F1F5F9', borderRadius:14, padding:4, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'9px 4px', background: tab === t.id ? 'white' : 'transparent', border:'none', borderRadius:10, fontSize:12, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? C.primary : '#94A3B8', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition:'all 0.18s' }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'ia'        && <IABlueprinting   userId={user?.id} navigate={navigate} C={C} />}
      {tab === 'cas'       && <CASLinker         userId={user?.id} C={C} />}
      {tab === 'deadlines' && <DeadlineCalendar  userId={user?.id} C={C} onStressChange={setStressIndex} />}
    </Shell>
  )
}
