import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FreeTierBanner } from './FreeTierBanner'

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

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',  to: '/dashboard',  Icon: DashboardIcon,  proGated: false },
  { label: 'Practice',   to: '/practice',   Icon: PracticeIcon,   proGated: false },
  { label: 'Drill',      to: '/drill',      Icon: DrillIcon,      proGated: true  },
  { label: 'Simulation', to: '/simulation', Icon: SimulationIcon, proGated: true  },
  { label: 'Weak Spot',  to: '/weakspot',   Icon: WeakSpotIcon,   proGated: true  },
  { label: 'Analytics',  to: '/analytics',  Icon: AnalyticsIcon,  proGated: true  },
]

// ── Sidebar nav link ──────────────────────────────────────────────────────────

function SideNavLink({ to, label, Icon, showProBadge }: {
  to: string
  label: string
  Icon: () => JSX.Element
  showProBadge: boolean
}) {
  return (
    <NavLink
      to={to}
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

function MobileTabItem({ to, label, Icon }: { to: string; label: string; Icon: () => JSX.Element }) {
  return (
    <NavLink
      to={to}
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

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ avatarUrl, initial }: { avatarUrl?: string; initial: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: '0.8rem',
      color: 'var(--accent)',
      flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell() {
  const { profile, isPro } = useAuth()
  const navigate = useNavigate()

  const initial = (profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()
  const email = profile?.email ?? ''
  const planLabel = isPro ? 'PRO' : 'FREE'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

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
            />
          ))}
        </nav>

        {/* User info — click to go to account */}
        <div onClick={() => navigate('/account')} style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          cursor: 'pointer',
        }}>
          <Avatar avatarUrl={profile?.avatar_url} initial={initial} />
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
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0 }} className="md:ml-[240px] pb-16 md:pb-0">
        <FreeTierBanner />
        <Outlet />
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 40,
      }}>
        {NAV_ITEMS.map(item => (
          <MobileTabItem key={item.to} to={item.to} label={item.label} Icon={item.Icon} />
        ))}
      </nav>
    </div>
  )
}
