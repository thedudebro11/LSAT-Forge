import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { QuestionCard } from '../components/QuestionCard'
import { LoadingQuestions } from '../components/LoadingQuestions'
import { FreeLimitError } from '../hooks/useGenerateQuestions'

const SECTIONS = [
  { label: 'Section I — Logical Reasoning', start: 0, end: 26 },
  { label: 'Section II — Logical Reasoning', start: 27, end: 53 },
  { label: 'Section III — Reading Comprehension', start: 54, end: 80 },
]
const BREAK_TIME = 60

function getSection(index: number) {
  return SECTIONS.find(s => index >= s.start && index <= s.end) ?? SECTIONS[0]
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Pre-test screen ────────────────────────────────────────────────────────────

function PreTestScreen({ onBegin, error }: { onBegin: () => void; error: string }) {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
          Full LSAT Simulation
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: 'var(--text-primary)', margin: '0 0 12px' }}>
          Are you ready?
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          3 sections · 81 questions · 35 minutes per section · 60-second break between sections.
          Scored on the 120–180 LSAT scale.
        </p>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
          Before you begin
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Find a quiet space with no interruptions',
            'Have scratch paper and a pencil ready',
            'Do not use outside resources during the test',
            '35 minutes per section — stay disciplined',
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(228,224,52,0.12)', border: '1px solid rgba(228,224,52,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: 'var(--accent)' }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {SECTIONS.map((_s, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Section {i + 1}
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 4 }}>
              {i < 2 ? 'Logical Reasoning' : 'Reading Comp.'}
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              27 Q · 35 min
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'var(--wrong)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', margin: '0 0 16px' }}>{error}</p>}

      <button onClick={onBegin} style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '14px 0', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
        Begin Test →
      </button>
    </div>
  )
}

// ── Test header ────────────────────────────────────────────────────────────────

