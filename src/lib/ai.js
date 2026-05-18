import { supabase, isSupabaseConfigured } from './supabase.js'

/**
 * Fetch an AI explanation via the Supabase Edge Function `explain`.
 * Falls back to a static hint when Supabase is not configured.
 */
export async function fetchExplanation(question, chosenIdx, stream) {
  if (!isSupabaseConfigured) {
    return `The correct answer is "${question.opts[question.ans]}". ${question.hint}. Work through the hint step by step — you've got this! 💪`
  }

  try {
    const { data, error } = await supabase.functions.invoke('explain', {
      body: { question, chosenIdx, stream },
    })
    if (error) throw error
    return data?.explanation ?? fallback(question)
  } catch {
    return fallback(question)
  }
}

function fallback(question) {
  return `The correct answer is "${question.opts[question.ans]}". ${question.hint}. Keep practising — the method will click! 💪`
}
