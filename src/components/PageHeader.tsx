interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
