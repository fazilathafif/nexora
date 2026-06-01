// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

/**
 * GET /functions/v1/sandbox-recommendations
 *
 * Reads the user's sb_ia_tracker rows, takes the syllabus_topic_id from each,
 * and proxies into the existing question taxonomy to return relevant practice questions.
 *
 * ZERO modifications to existing tables — read-only proxy.
 * Feature flag: sb_feature_flags.key = 'ib_survival_sandbox'
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })

    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // ── 1. Feature flag check ──────────────────────────────────────────────────
    const flagRes = await fetch(`${SUPABASE_URL}/rest/v1/sb_feature_flags?key=eq.ib_survival_sandbox&select=enabled`, {
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    })
    const flags = await flagRes.json()
    if (!flags[0]?.enabled) {
      return Response.json({ error: 'Feature not enabled' }, { status: 403, headers: CORS })
    }

    // ── 2. Get user from JWT ───────────────────────────────────────────────────
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: authHeader },
    })
    const { id: userId } = await userRes.json()
    if (!userId) return Response.json({ error: 'Invalid session' }, { status: 401, headers: CORS })

    // ── 3. Read IA tracker rows for this user ─────────────────────────────────
    // READ-ONLY from sidecar table — no existing tables touched
    const iaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sb_ia_tracker?user_id=eq.${userId}&select=subject_id,syllabus_topic_id,title`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } }
    )
    const iaRows: Array<{ subject_id: string; syllabus_topic_id: string; title: string }> = await iaRes.json()

    if (!iaRows?.length) {
      return Response.json({ recommendations: [], message: 'No IA trackers found' }, { headers: CORS })
    }

    // ── 4. Proxy into existing question taxonomy ───────────────────────────────
    // Uses the READ-ONLY answers table to find relevant past questions by topic.
    // No writes. No modifications to existing tables.
    const recommendations = await Promise.all(
      iaRows.map(async (ia) => {
        // Fetch up to 5 questions from the existing answers taxonomy
        // by matching stream='ib', subject=subject_id, topic=syllabus_topic_id
        const qRes = await fetch(
          `${SUPABASE_URL}/rest/v1/answers?stream=eq.ib&subject=eq.${ia.subject_id}&topic=eq.${encodeURIComponent(ia.syllabus_topic_id)}&select=question_id,topic,is_correct&limit=5`,
          { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } }
        )
        const questions = await qRes.json()

        return {
          subject_id:         ia.subject_id,
          syllabus_topic_id:  ia.syllabus_topic_id,
          ia_title:           ia.title ?? ia.subject_id,
          // Launch URL: passes directly to existing quiz engine
          quiz_launch_url:    `/ib/quiz/${ia.subject_id}?topic=${encodeURIComponent(ia.syllabus_topic_id)}`,
          sample_questions:   Array.isArray(questions) ? questions.slice(0, 5) : [],
        }
      })
    )

    return Response.json({ recommendations }, { headers: CORS })

  } catch (err) {
    console.error('sandbox-recommendations error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS })
  }
})
