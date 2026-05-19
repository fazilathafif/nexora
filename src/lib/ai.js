const FN_URL   = 'https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain'
const JWT_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3V2cmF4cXV4ZGpnZnhsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTQ1NzgsImV4cCI6MjA5NDY3MDU3OH0.v3f8GYT2_A7LfuKZZTeGMn2Lwy2A4AKucw6p7HyrYMg'

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
