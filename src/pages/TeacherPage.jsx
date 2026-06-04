/**
 * TeacherPage — public, token-gated dashboard for teachers.
 * URL: /teacher/:token
 * No teacher login needed — share a link, it works.
 *
 * The token maps to a teacher_id in Supabase via the
 * get_class_summary RPC function.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getClassSummary } from '../lib/db.js'

export default function TeacherPage() {
  const { token }   = useParams()
  const [data,  setData]  = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getClassSummary(token).then(({ data: d, error: e }) => {
      if (e) setError('Invalid or expired link.')
      else   setData(d)
    })
  }, [token])

  const C = {
    primary:'#0F766E', navy:'#134E4A', muted:'#6B7280',
    card:'#FFFFFF', border:'#D1FAE5', bg:'#F0FDFA',
    success:'#10B981', danger:'#EF4444',
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Inter,sans-serif',padding:'0 0 60px'}}>
      <style>{`*{box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header bar */}
      <div style={{background:'white',borderBottom:`1px solid ${C.border}`,padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <span style={{fontSize:20,fontWeight:900,color:C.navy}}>Nexora</span>
          <span style={{marginLeft:10,fontSize:12,color:C.muted,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em'}}>Teacher Dashboard</span>
        </div>
        <div style={{background:C.primary+'18',color:C.primary,border:`1px solid ${C.primary}40`,borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:700}}>
          🏫 School Edition
        </div>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'28px 20px'}}>

        {!data && !error && (
          <div style={{textAlign:'center',marginTop:80}}>
            <div style={{fontSize:32,marginBottom:12,animation:'pulse 1.5s infinite'}}>📊</div>
            <div style={{color:C.muted}}>Loading class data…</div>
          </div>
        )}

        {error && (
          <div style={{textAlign:'center',marginTop:80,color:C.danger}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:700}}>{error}</div>
            <div style={{fontSize:13,color:C.muted,marginTop:8}}>Ask your student to share a fresh dashboard link.</div>
          </div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:28}}>
              {[
                { label:'Students',     val: data.student_count  ?? '–', icon:'👩‍🎓' },
                { label:'Avg Score',    val: data.avg_score      ?? '–', icon:'🎯' },
                { label:'Avg Streak',   val: data.avg_streak     ?? '–', icon:'🔥' },
              ].map(s => (
                <div key={s.label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'18px 14px',textAlign:'center'}}>
                  <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:24,fontWeight:900,color:C.primary}}>{s.val}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Topic heatmap */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'20px',marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:800,color:C.navy,marginBottom:16}}>Class Topic Heatmap</div>
              {(data.topic_accuracy ?? []).map(t => (
                <div key={t.topic} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,color:C.navy,marginBottom:5}}>
                    <span>{t.topic}</span>
                    <span style={{color:t.pct>=75?C.success:t.pct>=50?C.primary:C.danger}}>{t.pct}%</span>
                  </div>
                  <div style={{background:C.border,borderRadius:6,height:8}}>
                    <div style={{width:`${t.pct}%`,background:`linear-gradient(90deg,${C.primary},#14B8A6)`,height:'100%',borderRadius:6}} />
                  </div>
                </div>
              ))}
            </div>

            {/* Students table */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:'20px'}}>
              <div style={{fontSize:14,fontWeight:800,color:C.navy,marginBottom:16}}>Student Overview</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${C.border}`}}>
                      {['Name','Stream','Sessions','Avg Score','Streak','XP'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'8px 12px',color:C.muted,fontWeight:700,fontSize:11,textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.students ?? []).map((s, i) => (
                      <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{s.display_name}</td>
                        <td style={{padding:'10px 12px',color:C.muted,textTransform:'capitalize'}}>{s.stream}</td>
                        <td style={{padding:'10px 12px',color:C.navy}}>{s.sessions}</td>
                        <td style={{padding:'10px 12px'}}>
                          <span style={{color:s.avg_score>=75?C.success:s.avg_score>=50?C.primary:C.danger,fontWeight:700}}>{s.avg_score}%</span>
                        </td>
                        <td style={{padding:'10px 12px',color:'#F97316',fontWeight:700}}>{s.streak} 🔥</td>
                        <td style={{padding:'10px 12px',color:C.primary,fontWeight:700}}>{s.xp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div style={{marginTop:20,padding:'16px 20px',background:C.primary+'15',border:`1.5px solid ${C.primary}30`,borderRadius:14,textAlign:'center'}}>
              <div style={{fontSize:14,fontWeight:800,color:C.navy,marginBottom:6}}>Want Nexora for your whole school?</div>
              <div style={{fontSize:12,color:C.muted}}>School licences from £200/year · Full class management · GDPR compliant · UK curriculum aligned</div>
              <a href="mailto:info@nexoralearn.app" style={{display:'inline-block',marginTop:12,background:C.primary,color:'white',borderRadius:12,padding:'10px 24px',fontSize:14,fontWeight:700}}>
                Get in touch →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
