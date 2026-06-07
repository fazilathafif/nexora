const FN_URL      = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain'
const ADVISOR_URL = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/track-advisor'
const JWT_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3V2cmF4cXV4ZGpnZnhsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTQ1NzgsImV4cCI6MjA5NDY3MDU3OH0.v3f8GYT2_A7LfuKZZTeGMn2Lwy2A4AKucw6p7HyrYMg'

export async function fetchTrackRecommendation(context) {
  try {
    const res = await fetch(ADVISOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': JWT_KEY,
        'Authorization': `Bearer ${JWT_KEY}`,
      },
      body: JSON.stringify(context),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error('non-2xx')
    const data = await res.json()
    return data // { tracks: string[], reason: string }
  } catch {
    return advisorFallback(context)
  }
}

function advisorFallback({ country, year, goal }) {
  // UK
  if (country === 'uk') {
    const tracks = year <= 11 ? ['gcse'] : ['alevel']
    return {
      tracks,
      reason: `Year ${year} UK students typically follow the ${tracks[0].toUpperCase()} curriculum.`,
    }
  }
  // US / Canada
  if (country === 'us' || country === 'canada') {
    const tracks = goal === 'ivy' ? ['sat', 'ap'] : ['sat', 'act']
    return {
      tracks,
      reason: `Students aiming for ${goal === 'ivy' ? 'selective universities' : 'college'} in North America usually prepare for ${tracks.join(' + ').toUpperCase()}.`,
    }
  }
  // International — IB or IGCSE depending on year
  const tracks = year <= 11 ? ['igcse', 'ib'] : ['ib']
  return {
    tracks,
    reason: `International students in Year/Grade ${year} typically follow the ${tracks.includes('igcse') ? 'IGCSE then IB Diploma pathway' : 'IB Diploma'}, recognised by universities worldwide.`,
  }
}

export async function fetchExplanation(question, chosenIdx, stream) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(FN_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': JWT_KEY,
        'Authorization': `Bearer ${JWT_KEY}`,
      },
      body: JSON.stringify({ question, chosenIdx, stream }),
    })
    clearTimeout(timer)
    if (!res.ok) return fallback(question)
    const data = await res.json()
    return data?.explanation ?? fallback(question)
  } catch {
    return fallback(question)
  }
}

function fallback(question) {
  return `The correct answer is "${question.opts[question.ans]}". ${question.hint}. Keep practising — the method will click!`
}
