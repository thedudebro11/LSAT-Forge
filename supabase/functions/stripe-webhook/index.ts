import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13'
import { corsHeaders } from '../_shared/cors.ts'
import { serviceClient, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const signature = req.headers.get('stripe-signature')
  const body = await req.text() // must be raw text before parsing

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
  const supabase = serviceClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId || !session.subscription) break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = sub.items.data[0]?.price.id
      // Determine tier from which price was purchased — NEVER write 'pro' (see docs/INVARIANTS.md §2)
      const tier = priceId === Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ? 'annual' : 'monthly'
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

      await supabase.from('profiles').update({
        tier,
        stripe_subscription_id: sub.id,
        subscription_status: 'active',
        subscription_period_end: periodEnd,
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const { data: profile } = await supabase
        .from('profiles').select('id')
        .eq('stripe_customer_id', sub.customer).single()
      if (!profile) break

      const priceId = sub.items.data[0]?.price.id
      const tier = priceId === Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ? 'annual' : 'monthly'

      await supabase.from('profiles').update({
        tier: sub.status === 'active' ? tier : 'free',
        subscription_status: sub.status,
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', profile.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { data: profile } = await supabase
        .from('profiles').select('id')
        .eq('stripe_customer_id', sub.customer).single()
      if (!profile) break

      await supabase.from('profiles').update({
        tier: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
      }).eq('id', profile.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const { data: profile } = await supabase
        .from('profiles').select('id')
        .eq('stripe_customer_id', invoice.customer).single()
      if (!profile) break

      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('id', profile.id)
      break
    }
  }

  return json({ received: true })
})
