import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCognitiveSprint } from '@/hooks/useCognitiveSprint';
import { PatternMatch } from './PatternMatch';
import { SequenceRecall } from './SequenceRecall';
import { OddOneOut } from './OddOneOut';

interface CognitiveSprintProps {
  breakExpired: boolean;
  onFinish: () => void;
}

const mono = "'Space Mono', monospace";
const inter = "'Inter', system-ui, sans-serif";
const orbitron = "'Orbitron', sans-serif";

export const CognitiveSprint = ({ breakExpired, onFinish }: CognitiveSprintProps) => {
  const seed = useRef(Date.now()).current;
  const {
    gameState,
    currentRoundIndex,
    currentRoundType,
    breathingSecondsLeft,
    startRound,
    completeRound,
  } = useCognitiveSprint(seed, breakExpired);

  // Auto-collapse after completion
  useEffect(() => {
    if (gameState === 'complete') {
      const timer = setTimeout(() => {
        onFinish();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, onFinish]);

  const renderRound = () => {
    switch (currentRoundType) {
      case 'pattern':
        return <PatternMatch seed={seed + currentRoundIndex} onComplete={(s) => completeRound(s)} />;
      case 'sequence':
        return <SequenceRecall seed={seed + currentRoundIndex} onComplete={(s) => completeRound(s)} />;
      case 'odd':
        return <OddOneOut seed={seed + currentRoundIndex} onComplete={(s) => completeRound(s)} />;
      default:
        return null;
    }
  };

  const getRoundTitle = () => {
    switch (currentRoundType) {
      case 'pattern': return 'PATTERN MATCH';
      case 'sequence': return 'SEQUENCE RECALL';
      case 'odd': return 'ODD ONE OUT';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 min-h-[300px] justify-center relative w-full">
      
      {/* Completion Pulse */}
      <AnimatePresence>
        {gameState === 'complete' && (
          <motion.div
            key="complete-pulse"
            initial={{ width: 0, height: 0, opacity: 0.2 }}
            animate={{ width: '200%', height: '200%', opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute rounded-full bg-[#45A199] pointer-events-none z-0"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        )}
      </AnimatePresence>

      {/* Header / Status */}
      <AnimatePresence mode="wait">
        {gameState === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <p className="font-mono text-[0.6875rem] text-[#999999] tracking-[0.2em] uppercase">
              ROUND {currentRoundIndex + 1} OF 3
            </p>
            <h3 className="font-display font-bold text-white text-lg tracking-wider">
              {getRoundTitle()}
            </h3>
            <button
              onClick={startRound}
              className="mt-6 px-10 py-3 rounded-xl glass-m87 font-display font-bold text-[0.6875rem] tracking-[0.18em] text-white uppercase hover:bg-white/10 transition-colors"
            >
              Start Challenge
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center"
          >
             <p className="font-mono text-[0.625rem] text-[#45A199] tracking-[0.2em] uppercase mb-8">
              {getRoundTitle()}
            </p>
            {renderRound()}
          </motion.div>
        )}

        {gameState === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center"
          >
             <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="font-sans text-sm text-[#999999] mb-2"
            >
              Breath...
            </motion.p>
            <p className="font-mono text-[0.625rem] text-[#999999] tracking-[0.15em] uppercase">
              Next challenge in {breathingSecondsLeft}
            </p>
          </motion.div>
        )}

        {gameState === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center"
          >
            <h2 className="font-mono text-white text-lg tracking-[0.2em] uppercase mb-2">
              SPRINT COMPLETE
            </h2>
            <p className="font-sans text-sm text-[#999999]">
              3 challenges finished
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
