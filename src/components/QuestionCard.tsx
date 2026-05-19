import { ChoiceButton } from './ChoiceButton'
import { ExplanationBox } from './ExplanationBox'
import { ProgressBar } from './ProgressBar'
import { QuestionTypeTag } from './QuestionTypeTag'
import type { Question } from '../context/SessionContext'

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
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export function QuestionCard({
  question, questionNumber, totalQuestions, mode,
  onAnswer, answered, chosenIndex, showExplanation,
}: Props) {
  const isTimed = mode === 'timed'

  function choiceState(i: number): ChoiceState {
    if (!answered) return 'default'
    if (isTimed) return 'dimmed'                              // no feedback in timed mode
    if (i === question.correctIndex) return 'correct'
    if (i === chosenIndex) return 'wrong'
    return 'dimmed'
  }

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
        borderRadius: 10, padding: '20px 22px', marginBottom: 20,
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
          color: 'var(--text-primary)', lineHeight: 1.75, margin: 0,
        }}>
          {question.stimulus}
        </p>
      </div>

      {/* Stem */}
      <p style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem',
        color: 'var(--text-primary)', lineHeight: 1.5,
        margin: '0 0 16px',
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

      {/* Explanation — only in non-timed modes after answering */}
      {answered && !isTimed && showExplanation && (
        <ExplanationBox explanation={question.explanation} />
      )}
    </div>
  )
}
