import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from './lib/supabase'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Something went wrong</div>
          <div style={{ fontSize: '0.85rem', color: '#888', maxWidth: 400 }}>{(this.state.error as Error).message}</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, background: '#e4e034', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionContextProvider supabaseClient={supabase}>
          <App />
        </SessionContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
