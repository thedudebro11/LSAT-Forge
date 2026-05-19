import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from './useProfile'

export function useSessions(limit = 10) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...queryKeys.sessions(user?.id ?? ''), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

export function useSession(sessionId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions').select('*').eq('id', sessionId!).single()
      if (error) throw error
      return data
    },
    enabled: !!user && !!sessionId,
  })
}

export function useSessionResponses(sessionId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['responses', sessionId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responses').select('*').eq('session_id', sessionId!)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user && !!sessionId,
  })
}
