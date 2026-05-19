import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useUser } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabase'

type Tab = 'login' | 'signup'

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)' }}>LSAT</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>FORGE</span>
      </Link>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)',
      borderTopColor: 'rgba(0,0,0,0.7)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', display: 'inline-block',
    }} />
  )
}

// inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
  const s = document.createElement('style')
  s.id = 'spin-style'
  s.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(s)
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg-elevated)',
    border: `1px solid ${focused ? 'var(--accent)' : 'var(--border-strong)'}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useUser()

  const initialTab: Tab = location.pathname === '/signup' ? 'signup' : 'login'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const clearForm = () => { setName(''); setEmail(''); setPassword(''); setError('') }
  const switchTab = (t: Tab) => { setTab(t); clearForm() }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) setError(error.message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
      }
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) setError(error.message)
    else setError('Check your email for a password reset link.')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '36px 32px',
      }}>
        <Logo />

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-elevated)',
          borderRadius: 8, padding: 3, marginBottom: 28, gap: 2,
        }}>
          {(['login', 'signup'] as Tab[]).map(t => (
            <button key={t} onClick={() => switchTab(t)} style={{
              flex: 1, background: tab === t ? 'var(--bg-surface)' : 'transparent',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 6, padding: '7px 0',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500,
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 8, padding: '10px 0',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: 500,
          color: 'var(--text-primary)', cursor: 'pointer', marginBottom: 20,
        }}>
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'signup' && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              required
              style={inputStyle(focused === 'name')}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            required
            style={inputStyle(focused === 'email')}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocused('pwd')}
            onBlur={() => setFocused(null)}
            required
            minLength={6}
            style={inputStyle(focused === 'pwd')}
          />

          {/* Error */}
          {error && (
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
              color: error.includes('Check your email') ? 'var(--correct)' : 'var(--wrong)',
              margin: 0,
            }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--accent-hover)' : 'var(--accent)',
            color: 'var(--accent-fg)', border: 'none', borderRadius: 8,
            padding: '11px 0',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 4,
          }}>
            {loading && <Spinner />}
            {loading ? '...' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Forgot password */}
        {tab === 'login' && (
          <button onClick={handleForgotPassword} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
            color: 'var(--text-muted)', marginTop: 14, padding: 0,
            display: 'block', width: '100%', textAlign: 'center',
          }}>
            Forgot password?
          </button>
        )}

        {/* Switch tab hint */}
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
          color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, marginBottom: 0,
        }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.8rem', fontWeight: 600, padding: 0,
          }}>
            {tab === 'login' ? 'Sign up free' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
