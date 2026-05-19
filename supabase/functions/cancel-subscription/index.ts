import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthUser, serviceClient, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const user = await getAuthUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const supabase = serviceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) return json({ error: 'No active subscription' }, 400)

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  return json({ success: true })
})
