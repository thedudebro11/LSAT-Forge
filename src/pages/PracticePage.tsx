import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { QuestionCard } from '../components/QuestionCard'
import { ElaborativePrompt } from '../components/ElaborativePrompt'
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
          Your progress will be lost.
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
  const { state, currentQuestion, startSession, answerQuestion, nextQuestion, skipQuestion, recordTrapDiagnosis, reset } = useSession()
  const { profile, isPro } = useAuth()

  // Setup state
  const [allTypes, setAllTypes] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed')
  const [count, setCount] = useState(5)
  const [error, setError] = useState('')
  const [showExit, setShowExit] = useState(false)
  const [elaborativeDone, setElaborativeDone] = useState(false)
  const [trapSelected, setTrapSelected] = useState(false)

  useEffect(() => {
    setElaborativeDone(false)
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

  const lastResponse = state.responses[state.responses.length - 1]

  // Loading
  if (state.status === 'loading') return <LoadingQuestions />

  // Session active/reviewing
  if ((state.status === 'active' || state.status === 'reviewing') && currentQuestion) {
    const exitBtn = (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowExit(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)',
        }}>✕ Exit</button>
      </div>
    )

    // Elaborative prompt — show before question for new LR questions with argument_gap
    if (state.status === 'active' && !elaborativeDone && currentQuestion.argument_gap) {
      return (
        <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
          {showExit && <ConfirmModal onConfirm={handleExit} onCancel={() => setShowExit(false)} />}
          {exitBtn}
          <ElaborativePrompt
            stimulus={currentQuestion.stimulus}
            onContinue={() => setElaborativeDone(true)}
          />
        </div>
      )
    }

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

        <button onClick={handleGenerate} style={{
          background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none',
          borderRadius: 8, padding: '13px 0', width: '100%',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
        }}>
          Generate {count} Questions →
        </button>
      </div>
    </div>
  )
}
