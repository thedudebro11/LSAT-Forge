import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requirePro?: boolean
}

export function ProtectedRoute({ children, requirePro = false }: ProtectedRouteProps) {
  const { user, isLoading, isPro } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (requirePro && !isPro) return <Navigate to="/upgrade" replace />

  return <>{children}</>
}
