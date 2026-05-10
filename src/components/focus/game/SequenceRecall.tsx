import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SequenceRecallProps {
  seed: number;
  onComplete: (score: number) => void;
}

// Seeded PRNG
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

export const SequenceRecall = ({ seed, onComplete }: SequenceRecallProps) => {
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [userInput, setUserInput] = useState<number[]>([]);
  const [resultIndices, setResultIndices] = useState<number[]>([]); // To track which were wrong

  const targetSequence = useMemo(() => {
    const rand = mulberry32(seed + 202);
    return Array.from({ length: 5 }, () => Math.floor(rand() * 10));
  }, [seed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('recall');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePadClick = (num: number) => {
    if (phase !== 'recall' || userInput.length >= 5) return;
    
    const nextInput = [...userInput, num];
    setUserInput(nextInput);

    if (nextInput.length === 5) {
      setPhase('result');
      let correctCount = 0;
      nextInput.forEach((val, idx) => {
        if (val === targetSequence[idx]) correctCount++;
      });
      
      setTimeout(() => {
        onComplete(correctCount);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Target / Slots Display */}
      <div className="flex gap-4 h-16 items-center">
        {phase === 'memorize' ? (
          targetSequence.map((num, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-display font-bold text-white"
            >
              {num}
            </motion.div>
          ))
        ) : (
          Array.from({ length: 5 }).map((_, i) => {
            const val = userInput[i];
            const isFilled = val !== undefined;
            const isCorrect = isFilled && val === targetSequence[i];
            const isWrong = isFilled && val !== targetSequence[i];
            
            return (
              <div
                key={i}
                className="w-12 h-16 flex items-center justify-center rounded-lg border border-white/10 bg-rgba(40,40,40,0.4) font-mono text-2xl"
                style={{
                  background: phase === 'result' 
                    ? (isCorrect ? 'rgba(69,161,153,0.3)' : (isWrong ? 'rgba(207,48,48,0.2)' : 'transparent'))
                    : 'transparent',
                  borderColor: phase === 'result' && isCorrect ? 'rgba(69,161,153,0.5)' : 'rgba(255,255,255,0.1)',
                  color: isFilled ? '#FFFFFF' : '#333333'
                }}
              >
                {isFilled ? val : '_'}
              </div>
            );
          })
        )}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-[300px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
          <motion.button
            key={num}
            whileTap={{ scale: 0.9 }}
            disabled={phase !== 'recall' || userInput.length >= 5}
            onClick={() => handlePadClick(num)}
            className="aspect-square flex items-center justify-center rounded-lg glass-m87 font-display text-white border-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
