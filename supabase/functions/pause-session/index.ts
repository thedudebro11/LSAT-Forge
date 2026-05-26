import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthUser, serviceClient, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const user = await getAuthUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const supabase = serviceClient()
  const body = await req.json()
  const { sessionId, checkpoint } = body as {
    sessionId: string
    checkpoint: { currentIndex: number; questions: unknown[]; responses: unknown[] }
  }

  if (!sessionId || !checkpoint) return json({ error: 'Missing sessionId or checkpoint' }, 400)

  const { data: session } = await supabase
    .from('sessions')
    .select('id, user_id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return json({ error: 'Session not found' }, 404)
  if (session.status === 'completed') return json({ error: 'Session already completed' }, 409)

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'paused', checkpoint })
    .eq('id', sessionId)

  if (error) return json({ error: 'Failed to save checkpoint' }, 500)

  return json({ success: true })
})
