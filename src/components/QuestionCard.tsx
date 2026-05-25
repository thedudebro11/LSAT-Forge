import { useState, useEffect } from 'react'
import { ChoiceButton } from './ChoiceButton'
import { ExplanationBox } from './ExplanationBox'
import { TrapClassifier } from './TrapClassifier'
import { ProgressBar } from './ProgressBar'
import { QuestionTypeTag } from './QuestionTypeTag'
import type { Question } from '../types'

type ChoiceState = 'default' | 'correct' | 'wrong' | 'dimmed'
type CardMode = 'practice' | 'timed' | 'drill' | 'weakspot'

interface Props {
  question: Question
  questionNumber: number
  totalQuestions: number
  mode: CardMode
  onAnswer: (index: number) => void
  answered: boolean
  chosenIndex?: number
  showExplanation?: boolean
  questionsUsed?: number
  onTrapSelect?: (trapType: string, correctDiagnosis: boolean) => void
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export function QuestionCard({
  question, questionNumber, totalQuestions, mode,
  onAnswer, answered, chosenIndex, showExplanation,
  questionsUsed = 0, onTrapSelect,
}: Props) {
  const isTimed = mode === 'timed'
  const [selectedTrapType, setSelectedTrapType] = useState<string | null>(null)
  const [argGapOpen, setArgGapOpen] = useState(false)

  useEffect(() => {
    setSelectedTrapType(null)
    setArgGapOpen(false)
  }, [question.id])

  function choiceState(i: number): ChoiceState {
    if (!answered) return 'default'
    if (isTimed) return 'dimmed'
    if (i === question.correctIndex) return 'correct'
    if (i === chosenIndex) return 'wrong'
    return 'dimmed'
  }

  const isWrong = answered && chosenIndex !== undefined && chosenIndex !== question.correctIndex
  const hasTrapData = !!question.wrong_explanations?.length
  const actualTrapType = question.wrong_explanations?.find(w => w.index === chosenIndex)?.trap_type ?? null

  const handleTrapSelect = (trapType: string) => {
    const correctDiagnosis = trapType === actualTrapType
    setSelectedTrapType(trapType)
    onTrapSelect?.(trapType, correctDiagnosis)
  }

  const explanationText = question.correct_explanation ?? question.explanation ?? ''

  const showTrapClassifier = answered && !isTimed && showExplanation && hasTrapData && isWrong && !selectedTrapType
  const showExplanationBox = answered && !isTimed && showExplanation && (!hasTrapData || !isWrong || !!selectedTrapType)

  return (
    <div>
      {/* Progress + type */}
      <div style={{ marginBottom: 20 }}>
        <ProgressBar current={questionNumber} total={totalQuestions} />
        <div style={{ marginTop: 12 }}>
          <QuestionTypeTag type={question.type} />
        </div>
      </div>

      {/* Stimulus */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px 22px', marginBottom: 8,
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
          color: 'var(--text-primary)', lineHeight: 1.75, margin: 0,
        }}>
          {question.stimulus}
        </p>
      </div>

      {/* Argument gap disclosure — only after answering, only when field exists, only non-timed */}
      {answered && !isTimed && question.argument_gap && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setArgGapOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'DM Mono, monospace', fontSize: '0.68rem',
              letterSpacing: '0.06em', color: 'var(--text-muted)',
              padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ display: 'inline-block', transform: argGapOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
            See the argument gap
          </button>
          {argGapOpen && (
            <div style={{
              background: 'rgba(228,224,52,0.05)', border: '1px solid rgba(228,224,52,0.15)',
              borderRadius: 6, padding: '10px 14px', marginTop: 6,
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
              color: 'var(--text-secondary)', lineHeight: 1.65,
            }}>
              {question.argument_gap}
            </div>
          )}
        </div>
      )}

      {/* Stem */}
      <p style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem',
        color: 'var(--text-primary)', lineHeight: 1.5,
        margin: '12px 0 16px',
      }}>
        {question.stem}
      </p>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.choices.map((text, i) => (
          <ChoiceButton
            key={i}
            letter={LETTERS[i]}
            text={text}
            state={choiceState(i)}
            onClick={answered ? undefined : () => onAnswer(i)}
          />
        ))}
      </div>

      {/* Trap classifier — blocks explanation until user classifies their error */}
      {showTrapClassifier && (
        <TrapClassifier onSelect={handleTrapSelect} />
      )}

      {/* Explanation */}
      {showExplanationBox && (
        <ExplanationBox
          explanation={explanationText}
          selectedTrapType={selectedTrapType}
          actualTrapType={actualTrapType}
          isCorrect={!isWrong}
          questionsUsed={questionsUsed}
          questionType={question.type}
          stimulus={question.stimulus}
          stem={question.stem}
        />
      )}
    </div>
  )
}
