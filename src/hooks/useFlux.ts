import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useSubscription } from './useSubscription'

const TIER_ALLOWANCE: Record<string, number> = {
  none: 0,
  event_horizon: 500,
  advance: 1000,
  apex: 2000,
  singularity: 4000
}

const ACTION_COSTS: Record<string, number> = {
  simulation: 200,
  auto_plan: 50,
  ai_command: 15,
  conversation_mode: 30,
  smart_reschedule: 20
}

interface FluxState {
  balance: number
  monthlyAllowance: number
  isLoading: boolean
}

export function useFlux() {
  const { tier, isActive } = useSubscription()
  const [state, setState] = useState<FluxState>({
    balance: 0,
    monthlyAllowance: 0,
    isLoading: true
  })

  const monthlyAllowance = TIER_ALLOWANCE[tier] ?? 0

  const fetchOrInitCredits = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setState({ balance: 0, monthlyAllowance: 0, isLoading: false })
      return
    }

    const userId = session.user.id
    const { data: existing } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existing) {
      const initialBalance = isActive ? monthlyAllowance : 0
      const { data: newRecord } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: initialBalance,
          monthly_allowance: monthlyAllowance,
          last_reset_date: new Date().toISOString()
        })
        .select()
        .single()

      setState({
        balance: newRecord?.balance ?? initialBalance,
        monthlyAllowance,
        isLoading: false
      })
      return
    }

    // Monthly reset logic only for active subscriptions
    if (isActive) {
      const lastReset = new Date(existing.last_reset_date)
      const now = new Date()
      const monthsPassed = (now.getFullYear() - lastReset.getFullYear()) 
        * 12 + (now.getMonth() - lastReset.getMonth())

      if (monthsPassed >= 1) {
        const cap = monthlyAllowance * 2
        const newBalance = Math.min(
          existing.balance + monthlyAllowance, cap
        )
        await supabase
          .from('user_credits')
          .update({
            balance: newBalance,
            monthly_allowance: monthlyAllowance,
            last_reset_date: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: monthlyAllowance,
            action_type: 'monthly_reset',
            description: `Monthly FLUX — ${tier}`
          })

        setState({ balance: newBalance, monthlyAllowance, isLoading: false })
      } else {
        setState({
          balance: existing.balance,
          monthlyAllowance,
          isLoading: false
        })
      }
    } else {
      // Not active but has existing credits
      setState({
        balance: existing.balance,
        monthlyAllowance: 0,
        isLoading: false
      })
    }
  }, [tier, isActive, monthlyAllowance])

  useEffect(() => {
    fetchOrInitCredits()
  }, [fetchOrInitCredits])

  const spendFlux = useCallback(async (
    actionType: string,
    cost?: number
  ): Promise<boolean> => {
    const actualCost = cost ?? ACTION_COSTS[actionType] ?? 0
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const userId = session.user.id
    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (!credits || credits.balance < actualCost) return false

    const newBalance = credits.balance - actualCost
    await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)

    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -actualCost,
        action_type: actionType,
        description: `Used ${actualCost} FLUX for ${actionType}`
      })

    setState(prev => ({ ...prev, balance: newBalance }))
    return true
  }, [])

  return {
    balance: state.balance,
    monthlyAllowance: state.monthlyAllowance,
    isLoading: state.isLoading,
    spendFlux,
    canAfford: (actionType: string) => {
      const cost = ACTION_COSTS[actionType] ?? 0
      return state.balance >= cost
    },
    ACTION_COSTS
  }
}
