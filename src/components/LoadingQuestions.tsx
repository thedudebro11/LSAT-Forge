import { useState, useEffect } from 'react'

const MESSAGES = [
  'Generating your questions…',
  'Calibrating difficulty…',
  'Building your session…',
  'Applying LSAT logic patterns…',
  'Almost ready…',
]

export function LoadingQuestions() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      {/* Pulsing logo */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', opacity: 0.6 }}>LSAT</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent)', opacity: 0.6 }}>FORGE</span>
      </div>

      {/* Spinner */}
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'lf-spin 0.8s linear infinite',
      }} />

      {/* Rotating message */}
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        margin: 0,
        transition: 'opacity 0.3s',
      }}>
        {MESSAGES[msgIndex]}
      </p>

      <style>{`@keyframes lf-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
