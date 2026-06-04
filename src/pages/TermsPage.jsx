import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'May 2026'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using Nexora (nexoralearn.app), you agree to be bound by these Terms of Service. If you do not agree, please do not use the service. These terms are governed by the laws of England and Wales.',
  },
  {
    title: '2. What Nexora Provides',
    body: 'Nexora is an online study platform offering practice questions, timed mock exams, flashcards, and spaced-repetition study tools for:\n• UK GCSE subjects (Mathematics, English, Sciences, and more)\n• University entrance examinations (UCAT, LNAT, MAT, PAT, ESAT, TMUA, TARA, and STEP)',
  },
  {
    title: '3. Subscription Plans',
    items: [
      { label: 'Free tier', detail: 'Access to a limited number of practice questions per day at no charge.' },
      { label: 'Premium tier', detail: 'Unlimited questions, AI-powered explanations, full timed mock exams, and advanced progress tracking.' },
      { label: 'Billing', detail: 'Premium subscriptions are billed monthly or annually. The price applicable at the time of your subscription is displayed clearly before purchase. Payments are processed securely by Stripe.' },
      { label: 'Automatic renewal', detail: 'Subscriptions renew automatically at the end of each billing period unless cancelled. You will receive an email reminder before renewal.' },
    ],
  },
  {
    title: '4. Cancellation and Refunds',
    items: [
      { label: 'Cancellation', detail: 'You may cancel your subscription at any time via your account settings. Cancellation takes effect at the end of the current paid billing period — you retain Premium access until that date.' },
      { label: 'Monthly subscriptions', detail: 'No refunds are issued for partial monthly billing periods.' },
      { label: 'Annual subscriptions', detail: 'If you cancel an annual subscription within 14 days of purchase, you may request a refund by emailing info@nexoralearn.app. Refunds are at our discretion after this window.' },
      { label: 'Free tier', detail: 'No charge applies to free-tier accounts. You may delete your account at any time.' },
    ],
  },
  {
    title: '5. Acceptable Use',
    body: 'You agree not to:\n• Share your account credentials or allow others to access your account\n• Use automated scripts, bots, or scrapers to extract question content or data\n• Reproduce, redistribute, or publish Nexora question content without written permission\n• Attempt to reverse-engineer, decompile, or copy the Nexora platform\n• Use the service in any way that disrupts other users or our infrastructure\n\nViolation of these terms may result in immediate account suspension without refund.',
  },
  {
    title: '6. Intellectual Property',
    body: 'All question content, AI-generated explanations, study materials, software, branding, and design are owned by or licensed to Nexora. Your use of the service does not grant you any ownership rights. You may use content solely for personal, non-commercial study purposes.',
  },
  {
    title: '7. No Guarantee of Exam Results',
    highlight: true,
    body: 'Nexora is a supplementary study aid. We make no representation, warranty, or guarantee that use of Nexora will result in achieving a particular grade, passing any examination, or gaining admission to any educational institution. Exam success depends on many factors beyond any single study tool, including consistent effort, wider study, and individual aptitude.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the fullest extent permitted by applicable law, Nexora and its operators shall not be liable for any indirect, incidental, consequential, or special damages arising from your use of the service, including loss of data, missed exam outcomes, or reliance on AI-generated content.\n\nOur total liability in any matter arising from your use of Nexora shall not exceed the amount you paid us in the 12 months preceding the claim.',
  },
  {
    title: '9. Changes to These Terms',
    body: 'We may update these Terms from time to time. Material changes will be notified by email or an in-app notice at least 14 days before taking effect. Continued use of Nexora after changes constitutes your acceptance of the updated terms.',
  },
  {
    title: '10. Contact',
    body: 'General support and billing: info@nexoralearn.app\nData protection and privacy: info@nexoralearn.app',
  },
]

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100dvh', background:'#F8FAFC', fontFamily:'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0F766E,#059669)', padding:'max(20px, env(safe-area-inset-top, 20px)) 16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'white', letterSpacing:'-0.4px' }}>Terms of Service</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>Last updated: {LAST_UPDATED}</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'rgba(255,255,255,0.82)', lineHeight:1.55 }}>
          Please read these terms carefully before using Nexora. By using the service you agree to be bound by them.
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'20px 16px calc(40px + env(safe-area-inset-bottom, 0px))', maxWidth:680, margin:'0 auto' }}>
        {SECTIONS.map(sec => (
          <div key={sec.title} style={{ marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#1E293B', marginBottom:10, letterSpacing:'-0.2px' }}>
              {sec.title}
            </div>
            {sec.body && (
              <div style={{
                fontSize:13, color: sec.highlight ? '#92400E' : '#475569', lineHeight:1.7, whiteSpace:'pre-line',
                ...(sec.highlight ? {
                  background:'#FEF3C7', border:'1px solid #F59E0B40',
                  borderLeft:'3px solid #F59E0B',
                  borderRadius:10, padding:'12px 14px',
                } : {}),
              }}>
                {sec.body}
              </div>
            )}
            {sec.items && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sec.items.map(item => (
                  <div key={item.label} style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#0F766E', marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:20, textAlign:'center' }}>
          <div style={{ fontSize:12, color:'#94A3B8' }}>nexoralearn.app · info@nexoralearn.app</div>
        </div>
      </div>
    </div>
  )
}
