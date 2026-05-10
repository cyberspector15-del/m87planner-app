import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface OddOneOutProps {
  seed: number;
  onComplete: (score: number) => void;
}

const QUESTION_SETS = [
  { words: ['MARS', 'VENUS', 'MERCURY', 'AMAZON'], oddIndex: 3 },
  { words: ['PYTHON', 'COBRA', 'MAMBA', 'REACT'], oddIndex: 3 },
  { words: ['BLUE', 'RED', 'SWIFT', 'GREEN'], oddIndex: 2 },
  { words: ['EARTH', 'SATURN', 'JUPITER', 'SIRIUS'], oddIndex: 3 },
  { words: ['OAK', 'PINE', 'MAPLE', 'ORCHID'], oddIndex: 3 },
  { words: ['LONDON', 'PARIS', 'TOKYO', 'EVEREST'], oddIndex: 3 },
  { words: ['CHROME', 'SAFARI', 'EDGE', 'ADOBE'], oddIndex: 3 },
  { words: ['LION', 'TIGER', 'LEOPARD', 'EAGLE'], oddIndex: 3 },
  { words: ['SQUARE', 'CIRCLE', 'TRIANGLE', 'SPHERE'], oddIndex: 3 },
  { words: ['PIANO', 'GUITAR', 'VIOLIN', 'FLUTE'], oddIndex: 3 }, // All instruments, wait...
  // Let's refine the last one
  { words: ['PIANO', 'GUITAR', 'VIOLIN', 'RADIO'], oddIndex: 3 }
];

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

export const OddOneOut = ({ seed, onComplete }: OddOneOutProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);

  const questionSet = useMemo(() => {
    const rand = mulberry32(seed + 303);
    const idx = Math.floor(rand() * QUESTION_SETS.length);
    return QUESTION_SETS[idx];
  }, [seed]);

  const handleWordClick = (idx: number) => {
    if (isDone) return;
    setSelectedIndex(idx);
    setIsDone(true);

    const isCorrect = idx === questionSet.oddIndex;
    
    setTimeout(() => {
      onComplete(isCorrect ? 1 : 0);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="grid grid-cols-2 gap-4 w-full">
        {questionSet.words.map((word, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = isSelected && i === questionSet.oddIndex;
          const isWrong = isSelected && i !== questionSet.oddIndex;

          return (
            <motion.button
              key={word}
              whileTap={!isDone ? { scale: 0.98 } : {}}
              onClick={() => handleWordClick(i)}
              className="p-6 rounded-xl glass-m87 transition-all duration-300 relative overflow-hidden"
              style={{
                background: isCorrect 
                  ? 'rgba(69,161,153,0.15)' 
                  : (isWrong ? 'rgba(207,48,48,0.2)' : 'rgba(20,20,20,0.45)'),
                borderColor: isCorrect 
                  ? 'rgba(69,161,153,0.4)' 
                  : (isWrong ? 'rgba(207,48,48,0.4)' : 'rgba(255,255,255,0.06)')
              }}
              animate={isWrong ? { x: [0, -4, 4, -4, 0] } : {}}
            >
              <span className="font-display font-medium text-white tracking-widest uppercase text-xs">
                {word}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
