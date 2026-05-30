import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Shell, getColors } from './HomePage.jsx'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import { STRIPE_PUBLISHABLE_KEY } from '../lib/subscription.js'
import { STREAM_CONFIG } from '../data/questions.js'
import { TRACK_COLORS } from '../styles/courseraTokens.js'

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

const PRO_PRICE_PER_TRACK   = 6.99
const GROUP_PRICE_PER_TRACK = 4.99

const ALL_TRACKS = Object.entries(STREAM_CONFIG).map(([id, cfg]) => ({
  id,
  label: cfg.label?.replace(' Track','').replace(' Prep','') ?? id.toUpperCase(),
  emoji: cfg.subjects?.[0]?.emoji ?? '📚',
  region: ['gcse','alevel'].includes(id) ? '🇬🇧' : '🇺🇸',
}))

const PLAN_CARDS = [
  {
    key: 'free',
    name: 'Free',
    price: 'Free forever',
    priceNote: '1 track only · no card needed',
    features: ['1 track included', '15 questions / day', '2 subjects per track', 'Basic progress tracking', 'Community leaderboard'],
    color: '#64748B',
    highlight: false,
  },
  {
    key: 'premium',
    name: 'Pro',
    price: `£${PRO_PRICE_PER_TRACK}`,
    priceNote: 'per track / month',
    features: ['Unlimited questions', 'All subjects in the track', 'AI explanations & notes', 'Mock exams', 'Full study plan', 'Streak & XP'],
    color: '#0056D2',
    highlight: true,
  },
  {
    key: 'group',
    name: 'Group',
    price: `£${GROUP_PRICE_PER_TRACK}`,
    priceNote: 'per track / student / month',
    features: ['All Pro features per track', 'Teacher dashboard', 'Class progress reports', 'Class leaderboard', 'Min. 5 students', 'Priority support'],
    color: '#059669',
    highlight: false,
  },
]

function CheckoutForm({ plan, tracks, userId, onSuccess, onError, C }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const cardElement = elements.getElement(CardElement)
      const { paymentMethod, error } = await stripe.createPaymentMethod({ type:'card', card: cardElement })
      if (error) { onError(error.message); return }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id, plan, tracks, userId }),
      })
      const data = await res.json()
      if (!res.ok) { onError(data.error ?? 'Subscription failed'); return }

      const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
      if (confirmError) { onError(confirmError.message); return }

      onSuccess()
    } catch (err) {
      onError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ border:`1.5px solid #E2E8F0`, borderRadius:10, padding:'14px 16px', marginBottom:14, background:'white' }}>
        <CardElement options={{ style: { base: { fontSize:'14px', fontFamily:'Inter,sans-serif', color:'#1E293B', '::placeholder':{ color:'#94A3B8' } } } }} />
      </div>
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{ width:'100%', background:C.primary, color:'white', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'Inter,sans-serif' }}
      >
        {loading ? 'Processing…' : 'Subscribe →'}
      </button>
    </form>
  )
}

