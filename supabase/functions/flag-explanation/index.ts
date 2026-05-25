import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthUser, serviceClient, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const user = await getAuthUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const body = await req.json()
  const { question_type, stimulus, stem, explanation, rating, comment } = body as {
    question_type: string
    stimulus: string
    stem: string
    explanation: string
    rating: 'helpful' | 'not_helpful'
    comment?: string
  }

  if (!rating || !['helpful', 'not_helpful'].includes(rating)) {
    return json({ error: 'Invalid rating' }, 400)
  }

  const supabase = serviceClient()
  await supabase.from('flagged_explanations').insert({
    user_id: user.id,
    question_type,
    stimulus,
    stem,
    explanation,
    rating,
    comment: comment ?? null,
  })

  return json({ success: true })
})
