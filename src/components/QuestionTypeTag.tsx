import { QUESTION_TYPES } from '../constants'

interface Props { type: string }

export function QuestionTypeTag({ type }: Props) {
  const found = QUESTION_TYPES.find(q => q.value === type)
  const label = found?.label ?? type
  const isRC = type === 'rc'
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
      letterSpacing: '0.08em', fontWeight: 500,
      padding: '3px 9px', borderRadius: 4,
      border: `1px solid ${isRC ? 'rgba(59,130,246,0.4)' : 'var(--border-strong)'}`,
      color: isRC ? 'var(--info)' : 'var(--text-muted)',
      background: isRC ? 'rgba(59,130,246,0.06)' : 'transparent',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}
