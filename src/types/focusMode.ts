export type BreakTier = 'micro' | 'short' | 'standard' | 'deep';
export type BreakActivity = 'play' | 'move' | 'fuel' | 'drift' | 'surface';
export type FocusPhase = 'idle' | 'focus' | 'break' | 'complete';

export interface FocusSession {
  id: string;
  userId: string;
  focusDuration: number;
  breakTier: BreakTier;
  breakActivity: BreakActivity | null;
  breakDuration: number;
  phase: FocusPhase;
  focusStartedAt: Date | null;
  breakStartedAt: Date | null;
  completedAt: Date | null;
  swapAllowed: boolean;
  swapUsed: boolean;
  focusMinutesCompleted: number;
  breakCompleted: boolean;
  exitedEarly: boolean;
}
