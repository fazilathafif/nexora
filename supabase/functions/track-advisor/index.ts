// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_TRACKS = ['gcse', 'alevel', 'sat', 'act', 'ap', 'psat']

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { country, year, goal } = await req.json()

    if (!country || !year) {
      return Response.json({ error: 'Missing country or year' }, { status: 400, headers: CORS })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured' }, { status: 503, headers: CORS })
    }

    const isUK = country === 'uk'

    const prompt = isUK
      ? `A UK student is in Year ${year} (age ~${year + 4}). Their goal: ${goal ?? 'university'}.

Recommend which exam track(s) they should enrol in from this list ONLY: gcse, alevel.
- Year 7–11 → gcse
- Year 12–13 → alevel
- Year 11 considering ahead → gcse + alevel

Return ONLY valid JSON (no markdown, no extra text):
{"tracks": ["gcse"], "reason": "one sentence explaining why"}

The reason should be warm, specific to their year and goal.`
      : `A US student is in Grade ${year}. Their university goal: ${goal ?? 'college'}.

Recommend which exam track(s) they should enrol in from this list ONLY: sat, act, ap, psat.
- Grade 9–10 → psat, sat
- Grade 11 → sat, act (+ ap if goal is ivy/top)
- Grade 12 → sat, act (+ ap if they haven't taken it)
- Goal "ivy" → always include ap

Return ONLY valid JSON (no markdown, no extra text):
{"tracks": ["sat", "ap"], "reason": "one sentence explaining why"}

The reason should be warm, specific to their grade and goal.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system:     'You are an academic advisor. Always respond with valid JSON only — no markdown fences, no preamble.',
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      return Response.json({ error: 'AI request failed' }, { status: 502, headers: CORS })
    }

    const data  = await res.json()
    const text  = (data.content?.[0]?.text ?? '').trim()

    let parsed: { tracks: string[]; reason: string }
    try {
      parsed = JSON.parse(text)
    } catch {
      // Fallback: rule-based if model returns non-JSON
      parsed = isUK
        ? { tracks: year <= 11 ? ['gcse'] : ['alevel'], reason: `Year ${year} UK students typically follow the ${year <= 11 ? 'GCSE' : 'A-Level'} curriculum.` }
        : { tracks: goal === 'ivy' ? ['sat', 'ap'] : ['sat', 'act'], reason: `Grade ${year} US students preparing for ${goal === 'ivy' ? 'selective universities' : 'college'} typically sit ${goal === 'ivy' ? 'SAT + AP' : 'SAT + ACT'}.` }
    }

    // Sanitise: only return tracks that exist in the app
    parsed.tracks = (parsed.tracks ?? []).filter((t: string) => VALID_TRACKS.includes(t))
    if (parsed.tracks.length === 0) {
      parsed.tracks = isUK ? (year <= 11 ? ['gcse'] : ['alevel']) : ['sat']
    }

    return Response.json(parsed, { headers: CORS })

  } catch (err) {
    console.error('track-advisor error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500, headers: CORS },
    )
  }
})
