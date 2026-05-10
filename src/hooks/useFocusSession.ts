import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BreakTier, BreakActivity, FocusSession, FocusPhase } from '@/types/focusMode';
import { toast } from 'sonner';

export const SESSION_STORAGE_KEY = 'm87_focus_session_id';

const mapRow = (data: Record<string, unknown>): FocusSession => ({
  id: data.id as string,
  userId: data.user_id as string,
  focusDuration: data.focus_duration as number,
  breakTier: data.break_tier as BreakTier,
  breakActivity: data.break_activity as BreakActivity | null,
  breakDuration: data.break_duration as number,
  phase: data.phase as FocusPhase,
  focusStartedAt: data.focus_started_at ? new Date(data.focus_started_at as string) : null,
  breakStartedAt: data.break_started_at ? new Date(data.break_started_at as string) : null,
  completedAt: data.completed_at ? new Date(data.completed_at as string) : null,
  swapAllowed: data.swap_allowed as boolean,
  swapUsed: data.swap_used as boolean,
  focusMinutesCompleted: data.focus_minutes_completed as number,
  breakCompleted: data.break_completed as boolean,
  exitedEarly: data.exited_early as boolean,
});

export const useFocusSession = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createSession = async (
    userId: string,
    focusDuration: number,
    breakTier: BreakTier,
    breakActivity: BreakActivity | null
  ): Promise<FocusSession | null> => {
    setIsLoading(true);

    // Derive break duration from tier
    const tierDurations: Record<BreakTier, number> = {
      micro: 5,
      short: 10,
      standard: 15,
      deep: 20,
    };
    const breakDuration = tierDurations[breakTier];
    const finalActivity = breakTier === 'deep' ? breakActivity : null;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: userId,
          focus_duration: focusDuration,
          break_tier: breakTier,
          break_activity: finalActivity,
          break_duration: breakDuration,
          phase: 'idle',
          swap_allowed: true,
          swap_used: false,
          focus_minutes_completed: 0,
          break_completed: false,
          exited_early: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast.error('Failed to initiate session. Please try again.');
        return null;
      }

      const session = mapRow(data as Record<string, unknown>);
      // Persist ID so the HUD can pick it up on mount
      sessionStorage.setItem(SESSION_STORAGE_KEY, session.id);
      return session;
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a session by ID (used by HUD on mount)
  const getSessionById = async (sessionId: string): Promise<FocusSession | null> => {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        console.error('Error fetching session:', error);
        return null;
      }

      return mapRow(data as Record<string, unknown>);
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  };

  // Update session phase + relevant timestamps atomically
  const updateSessionPhase = async (
    sessionId: string,
    phase: FocusPhase,
    extras?: {
      focus_started_at?: string;
      break_started_at?: string;
      focus_minutes_completed?: number;
    }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('focus_sessions')
        .update({ phase, ...extras })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session phase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected error updating phase:', err);
      return false;
    }
  };

  return { createSession, getSessionById, updateSessionPhase, isLoading };
};
