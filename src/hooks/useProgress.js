/**
 * useProgress — wraps all score/XP/streak writes so quiz screens
 * stay clean and don't need to know about Supabase directly.
 */

import { useState, useRef } from 'react'
import {
  createSession,
  completeSession,
  recordAnswer,
  addXp,
  touchDailyActivity,
  upsertProfile,
} from '../lib/db.js'

export function useProgress(user, profile, refreshProfile) {
  const [sessionId,   setSessionId]   = useState(null)
  const sessionStart  = useRef(null)

  /**
   * Call when a quiz begins.
   */
  async function startQuizSession(stream, subject, totalQuestions) {
    if (!user) return
    sessionStart.current = Date.now()
    const { data } = await createSession({
      userId: user.id, stream, subject, totalQuestions,
    })
    if (data) setSessionId(data.id)
  }

  /**
   * Call after each answer.
   */
  async function submitAnswer({ questionId, topic, chosenIndex, correctIndex, hintUsed, stream }) {
    if (!user || !sessionId) return
    await recordAnswer({
      sessionId,
      userId:       user.id,
      questionId,
      topic,
      chosenIndex,
      correctIndex,
      hintUsed,
      stream,
    })
  }

  /**
   * Call when quiz ends.
   * Handles XP award, streak update, session close.
   */
  async function finishQuizSession(score, stream) {
    if (!user || !sessionId) return

    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000)
    const xpEarned = score * (stream === 'alevel' ? 15 : 10)

    // Parallel writes — don't await sequentially
    await Promise.all([
      completeSession(sessionId, { score, durationSeconds }),
      addXp(user.id, xpEarned),
      touchDailyActivity(user.id),
      updateStreak(user.id),
    ])

    await refreshProfile()
    setSessionId(null)
    return xpEarned
  }

  async function updateStreak(userId) {
    const today     = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const lastActive = profile?.last_active_date

    let newStreak = 1
    if (lastActive === yesterday) newStreak = (profile?.streak ?? 0) + 1
    else if (lastActive === today) newStreak = profile?.streak ?? 1

    await upsertProfile(userId, {
      streak:           newStreak,
      last_active_date: today,
    })
  }

  return { startQuizSession, submitAnswer, finishQuizSession }
}
