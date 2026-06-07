// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url     = new URL(req.url)
  const certUid = url.searchParams.get('id') // format: NX-XXXX-XXXX

  if (!certUid) {
    return Response.json({ error: 'Missing certificate id' }, { status: 400, headers: CORS })
  }

  try {
    // Look up which profile owns this cert id
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,email,certificates,stream,streams&certificates=cs.{}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )
    if (!res.ok) throw new Error('db error')
    const profiles: any[] = await res.json()

    for (const p of profiles) {
      const certs = p.certificates ?? {}
      for (const [certType, earnedDate] of Object.entries(certs)) {
        // Reconstruct certId to verify
        const raw  = `${p.id}-${certType}-${earnedDate}`
        let hash   = 0
        for (let i = 0; i < raw.length; i++) {
          hash = ((hash << 5) - hash) + raw.charCodeAt(i)
          hash |= 0
        }
        const hex    = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
        const computed = `NX-${hex.slice(0,4)}-${hex.slice(4)}`

        if (computed === certUid) {
          return Response.json({
            valid:      true,
            certId:     certUid,
            certType,
            earnedDate,
            name:       p.display_name || p.email?.split('@')[0] || 'Scholar',
            stream:     p.stream,
          }, { headers: CORS })
        }
      }
    }

    return Response.json({ valid: false }, { status: 404, headers: CORS })
  } catch (err) {
    console.error('verify-cert error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS })
  }
})
