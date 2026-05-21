import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'May 2026'

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `Nexora ("we", "us", "our") provides online exam preparation tools for UK GCSE and university entrance examinations, operated at nexoralearn.app. For all data protection queries, contact us at privacy@nexoralearn.app.`,
  },
  {
    title: '2. What Data We Collect',
    items: [
      { label: 'Account data', detail: 'Your email address and a hashed password, collected when you register.' },
      { label: 'Usage data', detail: 'Quiz answers, scores, streak counts, XP, flashcard progress, and your chosen exam date — used to personalise your study experience.' },
      { label: 'Subscription status', detail: 'Your current plan tier and billing state, managed via Stripe.' },
      { label: 'Technical data', detail: 'IP address and browser type, collected automatically by our infrastructure provider (Supabase) for security and abuse prevention.' },
    ],
  },
  {
    title: '3. How We Use Your Data',
    items: [
      { label: 'Account management', detail: 'To create, maintain and secure your Nexora account.' },
      { label: 'Personalisation', detail: 'To track your progress, surface due flashcards via spaced repetition, and adapt question difficulty.' },
      { label: 'Billing', detail: 'To process subscription payments and send invoices.' },
      { label: 'Service improvement', detail: 'Aggregated, anonymised analytics to improve question quality and app performance.' },
    ],
  },
  {
    title: '4. Data Processors',
    items: [
      { label: 'Supabase (supabase.com)', detail: 'Our database, authentication, and file-storage provider. Data is hosted in EU region data centres. Supabase acts as a data processor under a Data Processing Agreement.' },
      { label: 'Stripe (stripe.com)', detail: 'Payment processing. Stripe is PCI-DSS Level 1 certified. Nexora does not store payment card data — all card information is handled exclusively by Stripe.' },
      { label: 'Anthropic (anthropic.com)', detail: 'AI-generated question explanations are produced via the Anthropic API. Only the question text and answer context are sent — no personal data (name, email, or identifiers) is included in these requests.' },
    ],
  },
  {
    title: '5. Lawful Basis for Processing (UK GDPR)',
    items: [
      { label: 'Contract performance', detail: 'Processing your account data and billing information to deliver the service you have subscribed to.' },
      { label: 'Legitimate interests', detail: 'Service security, fraud prevention, and aggregate analytics.' },
      { label: 'Consent', detail: 'Any optional marketing communications. You may withdraw consent at any time by emailing privacy@nexoralearn.app.' },
    ],
  },
  {
    title: '6. Data Retention',
    items: [
      { label: 'Active accounts', detail: 'Account and usage data is retained for as long as your account is active.' },
      { label: 'Deleted accounts', detail: 'On receipt of a deletion request, all personal data is permanently removed within 30 days.' },
      { label: 'Billing records', detail: 'Transaction records are retained for 7 years as required by UK tax law.' },
    ],
  },
  {
    title: '7. Your Rights Under UK GDPR',
    body: 'You have the right to access, correct, delete, or export your personal data, and to restrict or object to certain processing. To exercise any of these rights, email privacy@nexoralearn.app — we will respond within 30 days. You also have the right to lodge a complaint with the Information Commissioner\'s Office (ICO) at ico.org.uk.',
  },
  {
    title: '8. Cookies',
    body: 'We use strictly necessary cookies only (authentication session tokens). We do not use tracking, advertising, or third-party analytics cookies.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this policy from time to time. Material changes will be notified by email or an in-app notice. Continued use of Nexora after changes constitutes acceptance.',
  },
  {
    title: '10. Contact',
    body: 'Data protection queries: privacy@nexoralearn.app\nGeneral support: support@nexoralearn.app',
  },
]

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100dvh', background:'#F8FAFC', fontFamily:'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#7C3AED,#4F46E5)', padding:'max(20px, env(safe-area-inset-top, 20px)) 16px 20px' }}>
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
            <div style={{ fontSize:20, fontWeight:900, color:'white', letterSpacing:'-0.4px' }}>Privacy Policy</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>Last updated: {LAST_UPDATED}</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'rgba(255,255,255,0.82)', lineHeight:1.55 }}>
          This policy explains what personal data Nexora collects, how we use it, and your rights under the UK General Data Protection Regulation (UK GDPR).
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
              <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, whiteSpace:'pre-line' }}>
                {sec.body}
              </div>
            )}
            {sec.items && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sec.items.map(item => (
                  <div key={item.label} style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#7C3AED', marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:20, textAlign:'center' }}>
          <div style={{ fontSize:12, color:'#94A3B8' }}>nexoralearn.app · privacy@nexoralearn.app</div>
        </div>
      </div>
    </div>
  )
}
