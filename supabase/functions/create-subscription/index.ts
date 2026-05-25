import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const PRICE_IDS: Record<string, string> = {
  premium: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') ?? '',
  group:   Deno.env.get('STRIPE_PRICE_GROUP_MONTHLY')   ?? '',
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { paymentMethodId, plan, userId } = await req.json()

    if (!paymentMethodId || !plan || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return Response.json({ error: `Unknown plan: ${plan}` }, { status: 400, headers: corsHeaders })
    }

    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      metadata: { supabase_uid: userId },
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent: Stripe.PaymentIntent
    }

    return Response.json({
      clientSecret:   invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    }, { headers: corsHeaders })

  } catch (err) {
    console.error('create-subscription error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
