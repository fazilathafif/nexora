import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export default function SysAdminPage({ user }) {
  const navigate  = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Guard — only the admin email can view this page
  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) { navigate('/'); return }

    supabase.rpc('get_admin_stats')
      .then(({ data, error: e }) => {
        if (e) setError(e.message)
        else   setStats(data)
        setLoading(false)
      })
  }, [user]) // eslint-disable-line

  const C = {
    bg:'#0A0A14', card:'#0F172A', border:'#1E293B',
    primary:'#0D9488', navy:'#F8FAFC', muted:'#94A3B8',
    success:'#4ADE80', warn:'#F59E0B', danger:'#EF4444',
  }

  const statCards = stats ? [
    { label:'Total Users',       val: stats.total_users,        icon:'👩‍🎓', color: C.primary },
    { label:'Sessions (all)',     val: stats.total_sessions,     icon:'✅', color: C.success },
    { label:'Sessions Today',     val: stats.sessions_today,     icon:'⚡', color: C.warn },
    { label:'Sessions This Week', val: stats.sessions_this_week, icon:'📅', color: C.primary },
    { label:'Answers Submitted',  val: stats.total_answers,      icon:'📝', color: C.muted },
    { label:'GCSE Students',      val: stats.gcse_users,         icon:'🧱', color:'#0F766E' },
    { label:'A-Level Students',   val: stats.alevel_users,       icon:'🎯', color:'#4F46E5' },
    { label:'New This Week',      val: stats.signups_this_week,  icon:'🆕', color: C.success },
  ] : []

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Georgia,serif',color:C.navy}}>
      <style>{`*{box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:22,fontWeight:900,color:C.navy}}>Nexora <span style={{color:C.primary}}>✦</span></span>
          <span style={{background:C.primary+'20',color:C.primary,border:`1px solid ${C.primary}40`,borderRadius:20,padding:'3px 12px',fontSize:11,fontWeight:800,letterSpacing:'0.07em'}}>SYSADMIN</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:12,color:C.muted}}>{user?.email}</span>
          <button
            onClick={() => navigate('/')}
            style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'5px 14px',color:C.muted,cursor:'pointer',fontSize:12,fontFamily:'Georgia,serif'}}
          >
            ← App
          </button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'28px 20px'}}>

        {loading && (
          <div style={{textAlign:'center',marginTop:80}}>
            <div style={{fontSize:32,marginBottom:12,animation:'pulse 1.5s infinite'}}>📊</div>
            <div style={{color:C.muted}}>Loading stats…</div>
          </div>
        )}

        {error && (
          <div style={{textAlign:'center',marginTop:80}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{color:C.danger,fontWeight:700}}>Failed to load stats</div>
            <div style={{fontSize:13,color:C.muted,marginTop:6}}>{error}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:8}}>
              Make sure the <code>get_admin_stats</code> SQL function is deployed.
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Stat grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:28}}>
              {statCards.map(s => (
                <div key={s.label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'18px 16px',textAlign:'center'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:28,fontWeight:900,color:s.color}}>{s.val ?? '–'}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Engagement summary */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'20px 22px',marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:800,color:C.navy,marginBottom:14}}>Engagement</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  { label:'Avg answers per session', val: stats.total_sessions > 0 ? Math.round(stats.total_answers / stats.total_sessions) : 0 },
                  { label:'% active today', val: stats.total_users > 0 ? Math.round((stats.sessions_today / stats.total_users) * 100) + '%' : '0%' },
                  { label:'GCSE vs A-Level split', val: stats.gcse_users + ' / ' + stats.alevel_users },
                  { label:'New users this week', val: stats.signups_this_week },
                ].map(r => (
                  <div key={r.label} style={{background:C.bg,borderRadius:10,padding:'12px 14px'}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{r.label}</div>
                    <div style={{fontSize:18,fontWeight:900,color:C.primary}}>{r.val ?? '–'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Beta feedback nudge */}
            <div style={{background:C.primary+'15',border:`1px solid ${C.primary}30`,borderRadius:14,padding:'14px 18px',fontSize:13,color:C.primary,lineHeight:1.6}}>
              🚀 <strong>Beta phase</strong> — share the link with more students to grow the user base.
              Each session adds to the stats above in real time.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
