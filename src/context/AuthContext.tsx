import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser, useSessionContext } from '@supabase/auth-helpers-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isPro: boolean
  questionsRemaining: number
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const { isLoading: sessionLoading } = useSessionContext()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const isPro =
    !!profile &&
    profile.tier !== 'free' &&
    profile.subscription_status === 'active'

  const questionsRemaining = Math.max(0, 20 - (profile?.questions_used ?? 0))
  const isLoading = sessionLoading

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isPro, questionsRemaining, refreshProfile: fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
