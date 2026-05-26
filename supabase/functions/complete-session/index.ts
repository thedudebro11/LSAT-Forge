import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthUser, serviceClient, json } from '../_shared/auth.ts'

const SCORE_BANDS = [
  { min: 0,  max: 29,  lo: 120, hi: 139 },
  { min: 30, max: 44,  lo: 140, hi: 149 },
  { min: 45, max: 54,  lo: 150, hi: 154 },
  { min: 55, max: 64,  lo: 155, hi: 159 },
  { min: 65, max: 73,  lo: 160, hi: 164 },
  { min: 74, max: 81,  lo: 165, hi: 169 },
  { min: 82, max: 88,  lo: 170, hi: 174 },
  { min: 89, max: 100, lo: 175, hi: 180 },
]

function estimateScore(accuracyPct: number) {
  const band = SCORE_BANDS.find(b => accuracyPct >= b.min && accuracyPct <= b.max)
    ?? SCORE_BANDS[0]
  return { lo: band.lo, hi: band.hi }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const user = await getAuthUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const supabase = serviceClient()
  const body = await req.json()
  const { sessionId, responses, totalTimeSeconds } = body as {
    sessionId: string
    responses: Array<{
      questionType: string
      difficulty: string
      chosenIndex: number
      correctIndex: number
      isCorrect: boolean
      timeSpentSeconds: number
      selectedTrapType?: string
      correctDiagnosis?: boolean
    }>
    totalTimeSeconds: number
  }

  // Verify session belongs to user
  const { data: session } = await supabase
    .from('sessions')
    .select('id, mode, user_id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return json({ error: 'Session not found' }, 404)
  if (session.status === 'completed') return json({ error: 'Session already completed' }, 409)

  const correct = responses.filter(r => r.isCorrect).length
  const total = responses.length
  const scorePct = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0

  // Insert responses
  await supabase.from('responses').insert(
    responses.map(r => ({
      session_id: sessionId,
      user_id: user.id,
      question_type: r.questionType,
      difficulty: r.difficulty,
      chosen_index: r.chosenIndex,
      correct_index: r.correctIndex,
      is_correct: r.isCorrect,
      time_spent_seconds: r.timeSpentSeconds,
      selected_trap_type: r.selectedTrapType ?? null,
      correct_diagnosis: r.correctDiagnosis ?? null,
    }))
  )

  // Update session and clear checkpoint
  await supabase.from('sessions').update({
    status: 'completed',
    correct_count: correct,
    score_pct: scorePct,
    time_taken_seconds: totalTimeSeconds,
    completed_at: new Date().toISOString(),
    checkpoint: null,
  }).eq('id', sessionId)

  // Update type stats
  await supabase.rpc('update_type_stats', {
    p_user_id: user.id,
    p_session_id: sessionId,
  })

  // Increment questions_used by actual question count (free tier only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, questions_used')
    .eq('id', user.id)
    .single()

  if (profile?.tier === 'free') {
    await supabase.from('profiles').update({
      questions_used: (profile.questions_used ?? 0) + total,
    }).eq('id', user.id)
  }

  // Simulation: insert score result
  if (session.mode === 'simulation') {
    const { lo, hi } = estimateScore(scorePct)
    await supabase.from('simulation_results').insert({
      user_id: user.id,
      session_id: sessionId,
      total_correct: correct,
      total_questions: total,
      estimated_score_low: lo,
      estimated_score_high: hi,
    })
  }

  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return json({ profile: updatedProfile, scorePct, correct, total })
})