function TestHeader({ sectionLabel, timeRemaining, qNumber, qTotal, onEnd, isFinal }: {
  sectionLabel: string; timeRemaining: number; qNumber: number; qTotal: number
  onEnd: () => void; isFinal: boolean
}) {
  const isAmber = timeRemaining < 300 && timeRemaining >= 120
  const isRed = timeRemaining < 120
  const timerColor = isRed ? 'var(--wrong)' : isAmber ? 'var(--warning)' : 'var(--text-primary)'

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <style>{`@keyframes lfPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
          {sectionLabel}
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Question {qNumber} of {qTotal}
        </div>
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.25rem', fontWeight: 700, color: timerColor, flexShrink: 0, ...(isRed ? { animation: 'lfPulse 0.8s ease-in-out infinite' } : {}) }}>
        {formatTime(timeRemaining)}
      </div>
      <button onClick={onEnd} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
        {isFinal ? 'Submit Test' : 'End Section'} →
      </button>
    </div>
  )
}

// ── Question navigator ─────────────────────────────────────────────────────────

function QuestionNav({ total, currentAbsolute, sectionStart, answeredSet, flagged, onJump }: {
  total: number; currentAbsolute: number; sectionStart: number
  answeredSet: Set<number>; flagged: Set<number>; onJump: (i: number) => void
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginTop: 20 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
        Question Navigator
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => {
          const abs = sectionStart + i
          const isCurrent = abs === currentAbsolute
          const isAnswered = answeredSet.has(abs)
          const isFlagged = flagged.has(abs)
          return (
            <button key={i} onClick={() => onJump(abs)} style={{
              width: 32, height: 32, borderRadius: 6,
              fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', cursor: 'pointer',
              border: isCurrent ? '2px solid var(--accent)' : isFlagged ? '1px solid var(--warning)' : isAnswered ? '1px solid var(--correct)' : '1px solid var(--border)',
              background: isCurrent ? 'rgba(228,224,52,0.12)' : isFlagged ? 'rgba(255,197,61,0.08)' : isAnswered ? 'rgba(56,192,115,0.08)' : 'var(--bg-elevated)',
              color: isCurrent ? 'var(--accent)' : isFlagged ? 'var(--warning)' : isAnswered ? 'var(--correct)' : 'var(--text-muted)',
            }}>
              {i + 1}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[['var(--correct)', 'Answered'], ['var(--warning)', 'Flagged'], ['var(--border)', 'Unanswered']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, border: `1px solid ${color}` }} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Break screen ───────────────────────────────────────────────────────────────

function BreakScreen({ nextLabel, timeLeft, onSkip }: { nextLabel: string; timeLeft: number; onSkip: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Section Complete — Break
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '3.5rem', color: 'var(--accent)', lineHeight: 1 }}>
        {formatTime(timeLeft)}
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 380, margin: 0 }}>
        Take a short break. Next up: <strong style={{ color: 'var(--text-primary)' }}>{nextLabel}</strong>
      </p>
      <button onClick={onSkip} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 28px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
        Skip Break →
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const navigate = useNavigate()
  const { state, currentQuestion, startSession, answerQuestion, flagQuestion, completeSession } = useSession()

  const [error, setError] = useState('')
  const [showBreak, setShowBreak] = useState(false)
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_TIME)
  const [displayIndex, setDisplayIndex] = useState(0)
  const answeredSet = new Set(state.responses.map((_, i) => i))

  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevIndexRef = useRef(-1)

  // Sync display with current question unless user navigated away
  useEffect(() => {
    setDisplayIndex(state.currentIndex)
  }, [state.currentIndex])

  // Detect section boundary crossings to trigger break
  useEffect(() => {
    if (state.status !== 'active') return
    const prev = prevIndexRef.current
    const curr = state.currentIndex
    if ((prev === 26 && curr === 27) || (prev === 53 && curr === 54)) {
      setBreakTimeLeft(BREAK_TIME)
      setShowBreak(true)
    }
    prevIndexRef.current = curr
  }, [state.currentIndex, state.status])

  // Break countdown
  useEffect(() => {
    if (!showBreak) return
    breakTimerRef.current = setInterval(() => {
      setBreakTimeLeft(t => {
        if (t <= 1) { clearInterval(breakTimerRef.current!); setShowBreak(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current) }
  }, [showBreak])

  const handleBegin = async () => {
    setError('')
    prevIndexRef.current = -1
    try {
      await startSession({ mode: 'simulation', questionTypes: ['all'], difficulty: 'mixed', count: 81 })
    } catch (e) {
      if (e instanceof FreeLimitError) navigate('/upgrade')
      else setError('Failed to start simulation. Please try again.')
    }
  }

  const handleEndSection = () => {
    const section = getSection(state.currentIndex)
    if (section === SECTIONS[2]) {
      completeSession()
    } else {
      setBreakTimeLeft(BREAK_TIME)
      setShowBreak(true)
    }
  }

  if (state.status === 'loading') return <LoadingQuestions />

  if (state.status === 'idle') {
    return <PreTestScreen onBegin={handleBegin} error={error} />
  }

  if (showBreak) {
    const nextSection = SECTIONS.find(s => s.start > state.currentIndex)
    return (
      <BreakScreen
        nextLabel={nextSection?.label ?? ''}
        timeLeft={breakTimeLeft}
        onSkip={() => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); setShowBreak(false) }}
      />
    )
  }

  if ((state.status === 'active' || state.status === 'reviewing') && currentQuestion) {
    const section = getSection(state.currentIndex)
    const sectionTotal = section.end - section.start + 1
    const isFinal = section === SECTIONS[2]
    const displayQuestion = state.questions[displayIndex] ?? currentQuestion
    const isViewingPast = displayIndex < state.currentIndex

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <TestHeader
          sectionLabel={section.label}
          timeRemaining={state.timeRemaining}
          qNumber={state.currentIndex - section.start + 1}
          qTotal={sectionTotal}
          onEnd={handleEndSection}
          isFinal={isFinal}
        />
        <div style={{ padding: '24px', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
            {isViewingPast && (
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.07em', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Reviewing Q{displayIndex + 1}
              </span>
            )}
            <button
              onClick={() => flagQuestion(displayIndex)}
              style={{
                background: state.flagged.has(displayIndex) ? 'rgba(255,197,61,0.12)' : 'var(--bg-elevated)',
                border: `1px solid ${state.flagged.has(displayIndex) ? 'var(--warning)' : 'var(--border)'}`,
                borderRadius: 6, padding: '5px 12px',
                fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em',
                color: state.flagged.has(displayIndex) ? 'var(--warning)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {state.flagged.has(displayIndex) ? '⚑ Flagged' : '⚐ Flag'}
            </button>
          </div>

          <QuestionCard
            question={displayQuestion}
            questionNumber={displayIndex - section.start + 1}
            totalQuestions={sectionTotal}
            mode="timed"
            onAnswer={isViewingPast ? () => {} : answerQuestion}
            answered={isViewingPast}
            chosenIndex={state.responses[displayIndex]?.chosenIndex}
            showExplanation={false}
          />

          <QuestionNav
            total={sectionTotal}
            currentAbsolute={state.currentIndex}
            sectionStart={section.start}
            answeredSet={answeredSet}
            flagged={state.flagged}
            onJump={i => setDisplayIndex(i)}
          />
        </div>
      </div>
    )
  }

  navigate('/dashboard')
  return null
}
