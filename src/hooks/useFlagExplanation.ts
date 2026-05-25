import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface FlagPayload {
  question_type: string
  stimulus: string
  stem: string
  explanation: string
  rating: 'helpful' | 'not_helpful'
  comment?: string
}

export function useFlagExplanation() {
  return useMutation({
    mutationFn: async (payload: FlagPayload) => {
      const { data, error } = await supabase.functions.invoke('flag-explanation', { body: payload })
      if (error) throw error
      return data
    },
  })
}
