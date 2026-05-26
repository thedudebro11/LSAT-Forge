import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { useTypeStats } from '../hooks/useTypeStats'
import { QuestionCard } from '../components/QuestionCard'
import { LoadingQuestions } from '../components/LoadingQuestions'
import { PageHeader } from '../components/PageHeader'
import { QUESTION_TYPES } from '../constants'
import { FreeLimitError } from '../hooks/useGenerateQuestions'

export default function WeakSpotPage() {
  const navigate = useNavigate()
  const { state, currentQuestion, startSession, answerQuestion, nextQuestion, skipQuestion, recordTrapDiagnosis, reset } = useSession()
  const { profile, isPro } = useAuth()
  const { data: typeStats = [], isLoading: statsLoading } = useTypeStats()
  const [error, setError] = useState('')
  const [showExit, setShowExit] = useState(false)
  const [trapSelected, setTrapSelected] = useState(false)

  useEffect(() => {
    setTrapSelected(false)
  }, [state.currentIndex, state.sessionId])

  const handleTrapSelect = (trapType: string, correctDiagnosis: boolean) => {
    recordTrapDiagnosis(trapType, correctDiagnosis)
    setTrapSelected(true)
  }

  // Weak spots: types with >= 3 answers, sorted by accuracy ascending, take top 3
  const weakTypes = typeStats
    .filter(s => s.total_answered >= 3)
    .sort((a, b) => (a.correct_count / a.total_answered) - (b.correct_count / b.total_answered))
    .slice(0, 3)
    .map(s => s.question_type as string)

  const handleStart = async () => {
    setError('')
    const types = weakTypes.length > 0 ? weakTypes : ['all']
    try {
      await startSession({ mode: 'weakspot', questionTypes: types, difficulty: 'mixed', count: 20 })
    } catch (e) {
      if (e instanceof FreeLimitError) navigate('/upgrade')
      else setError('Failed to start session. Try again.')
    }
  }

  const handleExit = () => { reset(); navigate('/dashboard') }
  const lastResponse = state.responses[state.responses.length - 1]

  if (state.status === 'loading') return <LoadingQuestions />

  if ((state.status === 'active' || state.status === 'reviewing') && currentQuestion) {
    const exitModal = showExit && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px', maxWidth: 340, width: '90%' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', marginBottom: 20 }}>Exit this session? Progress will be lost.</p>
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
          Weak Spot Review
        </span>
        <button onClick={() => setShowExit(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)' }}>✕ Exit</button>
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
          mode="weakspot"
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

  // Setup screen
  return (
    <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
      <PageHeader title="Weak Spot Review" subtitle="Auto-targets your lowest-accuracy question types" />

      {statsLoading ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Analyzing your performance…
        </div>
      ) : weakTypes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
              Targeting your weak spots
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weakTypes.map(type => {
                const stat = typeStats.find(s => s.question_type === type)
                const pct = stat ? Math.round((stat.correct_count / stat.total_answered) * 100) : 0
                const label = QUESTION_TYPES.find(t => t.value === type)?.label ?? type
                return (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--wrong)' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            20 questions · Mixed difficulty · Instant explanations
          </div>
          {error && <p style={{ color: 'var(--wrong)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          <button onClick={handleStart} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '13px 0', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
            Start Review →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8 }}>Not enough data yet</div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Complete a few practice sessions first. We need at least 3 answers per type to identify weak spots.
            </p>
          </div>
          <button onClick={() => navigate('/practice')} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '13px 0', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
            Start Practicing →
          </button>
        </div>
      )}
    </div>
  )
}
