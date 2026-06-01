import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../context/SessionContext'
import type { SessionCheckpoint, SessionMode } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { QuestionCard } from '../components/QuestionCard'
import { LoadingQuestions } from '../components/LoadingQuestions'
import { PageHeader } from '../components/PageHeader'
import { QUESTION_TYPES } from '../constants'
import { FreeLimitError } from '../hooks/useGenerateQuestions'

type Difficulty = 'easy' | 'medium' | 'hard'

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? 'rgba(228,224,52,0.12)' : 'var(--bg-elevated)',
      border: `1px solid ${selected ? 'rgba(228,224,52,0.5)' : 'var(--border)'}`,
      color: selected ? 'var(--accent)' : 'var(--text-secondary)',
      borderRadius: 6, padding: '6px 14px',
      fontFamily: 'DM Sans, sans-serif', fontSize: '0.825rem', fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.1s',
    }}>{label}</button>
  )
}

export default function DrillPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state, currentQuestion, startSession, answerQuestion, nextQuestion, skipQuestion, recordTrapDiagnosis, reset, pauseSession, resumeSession } = useSession()
  const { user, profile, isPro } = useAuth()
  const queryClient = useQueryClient()

  const [questionType, setQuestionType] = useState(searchParams.get('type') ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [error, setError] = useState('')
  const [showExit, setShowExit] = useState(false)
  const [trapSelected, setTrapSelected] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  const { data: pausedDrill } = useQuery({
    queryKey: ['paused-session', user?.id, 'drill'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, mode, checkpoint, started_at')
        .eq('user_id', user!.id)
        .eq('status', 'paused')
        .eq('mode', 'drill')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!user && state.status === 'idle',
  })

  function handleResumePaused() {
    if (!pausedDrill?.checkpoint) return
    resumeSession(pausedDrill.id, 'drill' as SessionMode, pausedDrill.checkpoint as SessionCheckpoint)
  }

  async function handleAbandonPaused() {
    if (!pausedDrill) return
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', pausedDrill.id)
    queryClient.invalidateQueries({ queryKey: ['paused-session', user?.id, 'drill'] })
    queryClient.invalidateQueries({ queryKey: ['paused-session', user?.id] })
    setConfirmAbandon(false)
  }

  useEffect(() => {
    setTrapSelected(false)
  }, [state.currentIndex, state.sessionId])

  const handleTrapSelect = (trapType: string, correctDiagnosis: boolean) => {
    recordTrapDiagnosis(trapType, correctDiagnosis)
    setTrapSelected(true)
  }

  const handleStart = async () => {
    if (!questionType) { setError('Select a question type to drill.'); return }
    setError('')
    try {
      await startSession({ mode: 'drill', questionTypes: [questionType], difficulty, count: 10 })
    } catch (e) {
      if (e instanceof FreeLimitError) navigate('/upgrade')
      else setError('Failed to start drill. Try again.')
    }
  }

  const handleExit = () => { reset(); navigate('/dashboard') }

  const handlePause = async () => {
    setPausing(true)
    try {
      await pauseSession()
    } catch {
      setPausing(false)
      setError('Failed to save session. Please try again.')
    }
  }

  const lastResponse = state.responses[state.responses.length - 1]

  if (state.status === 'loading') return <LoadingQuestions />

  if ((state.status === 'active' || state.status === 'reviewing') && currentQuestion) {
    const exitModal = showExit && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px', maxWidth: 340, width: '90%' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', marginBottom: 20 }}>Exit this drill? Progress will be lost.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowExit(false)} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px', color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleExit} style={{ flex: 1, background: 'var(--wrong)', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Exit</button>
          </div>
        </div>
      </div>
    )
    const header = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Drill — {QUESTION_TYPES.find(t => t.value === questionType)?.label ?? questionType}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {error && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--wrong)' }}>{error}</span>}
          <button onClick={() => setShowExit(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}>✕ Abandon</button>
          <button onClick={handlePause} disabled={pausing} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 13px', cursor: pausing ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: pausing ? 0.6 : 1 }}>
            ⏸ {pausing ? 'Saving…' : 'Pause'}
          </button>
        </div>
      </div>
    )

    const canAdvance = trapSelected || lastResponse?.isCorrect || !currentQuestion.wrong_explanations?.length

    return (
      <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
        {exitModal}{header}
        <QuestionCard
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={state.questions.length}
          mode="drill"
          onAnswer={answerQuestion}
          answered={state.status === 'reviewing'}
          chosenIndex={lastResponse?.chosenIndex}
          showExplanation={state.status === 'reviewing'}
          questionsUsed={profile?.questions_used ?? 0}
          isPro={isPro}
          onTrapSelect={handleTrapSelect}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {state.status === 'active' && (
            <button onClick={skipQuestion} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Skip</button>
          )}
          {state.status === 'reviewing' && canAdvance && (
            <button onClick={nextQuestion} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px 28px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
              {state.currentIndex + 1 < state.questions.length ? 'Next →' : 'See Results →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
      <PageHeader title="Drill Mode" subtitle="Master one question type — 10 focused questions" />

      {/* Paused session guard */}
      {pausedDrill && !confirmAbandon && (
        <div style={{ background: 'rgba(228,224,52,0.07)', border: '1px solid rgba(228,224,52,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>⏸ You have a paused Drill session</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Question {((pausedDrill.checkpoint as SessionCheckpoint)?.currentIndex ?? 0) + 1} of {(pausedDrill.checkpoint as SessionCheckpoint)?.questions?.length ?? '?'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleResumePaused} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 7, padding: '7px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Resume →</button>
            <button onClick={() => setConfirmAbandon(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}>Start fresh</button>
          </div>
        </div>
      )}
      {pausedDrill && confirmAbandon && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 8 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 12 }}>Abandon your saved progress? This can't be undone.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAbandonPaused} style={{ background: 'var(--wrong)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Yes, abandon</button>
            <button onClick={() => setConfirmAbandon(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 7, padding: '7px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Question Type
          </label>
          <select value={questionType} onChange={e => setQuestionType(e.target.value)} style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
            borderRadius: 8, padding: '10px 14px', color: questionType ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
          }}>
            <option value="" style={{ color: 'var(--text-muted)' }}>Select a type…</option>
            {QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Difficulty</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <Chip key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} selected={difficulty === d} onClick={() => setDifficulty(d)} />
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          10 questions · Instant explanations after each answer
        </div>
        {error && <p style={{ color: 'var(--wrong)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        <button onClick={handleStart} disabled={!!pausedDrill} style={{
          background: pausedDrill ? 'var(--bg-elevated)' : 'var(--accent)',
          color: pausedDrill ? 'var(--text-muted)' : 'var(--accent-fg)',
          border: pausedDrill ? '1px solid var(--border)' : 'none',
          borderRadius: 8, padding: '13px 0',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem',
          cursor: pausedDrill ? 'not-allowed' : 'pointer',
        }}>{pausedDrill ? 'Resume or abandon your paused session first' : 'Start Drill →'}</button>
      </div>
    </div>
  )
}
