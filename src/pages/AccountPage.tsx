import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useManageBilling, useCancelSubscription } from '../hooks/useUpgrade'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'

export default function AccountPage() {
  const navigate = useNavigate()
  const { profile, isPro, refreshProfile } = useAuth()
  const { mutate: manageBilling, isPending: billingPending } = useManageBilling()
  const { mutate: cancelSub, isPending: cancelPending } = useCancelSubscription()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(profile?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)

  if (!profile) return null

  const handleSaveName = async () => {
    setNameSaving(true)
    await supabase.from('profiles').update({ full_name: nameValue }).eq('id', profile.id)
    await refreshProfile()
    setNameSaving(false)
    setEditingName(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const periodEnd = profile.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const tierLabel = profile.tier === 'annual' ? 'Pro (Annual)' : profile.tier === 'monthly' ? 'Pro (Monthly)' : 'Free'

  return (
    <div style={{ padding: '32px 24px', maxWidth: 560, margin: '0 auto' }}>
      <PageHeader title="Account" subtitle="Manage your profile and subscription" />

      {/* Profile */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Name</div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', outline: 'none' }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={handleSaveName} disabled={nameSaving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '6px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
                  {nameSaving ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{profile.full_name ?? '—'}</span>
                <button onClick={() => { setNameValue(profile.full_name ?? ''); setEditingName(true) }} style={{ background: 'none', border: 'none', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  Edit
                </button>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{profile.email}</div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Subscription</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Plan</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: isPro ? 'var(--accent)' : 'var(--text-muted)', background: isPro ? 'rgba(228,224,52,0.1)' : 'var(--bg-elevated)', border: `1px solid ${isPro ? 'rgba(228,224,52,0.3)' : 'var(--border)'}`, borderRadius: 4, padding: '2px 8px', letterSpacing: '0.06em' }}>
            {tierLabel}
          </span>
        </div>
        {isPro && profile.subscription_status && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: profile.subscription_status === 'active' ? 'var(--correct)' : 'var(--warning)', letterSpacing: '0.06em' }}>
              {profile.subscription_status}
            </span>
          </div>
        )}
        {periodEnd && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {profile.subscription_status === 'active' ? 'Renews' : 'Access until'}
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{periodEnd}</span>
          </div>
        )}
        {!isPro && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Questions used</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {profile.questions_used} / 20
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isPro ? (
          <>
            <button onClick={() => manageBilling()} disabled={billingPending} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: billingPending ? 'wait' : 'pointer', opacity: billingPending ? 0.7 : 1 }}>
              {billingPending ? 'Redirecting…' : 'Manage Billing →'}
            </button>
            <button
              onClick={() => { if (confirm('Cancel your Pro subscription? You will retain access until the end of your billing period.')) cancelSub() }}
              disabled={cancelPending}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--wrong)', cursor: cancelPending ? 'wait' : 'pointer', opacity: cancelPending ? 0.7 : 1 }}
            >
              {cancelPending ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/upgrade')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
            Upgrade to Pro →
          </button>
        )}

        <button
          onClick={handleSignOut}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: 8 }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
