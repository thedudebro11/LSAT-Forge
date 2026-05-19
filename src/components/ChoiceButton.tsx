type ChoiceState = 'default' | 'correct' | 'wrong' | 'dimmed'

interface Props {
  letter: string
  text: string
  state: ChoiceState
  onClick?: () => void
}

const LETTER_STYLE: Record<ChoiceState, React.CSSProperties> = {
  default: { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  correct: { background: 'rgba(34,197,94,0.15)', color: 'var(--correct)', border: '1px solid rgba(34,197,94,0.5)' },
  wrong:   { background: 'rgba(239,68,68,0.15)',  color: 'var(--wrong)',   border: '1px solid rgba(239,68,68,0.5)' },
  dimmed:  { background: 'var(--bg-elevated)',    color: 'var(--text-muted)', border: '1px solid var(--border)' },
}

const CARD_STYLE: Record<ChoiceState, React.CSSProperties> = {
  default: { border: '1px solid var(--border)', background: 'var(--bg-surface)' },
  correct: { border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.05)' },
  wrong:   { border: '1px solid rgba(239,68,68,0.4)',  background: 'rgba(239,68,68,0.05)' },
  dimmed:  { border: '1px solid var(--border)', background: 'var(--bg-surface)', opacity: 0.45 },
}

export function ChoiceButton({ letter, text, state, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={state !== 'default'}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start',
        gap: 12, padding: '12px 14px', borderRadius: 8,
        cursor: state === 'default' ? 'pointer' : 'default',
        textAlign: 'left', transition: 'all 0.15s',
        ...CARD_STYLE[state],
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', fontWeight: 500,
        transition: 'all 0.15s',
        ...LETTER_STYLE[state],
      }}>
        {letter}
      </span>
      <span style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
        color: state === 'dimmed' ? 'var(--text-muted)' : 'var(--text-primary)',
        lineHeight: 1.6, paddingTop: 2,
      }}>
        {text}
      </span>
    </button>
  )
}
