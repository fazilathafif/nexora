// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STREAM_CONTEXTS: Record<string, string> = {
  gcse:   'GCSE student (age 14–16, UK). Subjects are graded 1–9. Relevant for UK secondary school pathways.',
  alevel: 'A-Level student (age 16–18, UK). Grades are A*–E. UCAS points apply. Students typically apply to UK universities via UCAS.',
  sat:    'High school student (USA) preparing for the SAT. Score range 400–1600. Applying to US colleges via Common App or Coalition.',
  act:    'High school student (USA) preparing for the ACT. Score range 1–36. Applying to US colleges.',
  ap:     'High school student (USA) taking AP exams. Scores 1–5. Strong scores (4–5) may earn college credit.',
  psat:   'High school student (USA) preparing for the PSAT/NMSQT. Qualification for National Merit Scholarship. Similar skills to SAT.',
}

const REGION: Record<string, string> = {
  gcse:   'UK',
  alevel: 'UK',
  sat:    'USA',
  act:    'USA',
  ap:     'USA',
  psat:   'USA',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { stream, subjects, avgAccuracy, targetGrade } = await req.json()

    if (!stream) {
      return Response.json({ error: 'Missing stream' }, { status: 400, headers: CORS })
    }

    const context   = STREAM_CONTEXTS[stream] ?? STREAM_CONTEXTS.sat
    const region    = REGION[stream] ?? 'USA'
    const isUK      = region === 'UK'
    const subjectList = Array.isArray(subjects) && subjects.length > 0
      ? subjects.join(', ')
      : 'not specified'

    const accuracyNote = avgAccuracy != null
      ? `The student's current quiz accuracy across their subjects is ${avgAccuracy}%.`
      : ''

    const targetNote = targetGrade
      ? `Their target entry grade is: ${targetGrade}.`
      : ''

    const universityPrompt = isUK
      ? `List 6 real UK universities that are a good match for a ${context} studying ${subjectList}.
${accuracyNote} ${targetNote}

Format each university as:
**[Tier]: [University Name]**
Entry requirements for ${subjectList}: [grades/UCAS points]
Notable for: [one sentence]

Use exactly 2 Reach, 2 Match, 2 Safety universities. Order: Reach first.
Use real, current UCAS entry requirements. Be specific — name the grade offer, not just the tariff.
After the list, add a single short paragraph with 2–3 actionable study tips based on the student's accuracy.
End with one sentence: "Always verify requirements at ucas.com before applying."
Total response: under 380 words. No waffle. No filler intro.`
      : `List 6 real US colleges/universities that are a good match for a ${context} studying ${subjectList}.
${accuracyNote} ${targetNote}

Format each as:
**[Tier]: [College Name]**
Typical mid-50% SAT/ACT for admission: [range]
Notable for: [one sentence]

Use exactly 2 Reach, 2 Match, 2 Safety colleges. Order: Reach first.
Use real, current admission statistics (Class of 2027–2028). Be specific.
After the list, add a short paragraph with 2–3 actionable study tips based on the student's accuracy.
End with one sentence: "Always verify requirements at commonapp.org before applying."
Total response: under 380 words. No waffle. No filler intro.`

    const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
    const apiKey       = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey) {
      return Response.json({ error: 'AI service not configured' }, { status: 503, headers: CORS })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 800,
        system:     'You are a university / college admissions advisor. Give precise, actionable advice using only real institutions. Never fabricate entry requirements.',
        messages:   [{ role: 'user', content: universityPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Claude API error:', err)
      return Response.json({ error: 'AI request failed' }, { status: 502, headers: CORS })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''

    return Response.json({ advice: text }, { headers: CORS })

  } catch (err) {
    console.error('advise error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500, headers: CORS },
    )
  }
})
