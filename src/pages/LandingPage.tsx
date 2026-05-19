import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// ── Data ──────────────────────────────────────────────────────────────────────

const PROBLEMS = [
  { emoji: '😤', title: 'LawHub is clunky', desc: 'Slow interface, a finite question bank, and UX that gets in the way of actual studying.' },
  { emoji: '📚', title: 'Books run out', desc: 'Prep books have a fixed question count. Once you\'ve done them all, you\'re stuck repeating.' },
  { emoji: '💸', title: 'Tutors cost thousands', desc: 'Private LSAT tutors charge $150–$400/hour. Not every applicant has that budget.' },
]

const FEATURES = [
  { symbol: '∞', title: 'Unlimited Questions', desc: 'AI generates fresh, original questions every session. Never the same test twice. Never run out of material.' },
  { symbol: '⏱', title: 'Full Test Simulation', desc: 'Three 35-minute sections, real countdown timers, authentic conditions. Know your score range before exam day.' },
  { symbol: '📊', title: 'Smart Analytics', desc: 'See exactly where you\'re weak — by question type, by difficulty. Target what actually moves your score.' },
  { symbol: '✦', title: 'Instant Explanations', desc: 'Every answer has a detailed breakdown. Understand why the correct answer is right and why each trap fails.' },
]

const FREE_FEATURES = [
  '20 practice questions (lifetime)',
  'Logical Reasoning + RC',
  'Instant answer explanations',
  'Practice mode only',
]

const PRO_FEATURES = [
  'Unlimited questions',
  'All 14 LR question types + RC',
  'Drill Mode — master one type at a time',
  'Full Test Simulation (81 questions, timed)',
  'Weak Spot Review — auto-targeted sessions',
  'Performance analytics dashboard',
  'Score trend tracking',
  'Estimated LSAT score range',
]

