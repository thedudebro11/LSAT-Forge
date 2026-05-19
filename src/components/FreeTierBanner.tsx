import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function FreeTierBanner() {
  const { profile, questionsRemaining } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (!profile || profile.tier !== 'free' || dismissed) return null

  const used = 20 - questionsRemaining
  const pct = Math.min(100, (used / 20) * 100)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '10px 20px',
      background: 'rgba(228, 224, 52, 0.06)',
      borderBottom: '1px solid rgba(228, 224, 52, 0.2)',
    }}>
      {/* Progress section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.8rem',
          color: 'var(--accent)',
          marginBottom: 5,
          fontWeight: 500,
        }}>
          {used} of 20 free questions used
        </div>
        <div style={{
          height: 3,
          background: 'rgba(228, 224, 52, 0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Upgrade CTA */}
      <button
        onClick={() => navigate('/upgrade')}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--accent-fg)',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: 6,
          padding: '5px 12px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Upgrade to Pro →
      </button>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '2px 4px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        ✕
      </button>
    </div>
  )
}
