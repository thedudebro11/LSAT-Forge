import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useUpgrade() {
  return useMutation({
    mutationFn: async (plan: 'monthly' | 'annual') => {
      const priceId = plan === 'annual'
        ? import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID
        : import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      })
      if (error) throw error
      return data as { url: string }
    },
    onSuccess: ({ url }) => { window.location.href = url },
  })
}

export function useManageBilling() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-portal-session')
      if (error) throw error
      return data as { url: string }
    },
    onSuccess: ({ url }) => { window.location.href = url },
  })
}

export function useCancelSubscription() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription')
      if (error) throw error
      return data
    },
  })
}
