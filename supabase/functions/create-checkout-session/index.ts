import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthUser, serviceClient, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const user = await getAuthUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const supabase = serviceClient()
  const { priceId } = await req.json() as { priceId: string }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  if (!profile) return json({ error: 'Profile not found' }, 404)

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile.email })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:5173'
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade`,
    metadata: { supabase_user_id: user.id },
  })

  return json({ url: session.url })
})
