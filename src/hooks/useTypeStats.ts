import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from './useProfile'

export function useTypeStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.typeStats(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('type_stats').select('*').eq('user_id', user!.id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
