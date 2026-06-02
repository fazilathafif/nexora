/**
 * JoinPage.jsx — Accept a group invite via /join/:token
 * Public route — no auth required to view, but must sign in to accept.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { COURSERA_BLUE } from '../styles/courseraTokens.js'

export default function JoinPage({ user }) {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const [invite, setInvite]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    async function loadInvite() {
      const { data } = await supabase
        .from('group_invites')
        .select('*, groups(label, group_type, tracks, seats_used, seats_total)')
        .eq('token', token)
        .single()
      setInvite(data)
      setLoading(false)
    }
    loadInvite()
  }, [token])

  async function accept() {
    if (!user?.id) {
      sessionStorage.setItem('nx_pending_invite', token)
      navigate('/')
      return
    }
    setJoining(true); setError(null)
    const { data, error: err } = await supabase.rpc('accept_group_invite', { p_token: token })
    if (err || data?.error) {
      setError(data?.error ?? err?.message)
    } else {
      setSuccess(data.label)
      setTimeout(() => navigate('/group/dashboard'), 1800)
    }
    setJoining(false)
  }

  const GROUP_TYPE_LABEL = { class:'Class / School', family:'Family', tutor:'Tutor Group' }

  if (loading) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F7FA', fontFamily:'Inter,sans-serif' }}>
        <div style={{ fontSize:13, color:'#64748B' }}>Loading invite…</div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F7FA', fontFamily:'Inter,sans-serif', padding:24 }}>
        <div style={{ background:'white', borderRadius:20, padding:'32px 28px', maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>❌</div>
          <div style={{ fontSize:17, fontWeight:800, color:'#1E293B', marginBottom:8 }}>Invite not found</div>
          <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>
            This link may have expired or already been used.
          </div>
          <button onClick={() => navigate('/')}
            style={{ width:'100%', background:COURSERA_BLUE, color:'white', border:'none', borderRadius:10, padding:'13px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Go to Nexora →
          </button>
        </div>
      </div>
    )
  }

  const group    = invite.groups
  const expired  = new Date(invite.expires_at) < new Date()
  const accepted = !!invite.accepted_at

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0a1628 0%,#0d2240 50%,#1a4a3a 100%)', fontFamily:'Inter,sans-serif', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:'32px 28px', maxWidth:400, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Nexora wordmark */}
        <div style={{ fontSize:16, fontWeight:900, color:COURSERA_BLUE, letterSpacing:'-0.5px', marginBottom:20 }}>Nexora</div>

        {success ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🎉</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#1E293B', marginBottom:8 }}>You've joined!</div>
            <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>Welcome to <strong>{success}</strong>. Redirecting to your dashboard…</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🏫</div>
              <div style={{ fontSize:19, fontWeight:900, color:'#1E293B', letterSpacing:'-0.3px', marginBottom:6 }}>
                You're invited to join
              </div>
              <div style={{ fontSize:20, fontWeight:900, color:COURSERA_BLUE, marginBottom:8 }}>
                {group?.label ?? 'a Nexora group'}
              </div>
              <div style={{ fontSize:13, color:'#64748B' }}>
                {GROUP_TYPE_LABEL[group?.group_type] ?? 'Group'} · {group?.tracks?.length ?? 0} track{group?.tracks?.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Invite details */}
            <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px', marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'#64748B' }}>Your role</span>
                <span style={{ fontWeight:700, color:'#1E293B', textTransform:'capitalize' }}>{invite.role}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'#64748B' }}>Seats available</span>
                <span style={{ fontWeight:700, color: (group?.seats_used ?? 0) >= (group?.seats_total ?? 0) ? '#EF4444' : '#10B981' }}>
                  {Math.max(0, (group?.seats_total ?? 0) - (group?.seats_used ?? 0))} remaining
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'#64748B' }}>Expires</span>
                <span style={{ fontWeight:700, color: expired ? '#EF4444' : '#1E293B' }}>
                  {expired ? 'Expired' : new Date(invite.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
            </div>

            {expired && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', marginBottom:14 }}>
                This invite has expired. Ask your teacher/parent to send a new one.
              </div>
            )}
            {accepted && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', marginBottom:14 }}>
                This invite has already been used.
              </div>
            )}
            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', marginBottom:14 }}>
                {error}
              </div>
            )}

            <button
              onClick={accept}
              disabled={joining || expired || accepted}
              style={{ width:'100%', background: expired || accepted ? '#D1D5DB' : COURSERA_BLUE, color:'white', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:700, cursor: expired || accepted ? 'default' : 'pointer', fontFamily:'Inter,sans-serif', marginBottom:12 }}>
              {joining ? 'Joining…' : !user?.id ? 'Sign in to Accept →' : 'Accept Invitation →'}
            </button>

            {!user?.id && (
              <div style={{ textAlign:'center', fontSize:12, color:'#64748B' }}>
                You'll be asked to sign in or create an account first.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
