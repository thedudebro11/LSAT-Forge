import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../hooks/useUpgrade'
import { PageHeader } from '../components/PageHeader'

const FREE_FEATURES = [
  '20 practice questions total',
  'Logical Reasoning only',
  'Basic answer explanations',
]

const PRO_FEATURES = [
  'Unlimited practice questions',
  'All question types including Reading Comprehension',
  'Drill Mode — master one type at a time',
  'Full LSAT Simulation (81 Q, 3 sections, timed)',
  'Weak Spot Review — auto-targeted sessions',
  'Advanced Analytics & score trends',
  'Priority question generation',
]

export default function UpgradePage() {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const { mutate: upgrade, isPending } = useUpgrade()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  if (isPro) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 12 }}>
          You're already on Pro
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          All features are unlocked. Manage your subscription in Account settings.
        </p>
        <button onClick={() => navigate('/account')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
          Go to Account →
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 700, margin: '0 auto' }}>
      <PageHeader title="Upgrade to Pro" subtitle="Unlock the full LSAT Forge experience" />

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              background: billing === b ? 'var(--bg-surface)' : 'transparent',
              border: billing === b ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 6, padding: '7px 20px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: billing === b ? 600 : 400,
              color: billing === b ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}>
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && <span style={{ marginLeft: 6, fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.06em' }}>SAVE 40%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {/* Free */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Free</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>$0</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>Forever</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FREE_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', marginTop: 1 }}>–</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(228,224,52,0.4)', borderRadius: 12, padding: '28px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, right: 20, background: 'var(--accent)', borderRadius: '0 0 6px 6px', padding: '3px 10px', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--accent-fg)', fontWeight: 700 }}>
            POPULAR
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>Pro</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            {billing === 'annual' ? '$9' : '$15'}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            {billing === 'annual' ? 'Billed $108/year' : 'Billed monthly'}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRO_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--correct)', marginTop: 1, fontSize: '0.9rem' }}>✓</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={() => upgrade(billing)}
        disabled={isPending}
        style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '14px 0', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? 'Redirecting…' : `Get Pro ${billing === 'annual' ? '— $9/mo' : '— $15/mo'} →`}
      </button>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', margin: '16px 0 0' }}>
        Secure checkout via Stripe. Cancel anytime.
      </p>
    </div>
  )
}
