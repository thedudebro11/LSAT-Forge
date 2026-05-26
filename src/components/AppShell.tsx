import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { FreeTierBanner } from './FreeTierBanner'
import { supabase } from '../lib/supabase'

// ── Icons ─────────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="1" width="7" height="7" rx="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function PracticeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="14" height="14" rx="2" />
      <line x1="5" y1="6" x2="13" y2="6" />
      <line x1="5" y1="9" x2="13" y2="9" />
      <line x1="5" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function DrillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="4" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    </svg>
  )
}

function SimulationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="7" />
      <line x1="9" y1="4" x2="9" y2="9" />
      <line x1="9" y1="9" x2="12.5" y2="11" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="10" width="3.5" height="7" rx="1" />
      <rect x="7.25" y="6" width="3.5" height="11" rx="1" />
      <rect x="13.5" y="2" width="3.5" height="15" rx="1" />
    </svg>
  )
}

function WeakSpotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="7" />
      <line x1="9" y1="5" x2="9" y2="9.5" />
      <circle cx="9" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="6.5" r="3" />
      <path d="M2.5 16c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" />
    </svg>
  )
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',  to: '/dashboard',  Icon: DashboardIcon,  proGated: false },
  { label: 'Practice',   to: '/practice',   Icon: PracticeIcon,   proGated: false },
  { label: 'Drill',      to: '/drill',      Icon: DrillIcon,      proGated: true  },
  { label: 'Simulation', to: '/simulation', Icon: SimulationIcon, proGated: true  },
  { label: 'Weak Spot',  to: '/weakspot',   Icon: WeakSpotIcon,   proGated: true  },
  { label: 'Analytics',  to: '/analytics',  Icon: AnalyticsIcon,  proGated: true  },
  { label: 'Account',    to: '/account',    Icon: AccountIcon,    proGated: false },
]

// ── Sidebar nav link ──────────────────────────────────────────────────────────

function SideNavLink({ to, label, Icon, showProBadge, onNavClick }: {
  to: string
  label: string
  Icon: () => JSX.Element
  showProBadge: boolean
  onNavClick: (e: React.MouseEvent, to: string) => void
}) {
  return (
    <NavLink
      to={to}
      onClick={(e) => onNavClick(e, to)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '6px',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        textDecoration: 'none',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        fontSize: '0.875rem',
        letterSpacing: '0.01em',
        transition: 'background 0.15s, color 0.15s',
        marginLeft: '-2px',
      })}
    >
      <Icon />
      <span style={{ flex: 1 }}>{label}</span>
      {showProBadge && (
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 700,
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: '0.06em',
          padding: '1px 5px',
          borderRadius: '4px',
          background: 'rgba(228, 224, 52, 0.15)',
          color: 'var(--accent)',
          border: '1px solid rgba(228, 224, 52, 0.3)',
        }}>PRO</span>
      )}
    </NavLink>
  )
}

// ── Mobile tab item ───────────────────────────────────────────────────────────

