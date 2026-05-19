import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuccessPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    refreshProfile()
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); navigate('/dashboard'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', margin: '0 0 12px' }}>
        You're now on Pro
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: 380, margin: '0 0 32px', lineHeight: 1.65 }}>
        All features are now unlocked. Start with a full LSAT simulation or drill your weak spots.
      </p>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        Redirecting to dashboard in {countdown}…
      </div>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: 20, background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
        Go Now →
      </button>
    </div>
  )
}
