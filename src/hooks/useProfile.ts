import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export const queryKeys = {
  profile: (id: string) => ['profile', id],
  sessions: (id: string) => ['sessions', id],
  session: (id: string) => ['session', id],
  typeStats: (id: string) => ['typeStats', id],
  simulationResults: (id: string) => ['simulationResults', id],
}

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', user!.id).single()
      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}
