import { useParams, useNavigate } from 'react-router-dom'
import { useSession, useSessionResponses } from '../hooks/useSessions'
import { PageHeader } from '../components/PageHeader'
import { SCORE_ESTIMATION, QUESTION_TYPES } from '../constants'

function estimateLsatScore(accuracyPct: number) {
  const band = SCORE_ESTIMATION.find(b => accuracyPct >= b.minAccuracy && accuracyPct <= b.maxAccuracy)
  if (!band) return '—'
  const mid = Math.round((band.minScore + band.maxScore) / 2)
  return `~${mid}`
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--bg-elevated)', animation: 'lfPulse 1.4s ease-in-out infinite' }}>
      <style>{`@keyframes lfPulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { data: session, isLoading: sessionLoading } = useSession(sessionId)
  const { data: responses = [], isLoading: responsesLoading } = useSessionResponses(sessionId)
  const isLoading = sessionLoading || responsesLoading

  // Accuracy by question type from stored responses
  const typeMap: Record<string, { correct: number; total: number }> = {}
  for (const r of responses) {
    if (!typeMap[r.question_type]) typeMap[r.question_type] = { correct: 0, total: 0 }
    typeMap[r.question_type].total++
    if (r.is_correct) typeMap[r.question_type].correct++
  }
  const typeStats = Object.entries(typeMap)
    .map(([type, { correct, total }]) => ({
      type,
      label: QUESTION_TYPES.find(t => t.value === type)?.label ?? type,
      pct: Math.round((correct / total) * 100),
      correct, total,
    }))
    .sort((a, b) => a.pct - b.pct)

  const scorePct = session?.score_pct ?? 0
  const correct = session?.correct_count ?? 0
  const total = session?.total_questions ?? 0
  const lsatScore = estimateLsatScore(Math.round(scorePct))

  const scoreColor = scorePct >= 75 ? 'var(--correct)' : scorePct >= 55 ? 'var(--warning)' : 'var(--wrong)'

  return (
    <div style={{ padding: '32px 24px', maxWidth: 780, margin: '0 auto' }}>
      <PageHeader
        title="Session Results"
        subtitle={session ? `${session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} · ${new Date(session.completed_at ?? '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
      />

      {/* Score hero */}
      <div className="stat-grid-3" style={{ marginBottom: 32 }}>
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} h={90} />)
        ) : (
          <>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Score</div>
              <div className="stat-num-lg" style={{ color: scoreColor }}>{Math.round(scorePct)}%</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Correct</div>
              <div className="stat-num-lg">{correct}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> / {total}</span></div>
            </div>
            {session?.mode === 'simulation' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Est. LSAT</div>
                <div className="stat-num-lg" style={{ color: 'var(--accent)' }}>{lsatScore}</div>
              </div>
            )}
            {session?.mode !== 'simulation' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Time</div>
                <div className="stat-num-lg">
                  {session?.time_taken_seconds ? `${Math.round(session.time_taken_seconds / 60)}m` : '—'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Accuracy by type */}
      {typeStats.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 16px' }}>
            Accuracy by Type
          </h2>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {typeStats.map(({ type, label, pct, correct: c, total: t }) => (
              <div key={type} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: pct >= 70 ? 'var(--correct)' : pct >= 50 ? 'var(--warning)' : 'var(--wrong)' }}>
                    {pct}% <span style={{ color: 'var(--text-muted)' }}>({c}/{t})</span>
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 70 ? 'var(--correct)' : pct >= 50 ? 'var(--warning)' : 'var(--wrong)', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question breakdown */}
      {responses.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 16px' }}>
            Question Breakdown
          </h2>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Type', 'Result', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < responses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {QUESTION_TYPES.find(t => t.value === r.question_type)?.label ?? r.question_type}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: r.is_correct ? 'var(--correct)' : 'var(--wrong)' }}>
                        {r.is_correct ? '✓' : '✗'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.time_spent_seconds != null ? `${r.time_spent_seconds}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
          ← Dashboard
        </button>
        <button onClick={() => navigate('/analytics')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '11px 24px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-fg)', cursor: 'pointer' }}>
          View Analytics →
        </button>
      </div>
    </div>
  )
}