const FAQ = [
  { q: 'Are these real LSAT questions?', a: 'No. All questions are original AI-generated content modeled on LSAT logic and structure — not sourced from official LSAC materials. They\'re designed to match the real LSAT\'s style, structure, and difficulty.' },
  { q: 'How many questions can I practice for free?', a: 'Free accounts get 20 questions, lifetime. No time limit and no credit card required. When you hit the cap you\'ll see an upgrade prompt.' },
  { q: 'What\'s included in Pro?', a: 'Unlimited questions, all practice modes (Drill, Full Test Simulation, Weak Spot Review), and the full analytics dashboard — accuracy by question type, score trend charts, and estimated LSAT score range.' },
  { q: 'Is the full test simulation realistic?', a: 'Yes. Three 35-minute sections: two Logical Reasoning and one Reading Comprehension, with real countdown timers and no feedback during the test. Results are shown at the end — just like the real thing.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your account page. You keep Pro access through the end of your current billing period.' },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function Logo({ size = '1.1rem' }: { size?: string }) {
  return (
    <span>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size, color: 'var(--text-primary)' }}>LSAT</span>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size, color: 'var(--accent)' }}>FORGE</span>
    </span>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="7" fill="rgba(228,224,52,0.12)" />
      <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#e4e034" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '20px 0', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif',
          fontSize: '1rem', fontWeight: 500,
        }}
      >
        <span>{q}</span>
        <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 300, lineHeight: 1, flexShrink: 0, marginLeft: 16 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p style={{
          color: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 20px', maxWidth: 580,
        }}>
          {a}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60,
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{
            color: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
            padding: '6px 12px',
          }}>
            Log in
          </Link>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'var(--accent)', color: 'var(--accent-fg)',
              border: 'none', borderRadius: 6,
              padding: '7px 18px',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Start Free
          </button>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(228,224,52,0.09)', border: '1px solid rgba(228,224,52,0.22)',
          borderRadius: 100, padding: '4px 16px', marginBottom: 28,
          fontFamily: 'DM Mono, monospace', fontSize: '0.68rem',
          letterSpacing: '0.12em', color: 'var(--accent)',
        }}>
          UNLIMITED PRACTICE · ZERO REPETITION
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(2.2rem, 5.5vw, 3.75rem)',
          lineHeight: 1.08, letterSpacing: '-0.03em',
          margin: '0 0 22px',
        }}>
          The LSAT Prep Tool That{' '}
          <span style={{ color: 'var(--accent)' }}>Never Runs Out</span>
          {' '}of Questions
        </h1>

        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '1.125rem',
          color: 'var(--text-secondary)', lineHeight: 1.7,
          margin: '0 auto 40px', maxWidth: 540,
        }}>
          AI-generated practice questions modeled on real LSAT logic.
          Unlimited. Fresh every time. Full test simulations with real timing.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'var(--accent)', color: 'var(--accent-fg)',
              border: 'none', borderRadius: 8,
              padding: '13px 28px',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Start Free — No Card Required
          </button>
          <button
            onClick={() => scrollTo('features')}
            style={{
              background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)', borderRadius: 8,
              padding: '13px 28px',
              fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            See How It Works
          </button>
        </div>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          All questions are original AI-generated content — not sourced from official LSAT materials
        </p>
      </section>

      {/* ─── PROBLEM ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 96px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROBLEMS.map(p => (
            <div key={p.title} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '28px 28px 24px',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 14 }}>{p.emoji}</div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem',
                margin: '0 0 8px', color: 'var(--text-primary)',
              }}>{p.title}</h3>
              <p style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0,
              }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            letterSpacing: '-0.025em', margin: '0 0 10px',
          }}>
            How It Works
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
            Generate → Practice → Improve
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '28px', display: 'flex', gap: 18, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                background: 'rgba(228,224,52,0.1)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>{f.symbol}</div>
              <div>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem',
                  margin: '0 0 6px', color: 'var(--text-primary)',
                }}>{f.title}</h3>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                  color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0,
                }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            letterSpacing: '-0.025em', margin: '0 0 28px',
          }}>Simple Pricing</h2>
          {/* Billing toggle */}
          <div style={{
            display: 'inline-flex', background: 'var(--bg-surface)',
            border: '1px solid var(--border)', borderRadius: 8, padding: 4, gap: 2,
          }}>
            {(['monthly', 'annual'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                background: billing === b ? 'var(--bg-elevated)' : 'transparent',
                border: 'none', borderRadius: 6, padding: '7px 18px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500,
                color: billing === b ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span style={{
                    background: 'rgba(228,224,52,0.15)', color: 'var(--accent)',
                    fontFamily: 'DM Mono, monospace', fontSize: '0.62rem',
                    fontWeight: 700, letterSpacing: '0.06em',
                    padding: '1px 5px', borderRadius: 4,
                  }}>SAVE 43%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '32px',
          }}>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.1em',
              color: 'var(--text-muted)', marginBottom: 14,
            }}>FREE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.5rem' }}>$0</span>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>
              forever
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Check />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/signup')} style={{
              width: '100%', background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)', borderRadius: 8, padding: 12,
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}>
              Get Started Free
            </button>
          </div>

          {/* Pro */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(228,224,52,0.38)',
            borderRadius: 12, padding: '32px', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -1, right: 20,
              background: 'var(--accent)', color: 'var(--accent-fg)',
              fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
              padding: '3px 10px', borderRadius: '0 0 6px 6px',
            }}>MOST POPULAR</div>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.1em',
              color: 'var(--accent)', marginBottom: 14,
            }}>PRO</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.5rem' }}>
                {billing === 'monthly' ? '$29' : '$17'}
              </span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-muted)', fontSize: '0.85rem' }}>/mo</span>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>
              {billing === 'monthly' ? 'billed monthly — cancel anytime' : '$199 billed annually'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Check />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/signup')} style={{
              width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)',
              border: 'none', borderRadius: 8, padding: 12,
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}>
              Start Pro
            </button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 660, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
          letterSpacing: '-0.025em', margin: '0 0 40px', textAlign: 'center',
        }}>Questions</h2>
        {FAQ.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        maxWidth: 960, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <Logo size="0.95rem" />
          <p style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.73rem',
            color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: 400,
          }}>
            Original AI-generated content modeled on LSAT logic. Not affiliated with or endorsed by LSAC.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Log in', '/login'], ['Sign Up', '/signup'], ['Pricing', '#pricing']].map(([label, to]) => (
            <a key={label} href={to} onClick={e => { if (to.startsWith('#')) { e.preventDefault(); scrollTo(to.slice(1)) } }}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
