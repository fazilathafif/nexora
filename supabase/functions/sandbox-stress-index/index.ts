// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

/**
 * GET /functions/v1/sandbox-stress-index
 *
 * Calculates S = Σ(stressWeight) for all deadlines due within the next 7 days.
 * If S > 8, sets stress_mode=true in sb_sandbox_profile (sidecar only).
 * Returns the index to the frontend for the De-stress Target Adjuster.
 *
 * ZERO modifications to existing core tables.
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

    // ── Feature flag ──────────────────────────────────────────────────────────
    const flagRes = await fetch(`${SUPABASE_URL}/rest/v1/sb_feature_flags?key=eq.ib_survival_sandbox&select=enabled`, {
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    })
    const flags = await flagRes.json()
    if (!flags[0]?.enabled) {
      return Response.json({ stress_index: 0, stress_mode: false }, { headers: CORS })
    }

    // ── Get user ──────────────────────────────────────────────────────────────
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: authHeader },
    })
    const { id: userId } = await userRes.json()
    if (!userId) return Response.json({ error: 'Invalid session' }, { status: 401, headers: CORS })

    // ── Fetch upcoming deadlines (next 7 days) from sidecar table ─────────────
    const today    = new Date()
    const in7Days  = new Date(today)
    in7Days.setDate(today.getDate() + 7)
    const todayStr   = today.toISOString().split('T')[0]
    const in7DaysStr = in7Days.toISOString().split('T')[0]

    const dlRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sb_assessment_deadline?user_id=eq.${userId}&completed=eq.false&deadline_date=gte.${todayStr}&deadline_date=lte.${in7DaysStr}&select=stress_weight,title,deadline_date`,
      { headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` } }
    )
    const deadlines: Array<{ stress_weight: number; title: string; deadline_date: string }> = await dlRes.json()

    // ── S = Σ(stressWeight) ───────────────────────────────────────────────────
    const stressIndex  = Array.isArray(deadlines)
      ? deadlines.reduce((sum, d) => sum + (d.stress_weight ?? 0), 0)
      : 0
    const stressMode   = stressIndex > 8

    // ── Update sidecar stress cache (upsert, NOT touching core tables) ────────
    await fetch(`${SUPABASE_URL}/rest/v1/sb_stress_cache`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: userId, stress_index: stressIndex, computed_at: new Date().toISOString() }),
    })

    // Update stress_mode flag in sandbox profile
    await fetch(`${SUPABASE_URL}/rest/v1/sb_sandbox_profile?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE,
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stress_mode: stressMode, updated_at: new Date().toISOString() }),
    })

    return Response.json({
      stress_index:      stressIndex,
      stress_mode:       stressMode,
      deadlines_in_week: Array.isArray(deadlines) ? deadlines.length : 0,
      threshold:         8,
      // De-stress target adjustment: if S > 8, halve daily session target
      target_adjustment: stressMode ? 0.5 : 1.0,
    }, { headers: CORS })

  } catch (err) {
    console.error('sandbox-stress-index error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS })
  }
})
