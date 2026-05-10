import { useState, useEffect, useRef, useCallback } from 'react';

export type GameState =
  | 'ready'
  | 'playback'
  | 'input'
  | 'matched'
  | 'breathing'
  | 'complete';

const NODE_COUNT = 6;
const SEQ_LENGTHS = [3, 4, 5];
const PLAYBACK_ON_MS = 600;
const PLAYBACK_GAP_MS = 200;
const PLAYBACK_START_DELAY_MS = 500;
const MATCHED_HOLD_MS = 1200;
const BREATHING_SECS = 10;

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
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

function generateSequences(seed: number): number[][] {
  const rand = mulberry32(seed);
  return SEQ_LENGTHS.map(len =>
    Array.from({ length: len }, () => Math.floor(rand() * NODE_COUNT))
  );
}

export interface UseSignalEchoReturn {
  gameState: GameState;
  currentRound: number;
  sequences: number[][];
  activeNodeIndex: number | null;
  userFlashNode: { index: number; correct: boolean } | null;
  inputProgress: number;
  hasRetried: boolean;
  roundsMatched: number;
  breathingSecondsLeft: number;
  startRound: () => void;
  handleNodeTap: (idx: number) => void;
  playAgain: () => void;
}

export const useSignalEcho = (seed: number, breakExpired: boolean): UseSignalEchoReturn => {
  const sequences = useRef<number[][]>(generateSequences(seed));
  const pendingComplete = useRef(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [userFlashNode, setUserFlashNode] = useState<{ index: number; correct: boolean } | null>(null);
  const [inputProgress, setInputProgress] = useState(0);
  const [hasRetried, setHasRetried] = useState(false);
  const [roundsMatched, setRoundsMatched] = useState(0);
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(BREATHING_SECS);

  // ── stable ref snapshots for use inside timeouts ─────────────────────────
  const roundRef = useRef(currentRound);
  roundRef.current = currentRound;
  const retriedRef = useRef(hasRetried);
  retriedRef.current = hasRetried;
  const progressRef = useRef(inputProgress);
  progressRef.current = inputProgress;
  const matchedRef = useRef(roundsMatched);
  matchedRef.current = roundsMatched;

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── break expired: interrupt breathing/ready, let playback/input finish ──
  useEffect(() => {
    if (!breakExpired) return;
    pendingComplete.current = true;
    setGameState(prev => {
      if (prev === 'breathing' || prev === 'ready' || prev === 'matched') {
        clearTimers();
        return 'complete';
      }
      return prev;
    });
  }, [breakExpired, clearTimers]);

  // ── breathing countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'breathing') return;
    setBreathingSecondsLeft(BREATHING_SECS);
    const id = setInterval(() => {
      setBreathingSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [gameState]);

  // when breathing countdown finishes → next round or complete
  useEffect(() => {
    if (gameState !== 'breathing' || breathingSecondsLeft > 0) return;
    if (pendingComplete.current || roundRef.current >= 2) {
      setGameState('complete');
    } else {
      setCurrentRound(r => r + 1);
      setHasRetried(false);
      setInputProgress(0);
      setGameState('ready');
    }
  }, [breathingSecondsLeft, gameState]);

  // ── playback runner ──────────────────────────────────────────────────────
  const runPlayback = useCallback((round: number) => {
    clearTimers();
    setGameState('playback');
    setActiveNodeIndex(null);
    setInputProgress(0);

    const seq = sequences.current[round];
    let delay = PLAYBACK_START_DELAY_MS;

    seq.forEach(nodeIdx => {
      addTimeout(() => setActiveNodeIndex(nodeIdx), delay);
      delay += PLAYBACK_ON_MS;
      addTimeout(() => setActiveNodeIndex(null), delay);
      delay += PLAYBACK_GAP_MS;
    });

    // after playback → input (or complete if expired)
    addTimeout(() => {
      if (pendingComplete.current) { setGameState('complete'); return; }
      setGameState('input');
    }, delay + 300);
  }, [addTimeout, clearTimers]);

  // ── finish a round ───────────────────────────────────────────────────────
  const finishRound = useCallback((matched: boolean) => {
    if (matched) setRoundsMatched(m => m + 1);
    setGameState('matched');

    addTimeout(() => {
      if (pendingComplete.current || roundRef.current >= 2) {
        setGameState('complete');
      } else {
        setGameState('breathing');
      }
    }, MATCHED_HOLD_MS);
  }, [addTimeout]);

  // ── public API ───────────────────────────────────────────────────────────
  const startRound = useCallback(() => {
    runPlayback(roundRef.current);
  }, [runPlayback]);

  const handleNodeTap = useCallback((idx: number) => {
    if (gameState !== 'input') return;

    const seq = sequences.current[roundRef.current];
    const expected = seq[progressRef.current];

    if (idx === expected) {
      setUserFlashNode({ index: idx, correct: true });
      addTimeout(() => setUserFlashNode(null), 300);

      const nextProg = progressRef.current + 1;
      if (nextProg >= seq.length) {
        // sequence matched
        setInputProgress(0);
        finishRound(true);
      } else {
        setInputProgress(nextProg);
      }
    } else {
      setUserFlashNode({ index: idx, correct: false });
      addTimeout(() => setUserFlashNode(null), 300);

      if (!retriedRef.current) {
        // one retry — replay sequence
        setHasRetried(true);
        setInputProgress(0);
        addTimeout(() => {
          if (pendingComplete.current) { setGameState('complete'); return; }
          runPlayback(roundRef.current);
        }, 800);
      } else {
        // second failure — advance
        setInputProgress(0);
        finishRound(false);
      }
    }
  }, [gameState, addTimeout, finishRound, runPlayback]);

  const playAgain = useCallback(() => {
    clearTimers();
    pendingComplete.current = false;
    sequences.current = generateSequences(Date.now());
    setCurrentRound(0);
    setRoundsMatched(0);
    setHasRetried(false);
    setInputProgress(0);
    setActiveNodeIndex(null);
    setUserFlashNode(null);
    setGameState('ready');
  }, [clearTimers]);

  return {
    gameState,
    currentRound,
    sequences: sequences.current,
    activeNodeIndex,
    userFlashNode,
    inputProgress,
    hasRetried,
    roundsMatched,
    breathingSecondsLeft,
    startRound,
    handleNodeTap,
    playAgain,
  };
};