function MobileTabItem({ to, label, Icon, onNavClick }: {
  to: string
  label: string
  Icon: () => JSX.Element
  onNavClick: (e: React.MouseEvent, to: string) => void
}) {
  return (
    <NavLink
      to={to}
      onClick={(e) => onNavClick(e, to)}
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        flex: 1,
        padding: '8px 0',
        textDecoration: 'none',
        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'color 0.15s',
      })}
    >
      <Icon />
      <span style={{ fontSize: '0.65rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{label}</span>
    </NavLink>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell() {
  const { profile, isPro } = useAuth()
  const navigate = useNavigate()
  const { state, pauseSession, reset } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Nav protection state
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null)
  const [showNavModal, setShowNavModal] = useState(false)
  const [showSimLockModal, setShowSimLockModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const isSessionActive = state.status === 'active' || state.status === 'reviewing'
  const sessionMode = state.mode

  const email = profile?.email ?? ''
  const displayName = profile?.full_name ?? email
  const planLabel = isPro ? 'PRO' : 'FREE'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function handleNavClick(e: React.MouseEvent, to: string) {
    if (isSessionActive && sessionMode !== 'simulation') {
      e.preventDefault()
      setPendingNavTarget(to)
      setShowNavModal(true)
    } else if (isSessionActive && sessionMode === 'simulation') {
      e.preventDefault()
      setPendingNavTarget(to)
      setShowSimLockModal(true)
    }
  }

  async function handleSaveAndLeave() {
    setSaving(true)
    setSaveError('')
    try {
      await pauseSession()
      setShowNavModal(false)
    } catch {
      setSaving(false)
      setSaveError('Failed to save session. Please try again.')
    }
  }

  async function handleAbandon() {
    const sessionId = state.sessionId
    reset()
    setShowNavModal(false)
    navigate(pendingNavTarget ?? '/dashboard')
    if (sessionId) {
      await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', sessionId)
    }
  }

  async function handleSimAbandon() {
    const sessionId = state.sessionId
    reset()
    setShowSimLockModal(false)
    navigate(pendingNavTarget ?? '/dashboard')
    if (sessionId) {
      await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', sessionId)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Pauseable session modal (Practice / Drill / Weak Spot) ── */}
      {showNavModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '32px', maxWidth: 380, width: '90%',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem',
              margin: '0 0 10px', color: 'var(--text-primary)',
            }}>Save your progress?</h3>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
              color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.55,
            }}>
              Your session will be saved and you can resume from any device.
            </p>
            {saveError && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--wrong)', margin: '0 0 14px' }}>
                {saveError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => { setShowNavModal(false); setSaveError('') }}
                style={{
                  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px', color: 'var(--text-primary)',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
                }}
              >Stay in Session</button>
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                style={{
                  flex: 1, background: 'var(--accent)', border: 'none',
                  borderRadius: 8, padding: '10px', color: 'var(--accent-fg)',
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.75 : 1,
                }}
              >{saving ? 'Saving…' : 'Save & Leave'}</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleAbandon}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem',
                  color: 'var(--wrong)', textDecoration: 'underline', padding: 0,
                }}
              >Abandon Session</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Simulation lock modal ── */}
      {showSimLockModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '36px 32px', maxWidth: 400, width: '90%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏱</div>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.15rem',
              margin: '0 0 12px', color: 'var(--text-primary)',
            }}>You cannot leave during a simulation</h3>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
              color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.6,
            }}>
              The real LSAT does not allow breaks. Stay focused — you're building real test endurance.
            </p>
            <button
              onClick={() => setShowSimLockModal(false)}
              style={{
                width: '100%', background: 'var(--accent)', border: 'none',
                borderRadius: 8, padding: '12px', color: 'var(--accent-fg)',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                marginBottom: 16,
              }}
            >Return to Test</button>
            <button
              onClick={handleSimAbandon}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem',
                color: 'var(--wrong)', textDecoration: 'underline', padding: 0,
              }}
            >Abandon Test (score will not be recorded)</button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex" style={{
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px 16px' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            LSAT
          </span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>
            FORGE
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <SideNavLink
              key={item.to}
              to={item.to}
              label={item.label}
              Icon={item.Icon}
              showProBadge={item.proGated && !isPro}
              onNavClick={handleNavClick}
            />
          ))}
        </nav>

        {/* User section with dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>

          {/* Dropdown menu — opens upward */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 8,
              right: 8,
              marginBottom: 4,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
              zIndex: 50,
            }}>
              {/* Header: name + email (non-interactive) */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </div>
                {profile?.full_name && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontFamily: 'DM Sans, sans-serif',
                    color: 'var(--text-muted)',
                    marginTop: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {email}
                  </div>
                )}
              </div>

              {/* Account Settings */}
              <button
                onClick={(e) => {
                  setDropdownOpen(false)
                  if (isSessionActive) {
                    handleNavClick(e as unknown as React.MouseEvent, '/account')
                  } else {
                    navigate('/account')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="7.5" cy="5" r="2.5" />
                  <path d="M2 13c0-3.038 2.462-5.5 5.5-5.5S13 9.962 13 13" />
                </svg>
                Account Settings
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--wrong)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M5.5 7.5H13m0 0l-2.5-2.5M13 7.5l-2.5 2.5" />
                  <path d="M9 3.5V2.5A1 1 0 008 1.5H2.5A1 1 0 001.5 2.5v10a1 1 0 001 1H8a1 1 0 001-1v-1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}

          {/* Trigger: user info row */}
          <div
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              cursor: 'pointer',
              background: dropdownOpen ? 'var(--bg-elevated)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent)', color: 'var(--accent-fg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
                flexShrink: 0,
              }}>
                {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem',
                fontFamily: 'DM Sans, sans-serif',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {email}
              </div>
            </div>
            <span style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.06em',
              padding: '2px 6px',
              borderRadius: '4px',
              flexShrink: 0,
              background: isPro ? 'rgba(228, 224, 52, 0.15)' : 'var(--bg-elevated)',
              color: isPro ? 'var(--accent)' : 'var(--text-muted)',
              border: isPro ? '1px solid rgba(228, 224, 52, 0.3)' : '1px solid var(--border)',
            }}>
              {planLabel}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0 }} className="md:ml-[240px] pb-16 md:pb-0">
        <FreeTierBanner />
        <Outlet />
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden bottom-tab-bar"
        style={{
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          zIndex: 40,
        }}
      >
        {NAV_ITEMS.map(item => (
          <MobileTabItem
            key={item.to}
            to={item.to}
            label={item.label}
            Icon={item.Icon}
            onNavClick={handleNavClick}
          />
        ))}
      </nav>
    </div>
  )
}
