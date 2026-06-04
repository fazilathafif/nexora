// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { name, email, subject, message, type } = await req.json()

    if (!email || !message) {
      return Response.json({ error: 'Email and message are required' }, { status: 400, headers: CORS })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      // Fallback: log and return success (for dev/no-key environments)
      console.log('Contact form submission:', { name, email, subject, message, type })
      return Response.json({ success: true }, { headers: CORS })
    }

    const emailBody = `
New contact form submission from Nexora:

From: ${name || 'Anonymous'} <${email}>
Type: ${type || 'General'}
Subject: ${subject || 'No subject'}

Message:
${message}

---
Sent from nexoralearn.app
    `.trim()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nexora <info@nexoralearn.app>',
        to: ['info@nexoralearn.app'],
        reply_to: email,
        subject: `[Nexora] ${type || 'Contact'}: ${subject || message.slice(0, 50)}`,
        text: emailBody,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return Response.json({ error: 'Failed to send email' }, { status: 502, headers: CORS })
    }

    return Response.json({ success: true }, { headers: CORS })
  } catch (err) {
    console.error('send-contact error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS })
  }
})
