import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useLocation, useNavigate } from 'react-router-dom'

export type SubscriptionTier = 
  'none' | 'event_horizon' | 'advance' | 'apex' | 'singularity'

interface SubscriptionState {
  tier: SubscriptionTier
  isActive: boolean
  isLoading: boolean
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'none',
    isActive: false,
    isLoading: true
  })

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setState({ tier: 'none', isActive: false, isLoading: false })
        return
      }

      const user = session.user

      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setState({
          tier: (data.subscription_tier as SubscriptionTier) || 'none',
          isActive: data.subscription_status === 'active',
          isLoading: false
        })
      } else {
        setState({ tier: 'none', isActive: false, isLoading: false })
      }
    }

    fetchSubscription()
  }, [])

  return state
}

export function useRequireSubscription() {
  const { isActive, isLoading } = useSubscription()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return
    
    if (!isActive) {
      const timer = setTimeout(() => {
        navigate(location.pathname.startsWith('/m') ? '/m/pricing' : '/pricing')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isActive, isLoading, location.pathname, navigate])

  return { isActive, isLoading }
}
