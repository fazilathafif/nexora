/**
 * /api/stripe-webhook
 * Vercel serverless function — receives Stripe webhook events and
 * syncs subscription state into Supabase profiles.
 *
 * Required env vars (set in Vercel dashboard, NOT prefixed with VITE_):
 *   STRIPE_SECRET_KEY          — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET      — whsec_... (from Stripe dashboard → webhooks)
 *   SUPABASE_URL               — same as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service-role key (bypasses RLS)
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ── Stripe + Supabase clients ─────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// ── Price → plan mapping (fill in your real price IDs after creating in Stripe)
const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_LITE_MONTHLY]:    'lite',
  [process.env.STRIPE_PRICE_LITE_ANNUAL]:     'lite',
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY]: 'premium',
  [process.env.STRIPE_PRICE_PREMIUM_ANNUAL]:  'premium',
}

// ── Raw body buffer (required for Stripe signature verification) ──────────────
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const db = supabaseAdmin()

  try {
    switch (event.type) {

      // ── Checkout completed: customer just subscribed ──────────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object
        const customerId = session.customer
        const userId     = session.metadata?.user_id  // passed via checkout session metadata

        if (!userId) break

        const sub = await stripe.subscriptions.retrieve(session.subscription)
        const priceId = sub.items.data[0]?.price?.id
        const plan    = PRICE_TO_PLAN[priceId] ?? 'lite'

        await db.from('profiles').update({
          plan,
          stripe_customer_id:              customerId,
          stripe_subscription_id:          sub.id,
          stripe_price_id:                 priceId,
          subscription_status:             sub.status,
          subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', userId)

        // If referred, mark referral as converted and reward referrer
        await rewardReferrer(db, userId)
        break
      }

      // ── Subscription updated (plan change, renewal, trial end) ───────────
      case 'customer.subscription.updated': {
        const sub     = event.data.object
        const priceId = sub.items.data[0]?.price?.id
        const plan    = PRICE_TO_PLAN[priceId] ?? 'free'

        await db.from('profiles').update({
          plan,
          stripe_price_id:                 priceId,
          subscription_status:             sub.status,
          subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await db.from('profiles').update({
          plan:                            'free',
          stripe_subscription_id:          null,
          stripe_price_id:                 null,
          subscription_status:             'canceled',
          subscription_current_period_end: null,
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Payment failed — flag but keep access during grace period ─────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await db.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Internal error processing event' })
  }

  return res.status(200).json({ received: true })
}

// ── Referral reward helper ────────────────────────────────────────────────────
async function rewardReferrer(db, referredUserId) {
  const { data: referral } = await db
    .from('referrals')
    .select('id, referrer_id')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .single()

  if (!referral) return

  // Mark converted
  await db.from('referrals').update({
    status: 'converted',
    rewarded_at: new Date().toISOString(),
  }).eq('id', referral.id)

  // Extend the referrer's current period by 1 month via Stripe coupon
  const { data: referrer } = await db
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', referral.referrer_id)
    .single()

  if (referrer?.stripe_subscription_id) {
    try {
      const coupon = await stripe.coupons.create({
        duration: 'once',
        percent_off: 100,
        name: 'Referral reward — 1 free month',
        max_redemptions: 1,
      })
      await stripe.subscriptions.update(referrer.stripe_subscription_id, {
        coupon: coupon.id,
      })
    } catch (err) {
      console.error('Failed to apply referral coupon:', err.message)
    }
  }
}

// Disable Vercel's default body parser so we get the raw buffer
export const config = { api: { bodyParser: false } }
