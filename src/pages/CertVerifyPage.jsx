import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CERT_DEFS } from '../lib/certificates.js'
import { TRACK_COLORS } from '../styles/courseraTokens.js'

const VERIFY_URL  = `https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/verify-cert`
const ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const STREAM_LABELS = {
  gcse:'GCSE', alevel:'A-Level', sat:'SAT', act:'ACT',
  ap:'AP', psat:'PSAT', igcse:'IGCSE', ib:'IB Diploma',
}

export default function CertVerifyPage() {
  const { pathname } = useLocation()
  const certId       = pathname.replace('/cert/', '').trim()

  const [status,  setStatus]  = useState('loading') // loading | valid | invalid | error
  const [data,    setData]    = useState(null)

  useEffect(() => {
    if (!certId) { setStatus('invalid'); return }
    fetch(`${VERIFY_URL}?id=${encodeURIComponent(certId)}`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.valid) { setData(d); setStatus('valid') }
        else setStatus('invalid')
      })
      .catch(() => setStatus('error'))
  }, [certId])

  const def    = data ? CERT_DEFS.find(d => d.id === data.certType) : null
  const accent = data?.stream ? (TRACK_COLORS[data.stream] ?? '#0056D2') : '#0056D2'
  const date   = data?.earnedDate
    ? new Date(data.earnedDate).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : ''

  return (
    <div style={{ minHeight:'100dvh', background:'#F8FAFC', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>

      {status === 'loading' && (
        <div style={{ textAlign:'center', color:'#64748B' }}>
          <div style={{ width:32, height:32, border:'3px solid #0056D220', borderTop:'3px solid #0056D2', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <div style={{ fontSize:14, fontWeight:600 }}>Verifying certificate…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status === 'invalid' && (
        <div style={{ maxWidth:420, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>❌</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1E293B', marginBottom:8 }}>Certificate not found</div>
          <div style={{ fontSize:14, color:'#64748B', lineHeight:1.6 }}>
            The certificate ID <strong>{certId}</strong> could not be verified. It may be invalid or have been revoked.
          </div>
          <a href="https://nexoralearn.app" style={{ display:'inline-block', marginTop:20, background:'#0056D2', color:'white', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:700, textDecoration:'none' }}>
            Visit Nexora →
          </a>
        </div>
      )}

      {status === 'error' && (
        <div style={{ maxWidth:420, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1E293B', marginBottom:8 }}>Verification unavailable</div>
          <div style={{ fontSize:14, color:'#64748B' }}>Please try again in a moment.</div>
        </div>
      )}

      {status === 'valid' && data && (
        <div style={{ maxWidth:560, width:'100%' }}>
          {/* Verified banner */}
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'#DCFCE7', border:'1.5px solid #16A34A40', borderRadius:12, padding:'10px 16px', marginBottom:20 }}>
            <span style={{ fontSize:18 }}>✅</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#15803D' }}>Certificate Verified</div>
              <div style={{ fontSize:11, color:'#16A34A' }}>This is an authentic Nexora certificate</div>
            </div>
          </div>

          {/* Certificate card */}
          <div style={{ background:'white', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 32px rgba(0,0,0,0.10)', border:`1px solid ${accent}20` }}>
            <div style={{ height:6, background:`linear-gradient(90deg,${accent},${accent}99)` }} />
            <div style={{ padding:'32px 32px 24px', textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:20 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${accent}18`, border:`1.5px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:14, fontWeight:900, color:accent }}>N</span>
                </div>
                <span style={{ fontSize:18, fontWeight:900, color:accent }}>Nexora</span>
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>Certificate of Achievement</div>
              <div style={{ width:40, height:2, background:`linear-gradient(90deg,transparent,${accent},transparent)`, margin:'0 auto 16px' }} />
              <div style={{ fontSize:13, color:'#64748B', marginBottom:8, fontStyle:'italic' }}>This certifies that</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#1E293B', letterSpacing:'-0.6px', marginBottom:12 }}>{data.name}</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:6 }}>has demonstrated outstanding achievement in</div>
              <div style={{ fontSize:20, fontWeight:800, color:accent, marginBottom:4 }}>{def?.title ?? data.certType}</div>
              {def?.subtitle && <div style={{ fontSize:12, color:'#64748B', marginBottom:0 }}>{def.subtitle}</div>}
              <div style={{ width:32, height:1, background:`${accent}40`, margin:'16px auto' }} />
              <div style={{ display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap' }}>
                {data.stream && (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>Track</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{STREAM_LABELS[data.stream] ?? data.stream.toUpperCase()}</div>
                  </div>
                )}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>Date Awarded</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{date}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>Certificate ID</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{certId}</div>
                </div>
              </div>
            </div>
            <div style={{ height:32, background:`${accent}08`, borderTop:`1px solid ${accent}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>nexoralearn.app · Issued by Nexora Learn</div>
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <a href="https://nexoralearn.app" style={{ fontSize:12, color:'#0056D2', fontWeight:700, textDecoration:'none' }}>
              Start your own journey at nexoralearn.app →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
