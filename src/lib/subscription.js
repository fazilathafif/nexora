/**
 * subscription.js — plan definitions, feature limits, and helper functions.
 * Import this anywhere in the frontend; no Supabase calls here.
 */

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = {
  trial: {
    name:            'Free Trial',
    badge:           '✦ Trial',
    badgeColor:      '#7C3AED',
    questionsPerDay: Infinity,
    flashcardsPerDay:Infinity,
    aiUsesPerDay:    5,
    subjects:        Infinity,   // all subjects
    mockExams:       true,
    deepDive:        true,
    progressFull:    true,
  },
  free: {
    name:            'Freemium',
    badge:           'Free',
    badgeColor:      '#64748B',
    questionsPerDay: 15,
    flashcardsPerDay:20,
    aiUsesPerDay:    0,
    subjects:        2,
    mockExams:       false,
    deepDive:        false,
    progressFull:    false,
  },
  lite: {
    name:            'Lite',
    badge:           '⚡ Lite',
    badgeColor:      '#0891B2',
    questionsPerDay: 50,
    flashcardsPerDay:Infinity,
    aiUsesPerDay:    10,
    subjects:        Infinity,
    mockExams:       true,
    deepDive:        false,
    progressFull:    true,
  },
  premium: {
    name:            'Premium',
    badge:           '★ Premium',
    badgeColor:      '#FF6B35',
    questionsPerDay: Infinity,
    flashcardsPerDay:Infinity,
    aiUsesPerDay:    Infinity,
    subjects:        Infinity,
    mockExams:       true,
    deepDive:        true,
    progressFull:    true,
  },
  group: {
    name:            'Group',
    badge:           '🏫 Group',
    badgeColor:      '#059669',
    questionsPerDay: Infinity,
    flashcardsPerDay:Infinity,
    aiUsesPerDay:    Infinity,
    subjects:        Infinity,
    mockExams:       true,
    deepDive:        true,
    progressFull:    true,
  },
}

// ── Stripe price IDs (fill in after creating products in Stripe dashboard) ────
// These are used when building the Checkout session URL on the server.
export const STRIPE_PRICES = {
  lite_monthly:    import.meta.env.VITE_STRIPE_PRICE_LITE_MONTHLY    ?? '',
  lite_annual:     import.meta.env.VITE_STRIPE_PRICE_LITE_ANNUAL     ?? '',
  premium_monthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY ?? '',
  premium_annual:  import.meta.env.VITE_STRIPE_PRICE_PREMIUM_ANNUAL  ?? '',
}

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the plan key that should be enforced for a given profile.
 * Handles trial expiry automatically.
 */
export function getEffectivePlan(profile) {
  if (!profile) return 'free'
  const p = profile.plan ?? 'trial'
  if (p === 'trial') {
    const endsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    if (!endsAt || endsAt <= new Date()) return 'free'
  }
  return p
}

/** Days remaining in the free trial (0 if expired or not on trial). */
export function trialDaysLeft(profile) {
  if (!profile?.trial_ends_at) return 0
  const diff = new Date(profile.trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

/** Whether the profile currently has an active paid subscription. */
export function isPaid(profile) {
  const plan = getEffectivePlan(profile)
  return plan === 'lite' || plan === 'premium' || plan === 'group'
}

/** Whether the profile can access a specific feature. */
export function canAccess(profile, feature) {
  const plan   = getEffectivePlan(profile)
  const limits = PLANS[plan] ?? PLANS.free
  return !!limits[feature]
}

/** Whether the profile has hit its daily AI usage limit. */
export function aiLimitReached(profile, usedToday) {
  const plan  = getEffectivePlan(profile)
  const limit = PLANS[plan]?.aiUsesPerDay ?? 0
  if (limit === Infinity) return false
  return usedToday >= limit
}
