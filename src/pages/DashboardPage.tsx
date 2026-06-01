import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import type { SessionMode, SessionCheckpoint } from '../context/SessionContext'
import { useSessions } from '../hooks/useSessions'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'var(--bg-elevated)',
      animation: 'lfPulse 1.4s ease-in-out infinite',
    }}>
      <style>{`@keyframes lfPulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="8" rx="2" />
      <path d="M5 7V5a3 3 0 016 0v2" />
    </svg>
  )
}

interface ModeCardProps {
  title: string
  desc: string
  to: string
  locked: boolean
  symbol: string
}

function ModeCard({ title, desc, to, locked, symbol }: ModeCardProps) {
  const navigate = useNavigate()
  const handleClick = () => navigate(locked ? '/upgrade' : to)

  return (
    <button onClick={handleClick} style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '24px', textAlign: 'left',
      cursor: 'pointer', width: '100%',
      transition: 'border-color 0.15s',
      opacity: locked ? 0.75 : 1,
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = locked ? 'var(--border)' : 'var(--border-strong)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.5rem' }}>{symbol}</span>
        {locked && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.07em',
            color: 'var(--accent)', background: 'rgba(228,224,52,0.1)',
            border: '1px solid rgba(228,224,52,0.25)', borderRadius: 4, padding: '2px 7px',
          }}>
            <LockIcon /> PRO
          </span>
        )}
      </div>
      <div>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem',
          color: 'var(--text-primary)', marginBottom: 5,
        }}>{title}</div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.825rem',
          color: 'var(--text-secondary)', lineHeight: 1.55,
        }}>{desc}</div>
      </div>
    </button>
  )
}

function StatBox({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
        letterSpacing: '0.1em', color: 'var(--text-muted)',
        marginBottom: 8, textTransform: 'uppercase',
      }}>{label}</div>
      {loading
        ? <Skeleton h={28} w={60} />
        : <div className="stat-num">
            {value}
          </div>}
    </div>
  )
}

export default function DashboardPage() {
  const { profile, isPro, user } = useAuth()
  const { data: sessions = [], isLoading } = useSessions(5)
  const { resumeSession } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: pausedSession } = useQuery({
    queryKey: ['paused-session', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, mode, checkpoint, started_at, question_types')
        .eq('user_id', user!.id)
        .eq('status', 'paused')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  function handleResume() {
    if (!pausedSession?.checkpoint) return
    resumeSession(
      pausedSession.id,
      pausedSession.mode as SessionMode,
      pausedSession.checkpoint as SessionCheckpoint,
    )
    navigate(`/${pausedSession.mode}`)
  }

  async function handleDismissPaused() {
    if (!pausedSession) return
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', pausedSession.id)
    queryClient.invalidateQueries({ queryKey: ['paused-session', user?.id] })
  }

  const totalQuestions = sessions.reduce((s, r) => s + (r.total_questions ?? 0), 0)
  const avgAccuracy = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + (r.score_pct ?? 0), 0) / sessions.length)
    : 0
  const testsCompleted = sessions.filter(s => s.mode === 'simulation').length

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function modeBadge(mode: string) {
    const colors: Record<string, string> = {
      practice: 'var(--info)', drill: 'var(--accent)',
      simulation: 'var(--correct)', weakspot: 'var(--warning)',
    }
    return (
      <span style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em',
        color: colors[mode] ?? 'var(--text-muted)',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 4, padding: '2px 7px', textTransform: 'capitalize',
      }}>{mode}</span>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        title={`${greeting()}, ${firstName}.`}
        subtitle={isPro ? 'Pro plan active' : `${20 - (profile?.questions_used ?? 0)} free questions remaining`}
      />

      {/* Resume banner */}
      {pausedSession && (
        <div style={{
          background: 'rgba(228,224,52,0.07)',
          border: '1px solid rgba(228,224,52,0.3)',
          borderRadius: 10, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>
              You have an unfinished {pausedSession.mode.charAt(0).toUpperCase() + pausedSession.mode.slice(1)} session
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Question {(pausedSession.checkpoint as SessionCheckpoint)?.currentIndex + 1} of {(pausedSession.checkpoint as SessionCheckpoint)?.questions?.length ?? '?'} · Started {formatDate(pausedSession.started_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleResume} style={{
              background: 'var(--accent)', border: 'none', borderRadius: 7,
              padding: '8px 18px', fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.85rem', color: 'var(--accent-fg)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>Resume Session →</button>
            <button onClick={handleDismissPaused} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
              color: 'var(--text-muted)', textDecoration: 'underline', padding: 0,
            }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <ModeCard title="Practice" desc="Generate unlimited practice questions. Pick your types and difficulty." to="/practice" locked={false} symbol="📝" />
        <ModeCard title="Drill Mode" desc="Master one question type at a time. 10 focused questions." to="/drill" locked={!isPro} symbol="🎯" />
        <ModeCard title="Full Test Simulation" desc="81 questions, 3 sections, real 35-minute countdown." to="/simulation" locked={!isPro} symbol="⏱" />
        <ModeCard title="Weak Spot Review" desc="Auto-targets your lowest-accuracy question types." to="/weakspot" locked={!isPro} symbol="📊" />
      </div>

      {/* Quick stats */}
      <div className="stat-grid-3 mb-8">
        <StatBox label="Questions" value={String(totalQuestions)} loading={isLoading} />
        <StatBox label="Avg Accuracy" value={sessions.length ? `${avgAccuracy}%` : '—'} loading={isLoading} />
        <StatBox label="Tests Done" value={String(testsCompleted)} loading={isLoading} />
      </div>

      {/* Recent sessions */}
      <div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem',
          color: 'var(--text-primary)', margin: '0 0 14px',
        }}>Recent Sessions</h2>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} h={44} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '32px', textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)',
          }}>
            No sessions yet. Start practicing above.
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Mode', 'Score', 'Questions', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'DM Mono, monospace', fontSize: '0.62rem',
                      letterSpacing: '0.08em', color: 'var(--text-muted)',
                      fontWeight: 500, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} style={{
                    borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(s.completed_at)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{modeBadge(s.mode)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono, monospace', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s.score_pct != null ? `${Math.round(s.score_pct)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {s.correct_count ?? 0} / {s.total_questions ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link to={`/results/${s.id}`} style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
                        color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
                      }}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
