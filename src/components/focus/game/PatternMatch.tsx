import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatternMatchProps {
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

export const PatternMatch = ({ seed, onComplete }: PatternMatchProps) => {
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const targetIndices = useMemo(() => {
    const rand = mulberry32(seed + 101);
    const indices = Array.from({ length: 9 }, (_, i) => i);
    const result: number[] = [];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(rand() * indices.length);
      result.push(indices.splice(idx, 1)[0]);
    }
    return result;
  }, [seed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('recall');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSelection = (idx: number) => {
    if (phase !== 'recall' || isConfirming) return;
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    setPhase('result');
    
    let correctCount = 0;
    selectedIndices.forEach(idx => {
      if (targetIndices.includes(idx)) correctCount++;
    });

    // Score is 1 if perfectly matched, else fractional or 0? 
    // User said "Score: correct / 4 cells". I'll just pass the count or a percentage.
    // Let's pass the count.
    setTimeout(() => {
      onComplete(correctCount);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => {
          const isTarget = targetIndices.includes(i);
          const isSelected = selectedIndices.includes(i);
          const isCorrect = isTarget && isSelected;
          const isWrong = !isTarget && isSelected;
          const isMissed = isTarget && !isSelected && phase === 'result';

          let cellBg = 'rgba(40,40,40,0.7)';
          let cellShadow = 'none';
          let border = '1px solid rgba(255,255,255,0.1)';

          if (phase === 'memorize' && isTarget) {
            cellBg = 'rgba(255,255,255,0.9)';
            cellShadow = '0 0 16px rgba(255,255,255,0.3)';
          } else if (phase === 'recall' && isSelected) {
            cellBg = 'rgba(69,161,153,0.8)';
            cellShadow = '0 0 14px rgba(69,161,153,0.3)';
          } else if (phase === 'result') {
            if (isCorrect) {
              cellBg = 'rgba(69,161,153,0.9)';
              cellShadow = '0 0 20px rgba(69,161,153,0.4)';
            } else if (isWrong) {
              cellBg = 'rgba(207,48,48,0.3)';
            } else if (isMissed) {
              cellBg = 'rgba(255,255,255,0.4)';
              border = '1px dashed rgba(255,255,255,0.4)';
            }
          }

          return (
            <motion.button
              key={i}
              whileTap={phase === 'recall' && !isConfirming ? { scale: 0.95 } : {}}
              onClick={() => toggleSelection(i)}
              className="w-16 h-16 rounded-lg backdrop-blur-sm transition-all duration-300"
              style={{
                background: cellBg,
                boxShadow: cellShadow,
                border,
                cursor: phase === 'recall' && !isConfirming ? 'pointer' : 'default'
              }}
              animate={isWrong && phase === 'result' ? { x: [0, -5, 5, -5, 0], opacity: [1, 0.5, 1] } : {}}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {phase === 'recall' && selectedIndices.length > 0 && !isConfirming && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleConfirm}
            className="px-8 py-3 rounded-xl glass-m87 font-display font-bold text-xs tracking-widest text-white uppercase hover:bg-white/10 transition-colors"
          >
            Confirm
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
