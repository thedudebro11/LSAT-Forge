import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../context/SessionContext'
import type { SessionCheckpoint, SessionMode } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { QuestionCard } from '../components/QuestionCard'
import { LoadingQuestions } from '../components/LoadingQuestions'
import { PageHeader } from '../components/PageHeader'
import { QUESTION_TYPES, DIFFICULTY_OPTIONS } from '../constants'
import { FreeLimitError, ProRequiredError } from '../hooks/useGenerateQuestions'

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'

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

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '32px', maxWidth: 360, width: '90%',
      }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', margin: '0 0 10px', color: 'var(--text-primary)' }}>
          Exit session?
        </h3>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
          Your progress will be lost. Use Pause to save and resume later.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '9px', color: 'var(--text-primary)',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500, cursor: 'pointer',
          }}>Keep going</button>
          <button onClick={onConfirm} style={{
            flex: 1, background: 'var(--wrong)', border: 'none',
            borderRadius: 8, padding: '9px', color: '#fff',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer',
          }}>Exit</button>
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  const navigate = useNavigate()
  const { state, currentQuestion, startSession, answerQuestion, nextQuestion, skipQuestion, recordTrapDiagnosis, reset, pauseSession, resumeSession } = useSession()
  const { user, profile, isPro } = useAuth()
  const queryClient = useQueryClient()

  // Setup state
  const [allTypes, setAllTypes] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed')
  const [count, setCount] = useState(5)
  const [error, setError] = useState('')
  const [showExit, setShowExit] = useState(false)
  const [trapSelected, setTrapSelected] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  const { data: pausedPractice } = useQuery({
    queryKey: ['paused-session', user?.id, 'practice'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, mode, checkpoint, started_at')
        .eq('user_id', user!.id)
        .eq('status', 'paused')
        .eq('mode', 'practice')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!user && state.status === 'idle',
  })

  function handleResumePaused() {
    if (!pausedPractice?.checkpoint) return
    resumeSession(pausedPractice.id, 'practice' as SessionMode, pausedPractice.checkpoint as SessionCheckpoint)
  }

  async function handleAbandonPaused() {
    if (!pausedPractice) return
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', pausedPractice.id)
    queryClient.invalidateQueries({ queryKey: ['paused-session', user?.id, 'practice'] })
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

  const toggleType = (v: string) => {
    setAllTypes(false)
    setSelectedTypes(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }

  const handleGenerate = async () => {
    setError('')
    const types = allTypes ? ['all'] : selectedTypes
    if (types.length === 0) { setError('Select at least one question type.'); return }
    try {
      await startSession({ mode: 'practice', questionTypes: types, difficulty, count })
    } catch (e) {
      if (e instanceof FreeLimitError) navigate('/upgrade')
      else if (e instanceof ProRequiredError) navigate('/upgrade')
      else setError('Failed to generate questions. Try again.')
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

  // Loading
  if (state.status === 'loading') return <LoadingQuestions />

  // Session active/reviewing
  if ((state.status === 'active' || state.status === 'reviewing') && currentQuestion) {
    const exitBtn = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setShowExit(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--text-muted)',
          textDecoration: 'underline', padding: 0,
        }}>✕ Abandon</button>
        {error && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--wrong)' }}>{error}</span>}
        <button onClick={handlePause} disabled={pausing} style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '6px 14px', cursor: pausing ? 'wait' : 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-secondary)',
          opacity: pausing ? 0.6 : 1,
        }}>⏸ {pausing ? 'Saving…' : 'Pause'}</button>
      </div>
    )

    const canAdvance = trapSelected || lastResponse?.isCorrect || !currentQuestion.wrong_explanations?.length

    return (
      <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
        {showExit && <ConfirmModal onConfirm={handleExit} onCancel={() => setShowExit(false)} />}
        {exitBtn}
        <QuestionCard
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={state.questions.length}
          mode="practice"
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
            <button onClick={skipQuestion} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 20px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}>Skip</button>
          )}
          {state.status === 'reviewing' && canAdvance && (
            <button onClick={nextQuestion} style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              padding: '10px 28px', fontFamily: 'Syne, sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
              color: 'var(--accent-fg)', cursor: 'pointer',
            }}>
              {state.currentIndex + 1 < state.questions.length ? 'Next Question →' : 'See Results →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Setup screen
  return (
    <div style={{ padding: '32px 24px', maxWidth: 700, margin: '0 auto' }}>
      <PageHeader title="Practice" subtitle="Choose your question types and generate a session" />

      {/* Paused session guard */}
      {pausedPractice && !confirmAbandon && (
        <div style={{ background: 'rgba(228,224,52,0.07)', border: '1px solid rgba(228,224,52,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>⏸ You have a paused Practice session</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Question {((pausedPractice.checkpoint as SessionCheckpoint)?.currentIndex ?? 0) + 1} of {(pausedPractice.checkpoint as SessionCheckpoint)?.questions?.length ?? '?'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleResumePaused} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 7, padding: '7px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Resume →</button>
            <button onClick={() => setConfirmAbandon(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}>Start fresh</button>
          </div>
        </div>
      )}
      {pausedPractice && confirmAbandon && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 8 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 12 }}>Abandon your saved progress? This can't be undone.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAbandonPaused} style={{ background: 'var(--wrong)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Yes, abandon</button>
            <button onClick={() => setConfirmAbandon(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 7, padding: '7px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Question types */}
        <div>
          <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Question Types
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="All Types" selected={allTypes} onClick={() => { setAllTypes(true); setSelectedTypes([]) }} />
            {QUESTION_TYPES.map(t => (
              <Chip key={t.value} label={t.label} selected={!allTypes && selectedTypes.includes(t.value)} onClick={() => toggleType(t.value)} />
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Difficulty
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIFFICULTY_OPTIONS.map(d => (
              <Chip key={d.value} label={d.label} selected={difficulty === d.value} onClick={() => setDifficulty(d.value as Difficulty)} />
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Questions
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[5, 10, 20].map(n => (
              <Chip key={n} label={String(n)} selected={count === n} onClick={() => setCount(n)} />
            ))}
          </div>
        </div>

        {error && <p style={{ color: 'var(--wrong)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <button onClick={handleGenerate} disabled={!!pausedPractice} style={{
          background: pausedPractice ? 'var(--bg-elevated)' : 'var(--accent)',
          color: pausedPractice ? 'var(--text-muted)' : 'var(--accent-fg)',
          border: pausedPractice ? '1px solid var(--border)' : 'none',
          borderRadius: 8, padding: '13px 0', width: '100%',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem',
          cursor: pausedPractice ? 'not-allowed' : 'pointer',
        }}>
          {pausedPractice ? 'Resume or abandon your paused session first' : `Generate ${count} Questions →`}
        </button>
      </div>
    </div>
  )
}
