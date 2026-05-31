import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTypeStats } from '../hooks/useTypeStats'
import { useSessions } from '../hooks/useSessions'
import { PageHeader } from '../components/PageHeader'
import { QUESTION_TYPES } from '../constants'

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--bg-elevated)', animation: 'lfPulse 1.4s ease-in-out infinite' }}>
      <style>{`@keyframes lfPulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { data: typeStats = [], isLoading: statsLoading } = useTypeStats()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(30)
  const isLoading = statsLoading || sessionsLoading

  // Score trend: sessions ordered oldest→newest for chart
  const trendData = [...sessions]
    .reverse()
    .map((s, i) => ({
      index: i + 1,
      score: s.score_pct != null ? Math.round(s.score_pct) : null,
      label: new Date(s.completed_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mode: s.mode,
    }))
    .filter(d => d.score != null)

  // Type accuracy sorted ascending (weakest first)
  const typeAccuracy = typeStats
    .map(s => ({
      type: s.question_type as string,
      label: QUESTION_TYPES.find(t => t.value === s.question_type)?.label ?? s.question_type,
      pct: s.total_answered > 0 ? Math.round((s.correct_count / s.total_answered) * 100) : 0,
      total: s.total_answered as number,
      correct: s.correct_count as number,
    }))
    .filter(s => s.total >= 3)
    .sort((a, b) => a.pct - b.pct)

  const weakSpots = typeAccuracy.slice(0, 3)
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + (r.score_pct ?? 0), 0) / sessions.length)
    : null

  return (
    <div style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
      <PageHeader title="Analytics" subtitle="Your performance trends and weak areas" />

      {/* Summary stats */}
      <div className="stat-grid-3" style={{ marginBottom: 32 }}>
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} h={80} />)
        ) : (
          <>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Sessions</div>
              <div className="stat-num">{sessions.length}</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Avg Accuracy</div>
              <div className="stat-num">{avgScore != null ? `${avgScore}%` : '—'}</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Types Tracked</div>
              <div className="stat-num">{typeAccuracy.length}</div>
            </div>
          </>
        )}
      </div>

      {/* Score trend chart */}
      {trendData.length >= 2 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 16px' }}>Score Trend</h2>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono, monospace', fontSize: '0.75rem' }}
                  formatter={(v: number) => [`${v}%`, 'Score']}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weak spot callout */}
      {weakSpots.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 16px' }}>Weak Spots</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weakSpots.map(({ type, label, pct, correct: c, total: t }) => (
              <div key={type} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--wrong)' }}>
                    {pct}% <span style={{ color: 'var(--text-muted)' }}>({c}/{t} correct)</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/drill?type=${type}`)} style={{ background: 'rgba(228,224,52,0.1)', border: '1px solid rgba(228,224,52,0.3)', borderRadius: 6, padding: '6px 14px', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase' }}>
                  Drill This →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accuracy by type — all types */}
      {typeAccuracy.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 16px' }}>Accuracy by Type</h2>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {typeAccuracy.map(({ type, label, pct, correct: c, total: t }, i) => (
              <div key={type} style={{ padding: '14px 20px', borderBottom: i < typeAccuracy.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: pct >= 70 ? 'var(--correct)' : pct >= 50 ? 'var(--warning)' : 'var(--wrong)' }}>
                    {pct}% <span style={{ color: 'var(--text-muted)' }}>({c}/{t})</span>
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 70 ? 'var(--correct)' : pct >= 50 ? 'var(--warning)' : 'var(--wrong)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && typeAccuracy.length === 0 && sessions.length === 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '48px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Complete a few sessions to see your analytics here.
        </div>
      )}
    </div>
  )
}
