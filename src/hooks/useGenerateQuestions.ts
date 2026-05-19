import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from './useProfile'
import type { GenerateParams } from '../types'

export class FreeLimitError extends Error { constructor() { super('FREE_LIMIT_REACHED') } }
export class ProRequiredError extends Error { constructor() { super('PRO_REQUIRED') } }

export function useGenerateQuestions() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: GenerateParams) => {
      const { data, error } = await supabase.functions.invoke('generate-questions', { body: params })
      if (error) throw error
      if (data?.error === 'FREE_LIMIT_REACHED') throw new FreeLimitError()
      if (data?.error === 'PRO_REQUIRED') throw new ProRequiredError()
      if (!data?.questions) throw new Error('No questions returned')
      return data as { questions: unknown[]; sessionId: string }
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
    },
    onSettled: () => { refreshProfile() },
  })
}
