import { useMemo } from 'react'
import { getEffectivePlan, trialDaysLeft, PLANS, isPaid, canAccess } from '../lib/subscription.js'

/**
 * useSubscription(profile)
 * Returns the computed subscription state derived from the user's profile.
 * Zero network calls — everything is derived from the profile row already
 * loaded by useAuth.
 */
export function useSubscription(profile) {
  return useMemo(() => {
    const plan     = getEffectivePlan(profile)
    const limits   = PLANS[plan] ?? PLANS.free
    const daysLeft = plan === 'trial' ? trialDaysLeft(profile) : null

    return {
      plan,
      limits,
      daysLeft,
      isTrial:   plan === 'trial',
      isFree:    plan === 'free',
      isLite:    plan === 'lite',
      isPremium: plan === 'premium' || plan === 'group',
      isGroup:   plan === 'group',
      isPaid:    isPaid(profile),
      can:       (feature) => canAccess(profile, feature),
    }
  }, [profile])
}