function TrackSelector({ selected, onChange, pricePerTrack, planColor }) {
  const uk = ALL_TRACKS.filter(t => t.region === '🇬🇧')
  const us = ALL_TRACKS.filter(t => t.region === '🇺🇸')
  const total = (selected.length * pricePerTrack).toFixed(2)

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(t => t !== id) : [...selected, id])
  }

  function renderGroup(label, tracks) {
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'#94A3B8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {tracks.map(t => {
            const checked = selected.includes(t.id)
            const accent  = TRACK_COLORS[t.id] ?? planColor
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  background: checked ? `${accent}10` : 'white',
                  border: `1.5px solid ${checked ? accent : '#E2E8F0'}`,
                  borderRadius:12, padding:'11px 14px',
                  cursor:'pointer', fontFamily:'Inter,sans-serif',
                  textAlign:'left', transition:'all 0.15s',
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width:20, height:20, borderRadius:6, flexShrink:0,
                  background: checked ? accent : 'white',
                  border: `2px solid ${checked ? accent : '#CBD5E1'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.15s',
                }}>
                  {checked && <span style={{ fontSize:11, color:'white', fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:16 }}>{t.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{t.label}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color: checked ? accent : '#94A3B8', flexShrink:0 }}>
                  £{pricePerTrack}/mo
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderGroup('🇬🇧 United Kingdom', uk)}
      {renderGroup('🇺🇸 United States', us)}
      {/* Running total */}
      <div style={{
        marginTop:4, padding:'12px 16px',
        background: selected.length > 0 ? `${planColor}10` : '#F8FAFC',
        border: `1.5px solid ${selected.length > 0 ? planColor+'30' : '#E2E8F0'}`,
        borderRadius:12,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ fontSize:12, color:'#64748B' }}>
          {selected.length === 0
            ? 'Select at least 1 track'
            : `${selected.length} track${selected.length > 1 ? 's' : ''} selected`}
        </div>
        <div style={{ fontSize:16, fontWeight:900, color: selected.length > 0 ? planColor : '#94A3B8' }}>
          £{total}<span style={{ fontSize:11, fontWeight:600, color:'#94A3B8' }}>/mo</span>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage({ user, profile, isDark }) {
  const { stream }          = useParams()
  const navigate            = useNavigate()
  const [searchParams]      = useSearchParams()
  const C                   = getColors(stream, null, isDark)
  const { isMobile }        = useBreakpoint()
  const [selected, setSelected] = useState(null)
  const [success,  setSuccess]  = useState(false)
  const [errMsg,   setErrMsg]   = useState(null)

  // Track selection for paid plans — default to currently enrolled tracks
  const enrolledStreams = profile?.streams?.length ? profile.streams : profile?.stream ? [profile.stream] : [stream]
  const [selectedTracks, setSelectedTracks] = useState(enrolledStreams)

  const trialExpired   = searchParams.get('reason') === 'trial_expired'
  const trialExpiresAt = profile?.trial_expires_at ?? profile?.trial_ends_at ?? null
  const trialDays      = trialExpiresAt ? Math.max(0, Math.ceil((new Date(trialExpiresAt) - new Date()) / 86400000)) : 0
  const currentPlan    = profile?.plan ?? (trialDays > 0 ? 'trial' : 'free')
  const planBadgeText  = trialDays > 0 ? `${trialDays} day${trialDays === 1 ? '' : 's'} left in trial` : currentPlan === 'premium' ? 'Pro' : currentPlan === 'group' ? 'Group' : 'Free'

  const pricePerTrack  = selected === 'group' ? GROUP_PRICE_PER_TRACK : PRO_PRICE_PER_TRACK
  const totalPrice     = (selectedTracks.length * pricePerTrack).toFixed(2)
  const selectedCard   = PLAN_CARDS.find(p => p.key === selected)

  if (success) {
    return (
      <Shell C={C} isDark={isDark}>
        <div style={{ textAlign:'center', padding:'60px 24px' }}>
          <div style={{ fontSize:60, marginBottom:20 }}>🎉</div>
          <h2 style={{ fontSize:24, fontWeight:900, color:C.navy, margin:'0 0 12px' }}>You're all set!</h2>
          <p style={{ fontSize:14, color:C.muted, marginBottom:8 }}>
            Your <strong>{selectedCard?.name}</strong> subscription is active for{' '}
            <strong>{selectedTracks.length} track{selectedTracks.length > 1 ? 's' : ''}</strong>.
          </p>
          <p style={{ fontSize:13, color:C.muted, marginBottom:28 }}>Enjoy unlimited access across your selected tracks.</p>
          <button onClick={() => navigate(`/${stream}`)} style={{ background:C.primary, color:'white', border:'none', borderRadius:12, padding:'14px 28px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Start practising →
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell C={C} isDark={isDark}>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, fontWeight:700, marginBottom:20, padding:0, fontFamily:'Inter,sans-serif' }}>
        ← Back
      </button>

      <div style={{ textAlign:'center', marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:C.navy, margin:'0 0 8px', letterSpacing:'-0.5px' }}>Choose your plan</h1>
        <p style={{ fontSize:14, color:C.muted, margin:0 }}>Start free, upgrade when you're ready.</p>
      </div>

      {trialExpired && (
        <div style={{ background:'#FFF7ED', border:'1.5px solid #FED7AA', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>⏰</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#92400E', marginBottom:3 }}>Your free trial has ended</div>
              <div style={{ fontSize:12, color:'#B45309', lineHeight:1.55 }}>
                Upgrade to continue with unlimited practice and AI explanations — or stay on our <strong>free limited plan</strong> with 15 questions/day.
              </div>
            </div>
          </div>
          <button onClick={() => navigate(`/${stream}`)} style={{ marginTop:12, width:'100%', background:'transparent', border:'1.5px solid #FED7AA', borderRadius:10, padding:'10px', fontSize:12, fontWeight:700, color:'#92400E', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Continue on free plan →
          </button>
        </div>
      )}

      {trialDays > 0 && (
        <div style={{ background:`${C.primary}12`, border:`1.5px solid ${C.primary}30`, borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>✨</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.primary }}>
            {trialDays} day{trialDays === 1 ? '' : 's'} left in your free trial — all Pro features unlocked
          </span>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap:14, marginBottom:28 }}>
        {PLAN_CARDS.map(card => {
          const isSelected     = selected === card.key
          const isCurrent      = currentPlan === card.key || (card.key === 'premium' && currentPlan === 'trial')
          const isFreeFallback = trialExpired && card.key === 'free'
          const cardBorder     = isSelected ? `2px solid ${card.color}` : isFreeFallback ? `2px solid ${card.color}` : card.highlight ? `2px solid ${card.color}40` : `1.5px solid #E2E8F0`
          const cardBg         = isSelected ? `${card.color}08` : isFreeFallback ? `${card.color}06` : card.highlight ? `${card.color}05` : (isDark ? '#1E293B' : 'white')
          return (
            <div
              key={card.key}
              onClick={() => card.key !== 'free' && setSelected(card.key)}
              style={{ background:cardBg, border:cardBorder, borderRadius:18, padding:'22px 18px', cursor:card.key !== 'free' ? 'pointer' : 'default', position:'relative', transition:'all 0.2s', boxShadow: card.highlight ? `0 4px 20px ${card.color}20` : 'none' }}
            >
              {card.highlight && (
                <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:card.color, color:'white', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 12px', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              {isFreeFallback && (
                <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:card.color, color:'white', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 12px', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                  ALWAYS FREE
                </div>
              )}
              {isCurrent && (
                <div style={{ position:'absolute', top:12, right:12, background:`${card.color}20`, color:card.color, fontSize:9, fontWeight:800, borderRadius:20, padding:'2px 8px', letterSpacing:'0.06em' }}>
                  CURRENT
                </div>
              )}
              <div style={{ fontSize:16, fontWeight:800, color:card.color, marginBottom:4 }}>{card.name}</div>
              <div style={{ marginBottom:14 }}>
                <span style={{ fontSize:26, fontWeight:900, color:C.navy, letterSpacing:'-1px' }}>{card.price}</span>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{card.priceNote}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {card.features.map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.navy }}>
                    <span style={{ color:card.color, fontWeight:800, fontSize:13 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              {card.key !== 'free' && (
                <div style={{ marginTop:18, padding:'10px', textAlign:'center', background:isSelected ? card.color : `${card.color}12`, borderRadius:10, fontSize:12, fontWeight:800, color:isSelected ? 'white' : card.color, transition:'all 0.2s' }}>
                  {isSelected ? '✓ Selected' : 'Select plan'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Track selector + checkout — shown when a paid plan is selected */}
      {selected && (
        <div style={{ background:isDark ? '#1E293B' : 'white', border:`1.5px solid #E2E8F0`, borderRadius:18, padding:'22px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:24 }}>

          {/* Step 1: Choose tracks */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:4 }}>
              1. Choose your tracks
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
              Select one or more tracks. You'll be charged £{pricePerTrack}/track/month.
            </div>
            <TrackSelector
              selected={selectedTracks}
              onChange={setSelectedTracks}
              pricePerTrack={pricePerTrack}
              planColor={selectedCard?.color ?? C.primary}
            />
          </div>

          {/* Step 2: Payment */}
          {selectedTracks.length > 0 && (
            <>
              <div style={{ height:1, background:'#E2E8F0', margin:'4px 0 20px' }} />
              <div style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:4 }}>
                2. Payment details
              </div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
                {selectedCard?.name} · {selectedTracks.length} track{selectedTracks.length > 1 ? 's' : ''} · <strong style={{ color:C.navy }}>£{totalPrice}/month</strong>
              </div>

              {errMsg && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', marginBottom:12 }}>
                  {errMsg}
                </div>
              )}

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    plan={selected}
                    tracks={selectedTracks}
                    userId={user?.id}
                    C={C}
                    onSuccess={() => setSuccess(true)}
                    onError={msg => setErrMsg(msg)}
                  />
                </Elements>
              ) : (
                <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'14px 16px', fontSize:13, color:'#92400E' }}>
                  Stripe is not configured. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable payments.
                </div>
              )}

              <p style={{ fontSize:10, color:C.muted, textAlign:'center', marginTop:14, marginBottom:0 }}>
                Secured by Stripe · Cancel any time · No hidden fees
              </p>
            </>
          )}
        </div>
      )}

      <div style={{ textAlign:'center', fontSize:12, color:C.muted }}>
        Current plan: <strong style={{ color:C.navy }}>{planBadgeText}</strong>
      </div>
    </Shell>
  )
}

