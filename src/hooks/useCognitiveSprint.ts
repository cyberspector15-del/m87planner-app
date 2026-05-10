import { useState, useEffect, useRef, useCallback } from 'react';

export type SprintGameState =
  | 'ready'
  | 'playing'
  | 'breathing'
  | 'complete';

export type SprintRoundType = 'pattern' | 'sequence' | 'odd';

const ROUNDS: SprintRoundType[] = ['pattern', 'sequence', 'odd'];
const BREATHING_SECS = 5;

// Seeded PRNG for consistent randomized rounds if needed
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s ^ (s >>> 15);
    t = (Math.imul(t, 1 | s) >>> 0);
    t = (t + (Math.imul(t ^ (t >>> 7), 61 | t) >>> 0)) >>> 0;
    return (t ^ (t >>> 14)) / 4294967296;
  };
}

export const useCognitiveSprint = (seed: number, breakExpired: boolean) => {
  const [gameState, setGameState] = useState<SprintGameState>('ready');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(BREATHING_SECS);
  const [score, setScore] = useState(0);
  
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingComplete = useRef(false);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Handle break expiration
  useEffect(() => {
    if (!breakExpired) return;
    pendingComplete.current = true;
    if (gameState === 'breathing' || gameState === 'ready') {
      clearTimers();
      setGameState('complete');
    }
  }, [breakExpired, gameState, clearTimers]);

  // Breathing countdown & Transition
  useEffect(() => {
    if (gameState !== 'breathing') return;
    
    setBreathingSecondsLeft(BREATHING_SECS);
    
    const id = setInterval(() => {
      setBreathingSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          // Trigger transition immediately when hitting 0
          setTimeout(() => {
            if (pendingComplete.current || currentRoundIndex >= ROUNDS.length - 1) {
              setGameState('complete');
            } else {
              setCurrentRoundIndex(idx => idx + 1);
              setGameState('playing');
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [gameState, currentRoundIndex]);

  const startRound = () => {
    setGameState('playing');
  };

  const completeRound = (roundScore: number) => {
    setScore(prev => prev + roundScore);
    if (currentRoundIndex >= ROUNDS.length - 1) {
      setGameState('complete');
    } else {
      setGameState('breathing');
    }
  };

  const playAgain = () => {
    clearTimers();
    pendingComplete.current = false;
    setCurrentRoundIndex(0);
    setScore(0);
    setGameState('ready');
  };

  return {
    gameState,
    currentRoundIndex,
    currentRoundType: ROUNDS[currentRoundIndex],
    breathingSecondsLeft,
    score,
    startRound,
    completeRound,
    playAgain,
    seed
  };
};
