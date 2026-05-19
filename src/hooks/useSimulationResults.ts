import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from './useProfile'

export function useSimulationResults() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.simulationResults(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulation_results').select('*')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
