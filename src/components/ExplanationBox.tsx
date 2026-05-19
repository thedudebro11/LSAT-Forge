interface Props { explanation: string }

export function ExplanationBox({ explanation }: Props) {
  return (
    <div style={{
      borderLeft: '3px solid var(--accent)',
      background: 'rgba(228,224,52,0.04)',
      borderRadius: '0 8px 8px 0',
      padding: '16px 20px',
      marginTop: 20,
      animation: 'slideDown 0.2s ease',
    }}>
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
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}
