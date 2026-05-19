interface Props { current: number; total: number }

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0
  return (
    <div>
      <div style={{ height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--accent)', borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        marginTop: 6,
        fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
        color: 'var(--text-muted)',
      }}>
        Q{current} / {total}
      </div>
    </div>
  )
}
