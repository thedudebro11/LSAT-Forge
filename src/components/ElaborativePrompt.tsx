import { useState } from 'react'

interface Props {
  stimulus: string
  onContinue: () => void
}

export function ElaborativePrompt({ stimulus, onContinue }: Props) {
  const [response, setResponse] = useState('')

  return (
    <div>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.62rem',
        letterSpacing: '0.1em', color: 'var(--accent)',
        textTransform: 'uppercase', marginBottom: 16,
      }}>
        Step 1 of 2 — Read the argument
      </div>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '20px 22px', marginBottom: 24,
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
          color: 'var(--text-primary)', lineHeight: 1.75, margin: 0,
        }}>
          {stimulus}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem',
          color: 'var(--text-primary)', display: 'block', marginBottom: 8,
        }}>
          What does this argument assume but never prove?
        </label>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.825rem',
          color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6,
        }}>
          Write one sentence before seeing the choices. Not graded — just engage with the argument.
        </p>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="The argument assumes that…"
          style={{
            width: '100%', minHeight: 80,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 14px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
            color: 'var(--text-primary)', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box',
            lineHeight: 1.6,
          }}
        />
      </div>

      <button
        onClick={onContinue}
        style={{
          background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none',
          borderRadius: 8, padding: '12px 0', width: '100%',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem',
          cursor: 'pointer',
        }}
      >
        Continue to Question →
      </button>

      <p style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: '0.775rem',
        color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0',
      }}>
        The argument gap will be revealed after you answer.
      </p>
    </div>
  )
}
