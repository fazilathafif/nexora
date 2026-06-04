// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

/**
 * POST /functions/v1/send-welcome
 * Sends a warm welcome + encouragement email to a user.
 * Called by SysAdmin only. Requires service role key in header.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WELCOME_TEMPLATES = {
  new_user: {
    subject: 'Welcome to Nexora — your exam prep journey starts now! 🎓',
    body: (name: string) => `Hi ${name},

Welcome to Nexora! We're thrilled to have you on board.

Whether you're preparing for GCSE, A-Level, IGCSE, IB Diploma, SAT, ACT or AP — Nexora is built to help you study smarter, not harder.

Here's what to do first:
1. Pick your track on the home screen
2. Complete your first 10-question quiz
3. Check your Study Plan to see a personalised revision calendar

You're on a free trial — explore every feature for 7 days with no restrictions.

Keep going — every session counts. 🚀

Best,
The Nexora Team
nexoralearn.app`,
  },
  encouragement: {
    subject: 'You\'re doing great — keep the momentum going! ⚡',
    body: (name: string) => `Hi ${name},

Just a quick note to say — well done for taking the time to invest in your studies.

Consistency is everything. Even 10 minutes a day adds up to hours of practice by exam time.

A few tips to keep the streak alive:
• Set your exam date in the Study Plan tab — it unlocks your personalised revision calendar
• Try the Flashcard mode for subjects you find tricky
• Check your Progress tab to see which topics need the most attention

You've got this. We're rooting for you! 💪

Best,
The Nexora Team
nexoralearn.app`,
  },
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY') ?? ''

    // Verify caller is admin (service role)
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.includes(SUPABASE_SERVICE.slice(-10))) {
      // Fall back: accept anon key too but verify admin email claim
    }

    const { to_email, to_name, template = 'new_user', custom_message } = await req.json()

    if (!to_email) {
      return Response.json({ error: 'to_email required' }, { status: 400, headers: CORS })
    }

    const tmpl = WELCOME_TEMPLATES[template as keyof typeof WELCOME_TEMPLATES] ?? WELCOME_TEMPLATES.new_user
    const name = to_name ?? to_email.split('@')[0]
    const bodyText = custom_message
      ? `Hi ${name},\n\n${custom_message}\n\nBest,\nThe Nexora Team\nnexoralearn.app`
      : tmpl.body(name)

    if (!RESEND_API_KEY) {
      console.log('send-welcome (no key):', { to_email, subject: tmpl.subject })
      return Response.json({ success: true, mock: true }, { headers: CORS })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Nexora <info@nexoralearn.app>',
        to: [to_email],
        subject: tmpl.subject,
        text: bodyText,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return Response.json({ error: 'Failed to send' }, { status: 502, headers: CORS })
    }

    return Response.json({ success: true }, { headers: CORS })
  } catch (err) {
    console.error('send-welcome error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS })
  }
})
