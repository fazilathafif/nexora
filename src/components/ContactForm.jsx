import { useState } from 'react'

const TYPES = [
  'General Enquiry',
  'Technical Issue',
  'Billing',
  'Partnership',
  'Other',
]

export default function ContactForm({ C, user, onClose }) {
  const [name,    setName]    = useState(user?.display_name ?? user?.user_metadata?.full_name ?? '')
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [type,    setType]    = useState('General Enquiry')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(null)

  const navy  = C?.navy  ?? '#1E293B'
  const muted = C?.muted ?? '#64748B'
  const bord  = C?.border ?? '#E2E8F0'
  const bg    = C?.bg     ?? '#F8FAFC'
  const card  = C?.card   ?? 'white'
  const primary = C?.primary ?? '#7C3AED'

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: `1.5px solid ${bord}`,
    fontSize: 13,
    color: navy,
    background: card,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter,sans-serif',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: muted,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
  }

  const fieldStyle = { marginBottom: 14 }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || message.length < 10) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ name, email, type, subject, message }),
        }
      )
      if (!res.ok) throw new Error('non-ok response')
      setSent(true)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981', marginBottom: 6 }}>
          Message sent!
        </div>
        <div style={{ fontSize: 12, color: muted, lineHeight: 1.7 }}>
          We'll get back to you within 24 hours.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter,sans-serif' }}>
      {/* Name */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div style={fieldStyle}>
        <label style={labelStyle}>
          Email <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={inputStyle}
        />
      </div>

      {/* Type */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div style={fieldStyle}>
        <label style={labelStyle}>
          Subject <span style={{ fontSize: 10, color: muted, fontWeight: 500, textTransform: 'none' }}>(optional)</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Brief summary"
          style={inputStyle}
        />
      </div>

      {/* Message */}
      <div style={fieldStyle}>
        <label style={labelStyle}>
          Message <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="How can we help? (min 10 characters)"
          required
          minLength={10}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {error && (
        <div style={{
          fontSize: 12, color: '#DC2626', background: '#FEE2E2',
          border: '1px solid #FCA5A5', borderRadius: 8,
          padding: '8px 12px', marginBottom: 12, lineHeight: 1.5,
        }}>
          Something went wrong — please email{' '}
          <a href="mailto:support@nexoralearn.app" style={{ color: '#DC2626', fontWeight: 700 }}>
            support@nexoralearn.app
          </a>{' '}
          directly.
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !email || message.length < 10}
        style={{
          background: (sending || !email || message.length < 10) ? '#CBD5E1' : primary,
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '10px 22px',
          fontSize: 13,
          fontWeight: 700,
          cursor: (sending || !email || message.length < 10) ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter,sans-serif',
          transition: 'background 0.2s',
          width: '100%',
        }}
      >
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
