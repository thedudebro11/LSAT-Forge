import { useState } from 'react'
import { useFlagExplanation } from '../hooks/useFlagExplanation'

interface Props {
  explanation: string
  selectedTrapType?: string | null
  actualTrapType?: string | null
  isCorrect?: boolean
  questionsUsed?: number
  isPro?: boolean
  questionType?: string
  stimulus?: string
  stem?: string
}

type FeedbackState = 'idle' | 'rated' | 'submitted'

export function ExplanationBox({
  explanation,
  selectedTrapType,
  actualTrapType,
  isCorrect = true,
  questionsUsed = 0,
  isPro = false,
  questionType = '',
  stimulus = '',
  stem = '',
}: Props) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle')
  const [rating, setRating] = useState<'helpful' | 'not_helpful' | null>(null)
  const [comment, setComment] = useState('')
  const flagMutation = useFlagExplanation()

  const trapMatch = selectedTrapType && actualTrapType && selectedTrapType === actualTrapType
  const trapMismatch = selectedTrapType && actualTrapType && selectedTrapType !== actualTrapType

  const handleRate = (r: 'helpful' | 'not_helpful') => {
    setRating(r)
    setFeedbackState('rated')
  }

  const handleSubmit = async () => {
    if (!rating) return
    try {
      await flagMutation.mutateAsync({ question_type: questionType, stimulus, stem, explanation, rating, comment: comment || undefined })
    } catch {
      // silently ignore — feedback is non-critical
    }
    setFeedbackState('submitted')
  }

  const handleSkip = () => setFeedbackState('submitted')

  const showFeedback = questionsUsed >= 3 || isPro

  return (
    <div style={{
      borderLeft: '3px solid var(--accent)',
      background: 'rgba(228,224,52,0.04)',
      borderRadius: '0 8px 8px 0',
      padding: '16px 20px',
      marginTop: 20,
      animation: 'slideDown 0.2s ease',
    }}>
      {/* Trap diagnosis result */}
      {!isCorrect && trapMatch && (
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
          letterSpacing: '0.06em', color: 'var(--correct)',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ✓ You identified the trap — {actualTrapType}
        </div>
      )}
      {!isCorrect && trapMismatch && (
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
          letterSpacing: '0.06em', color: 'var(--warning)',
          marginBottom: 12,
        }}>
          The trap was actually <strong>{actualTrapType}</strong>, not {selectedTrapType}
        </div>
      )}

      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
        letterSpacing: '0.1em', color: 'var(--accent)',
        marginBottom: 10, textTransform: 'uppercase',
      }}>
        Why this answer?
      </div>
      <p style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
        color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0,
      }}>
        {explanation}
      </p>

      {/* Feedback widget */}
      {showFeedback && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {feedbackState === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
                color: 'var(--text-muted)',
              }}>
                Was this explanation helpful?
              </span>
              <button
                onClick={() => handleRate('helpful')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', borderRadius: 4 }}
                title="Helpful"
              >👍</button>
              <button
                onClick={() => handleRate('not_helpful')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', borderRadius: 4 }}
                title="Not helpful"
              >👎</button>
            </div>
          )}

          {feedbackState === 'rated' && (
            <div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
                color: 'var(--text-muted)', margin: '0 0 8px',
              }}>
                {rating === 'helpful' ? 'Glad it helped!' : 'Sorry to hear that.'} Tell us more (optional):
              </p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What was helpful or confusing?"
                rows={2}
                style={{
                  width: '100%', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 6,
                  padding: '8px 10px', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.8rem', color: 'var(--text-primary)',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={handleSubmit}
                  disabled={flagMutation.isPending}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '6px 14px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
                    color: 'var(--text-primary)', cursor: 'pointer',
                  }}
                >
                  {flagMutation.isPending ? 'Sending…' : 'Submit Feedback'}
                </button>
                <button
                  onClick={handleSkip}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {feedbackState === 'submitted' && (
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
              color: 'var(--text-muted)', margin: 0,
            }}>
              Thanks for the feedback.
            </p>
          )}
        </div>
      )}

      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}
