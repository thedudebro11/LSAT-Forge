import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from './useProfile'

interface CompletePayload {
  sessionId: string
  responses: Array<{
    questionType: string
    difficulty: string
    chosenIndex: number
    correctIndex: number
    isCorrect: boolean
    timeSpentSeconds: number
  }>
  totalTimeSeconds: number
}

export function useCompleteSession() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CompletePayload) => {
      const { data, error } = await supabase.functions.invoke('complete-session', { body: payload })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.typeStats(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.simulationResults(user.id) })
      refreshProfile()
    },
  })
}
