# LSAT Forge — Stripe Integration Spec

## Overview

Stripe handles all payment processing. Supabase Edge Functions handle webhooks.
Never store card data. Use Stripe Checkout for the payment flow.

---

## Products to Create in Stripe Dashboard

```
Product: LSAT Forge Pro
  Price 1: $29.00/month (recurring) → save price ID as STRIPE_MONTHLY_PRICE_ID
  Price 2: $199.00/year (recurring) → save price ID as STRIPE_ANNUAL_PRICE_ID
```

---

## Environment Variables Needed

```bash
# In Supabase Edge Function secrets + Vercel env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
```

---

## Flow 1: User Clicks Upgrade

1. Frontend calls edge function `create-checkout-session`
2. Edge function creates Stripe Checkout Session
3. User redirected to Stripe-hosted checkout page
4. On success: Stripe redirects to `/success?session_id={CHECKOUT_SESSION_ID}`
5. Webhook fires → update profile tier to 'pro'

---

## Edge Function: create-checkout-session

```typescript
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'https://esm.sh/stripe@13'

serve(async (req) => {
  // Auth check (same pattern as generate-questions)
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  const { priceId } = await req.json() // monthly or annual price ID
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'))

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile.email })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/upgrade`,
    metadata: { supabase_user_id: user.id }
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Edge Function: stripe-webhook

```typescript
// supabase/functions/stripe-webhook/index.ts
// This function handles all Stripe events that affect user state

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'))

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata.supabase_user_id
      const subscriptionId = session.subscription

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

      await supabase.from('profiles').update({
        tier: 'pro',
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        subscription_period_end: periodEnd
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', sub.customer)
        .single()

      if (profile) {
        await supabase.from('profiles').update({
          subscription_status: sub.status,
          subscription_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }).eq('id', profile.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', sub.customer)
        .single()

      if (profile) {
        await supabase.from('profiles').update({
          tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null
        }).eq('id', profile.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', invoice.customer)
        .single()

      if (profile) {
        await supabase.from('profiles').update({
          subscription_status: 'past_due'
        }).eq('id', profile.id)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
```

---

## Edge Function: cancel-subscription

```typescript
// Called from /account page when user clicks Cancel
serve(async (req) => {
  const user = await getAuthUser(req)
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  // Cancel at period end — don't revoke immediately
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true
  })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Stripe Webhook Setup

In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

---

## Frontend Upgrade Flow

```typescript
// In /upgrade page or any upgrade CTA
const handleUpgrade = async (plan: 'monthly' | 'annual') => {
  const priceId = plan === 'monthly' 
    ? import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID
    : import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId }
  })

  if (data?.url) window.location.href = data.url
}
```

---

## Customer Portal (Self-Service Billing)

Add a "Manage Billing" button in /account that redirects to Stripe Customer Portal:

```typescript
// Edge function: create-portal-session
const portalSession = await stripe.billingPortal.sessions.create({
  customer: profile.stripe_customer_id,
  return_url: `${origin}/account`
})
return new Response(JSON.stringify({ url: portalSession.url }))
```

This lets users update payment method, view invoices, and cancel without you building any of that UI.
