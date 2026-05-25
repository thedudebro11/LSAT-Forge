const TRAPS = [
  { type: 'Opposite', description: 'I picked an answer that did the opposite of what was asked' },
  { type: 'Shell Game', description: 'I picked an answer that used similar words but changed the meaning' },
  { type: 'Out of Scope', description: 'I picked an answer that introduced something not in the argument' },
  { type: 'Distortion', description: 'I picked an answer that was almost right but shifted a qualifier' },
  { type: 'Extreme Language', description: 'I picked an answer that was too absolute' },
]

interface Props {
  onSelect: (trapType: string) => void
}

export function TrapClassifier({ onSelect }: Props) {
  return (
    <div style={{
      marginTop: 24,
      background: 'rgba(239,68,68,0.04)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10, padding: '20px 22px',
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.62rem',
        letterSpacing: '0.1em', color: 'var(--wrong)',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        Before we explain
      </div>
      <p style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9rem',
        color: 'var(--text-primary)', margin: '0 0 16px',
      }}>
        What trap did you fall for?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TRAPS.map(trap => (
          <button
            key={trap.type}
            onClick={() => onSelect(trap.type)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
              fontWeight: 500, color: 'var(--wrong)', marginBottom: 3,
            }}>
              {trap.type}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}>
              {trap.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
