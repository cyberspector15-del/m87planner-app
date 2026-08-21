import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FocusSession } from '@/types/focusMode';
import { SESSION_STORAGE_KEY } from './useFocusSession';
import { useFocusSessionAward } from './useFocusSessionAward';

interface UseFocusTimerReturn {
  session: FocusSession | null;
  secondsLeft: number;
  progressPct: number;
  phase: 'loading' | 'focus' | 'break' | 'complete';
  focusElapsedSecondsRef: React.MutableRefObject<number>;
}

export const useFocusTimer = (): UseFocusTimerReturn => {
  const { awardFocusSession } = useFocusSessionAward();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'focus' | 'break' | 'complete'>('loading');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusElapsedSecondsRef = useRef(0);

  // Fetch session on mount using the stored ID
  useEffect(() => {
    const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) return;

    const fetchAndStart = async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        console.error('Could not load session', error);
        return;
      }

      const now = new Date().toISOString();
      const currentPhase = data.phase as 'idle' | 'focus' | 'break' | 'complete';

      // Determine initial remaining seconds and phase
      let initialSeconds = 0;
      let initialPhase: 'focus' | 'break' | 'complete' = 'focus';

      if (currentPhase === 'idle' || currentPhase === 'focus') {
        const updatePayload: Record<string, unknown> = { phase: 'focus' };
        if (!data.focus_started_at) updatePayload.focus_started_at = now;

        if (currentPhase === 'idle') {
          await supabase.from('focus_sessions').update(updatePayload).eq('id', sessionId);
        }

        const totalSeconds = (data.focus_duration as number) * 60;
        const startedAt = data.focus_started_at ? new Date(data.focus_started_at as string) : new Date();
        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        initialSeconds = Math.max(totalSeconds - elapsed, 0);
        focusElapsedSecondsRef.current = elapsed;
        initialPhase = 'focus';
      } else if (currentPhase === 'break') {
        const totalSeconds = (data.break_duration as number) * 60;
        const startedAt = data.break_started_at ? new Date(data.break_started_at as string) : new Date();
        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        initialSeconds = Math.max(totalSeconds - elapsed, 0);
        initialPhase = 'break';
      } else {
        initialPhase = 'complete';
      }

      setSession({
        id: data.id as string,
        userId: data.user_id as string,
        focusDuration: data.focus_duration as number,
        breakTier: data.break_tier as FocusSession['breakTier'],
        breakActivity: data.break_activity as FocusSession['breakActivity'],
        breakDuration: data.break_duration as number,
        phase: data.phase as FocusSession['phase'],
        focusStartedAt: new Date(data.focus_started_at as string || now),
        breakStartedAt: data.break_started_at ? new Date(data.break_started_at as string) : null,
        completedAt: data.completed_at ? new Date(data.completed_at as string) : null,
        swapAllowed: data.swap_allowed as boolean,
        swapUsed: data.swap_used as boolean,
        focusMinutesCompleted: data.focus_minutes_completed as number,
        breakCompleted: data.break_completed as boolean,
        exitedEarly: data.exited_early as boolean,
      });
      setSecondsLeft(initialSeconds);
      setPhase(initialPhase);
    };

    fetchAndStart();
  }, []);

  // Countdown tick
  useEffect(() => {
    if (phase !== 'focus' && phase !== 'break') return;

    timerRef.current = setInterval(async () => {
      if (phase === 'focus') {
        focusElapsedSecondsRef.current += 1;
      }
      setSecondsLeft(prev => {
        const next = prev - 1;

        if (next <= 0) {
          clearInterval(timerRef.current!);

          const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (sessionId && session) {
            const now = new Date().toISOString();
            
            if (phase === 'focus') {
              // Transition to break
              supabase
                .from('focus_sessions')
                .update({
                  phase: 'break',
                  break_started_at: now,
                  focus_minutes_completed: session.focusDuration,
                })
                .eq('id', sessionId)
                .then(({ error }) => {
                  if (error) {
                    console.error('Could not transition focus session to break:', error);
                    return;
                  }
                  setSecondsLeft(session.breakDuration * 60);
                  setPhase('break');
                });
            } else if (phase === 'break') {
              // Transition to complete
              supabase
                .from('focus_sessions')
                .update({
                  phase: 'complete',
                  break_completed: true,
                  completed_at: now,
                })
                .eq('id', sessionId)
                .then(async ({ error }) => {
                  if (error) {
                    console.error('Could not complete focus session:', error);
                    return;
                  }
                  await awardFocusSession(sessionId);
                  setPhase('complete');
                });
            }
          }

          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [awardFocusSession, phase, session]);

  // Calculate progress percentage
  let progressPct = 0;
  if (session) {
    if (phase === 'focus') {
      const totalSeconds = session.focusDuration * 60;
      progressPct = Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100);
    } else if (phase === 'break') {
      const totalSeconds = session.breakDuration * 60;
      progressPct = Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100);
    } else if (phase === 'complete') {
      progressPct = 100;
    }
  }

  return { session, secondsLeft, progressPct, phase, focusElapsedSecondsRef };
};
