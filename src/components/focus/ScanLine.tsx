import { motion } from 'framer-motion';

// Single full-viewport scan line sweeping top → bottom, 8s cycle, barely visible
export const ScanLine = () => (
  <motion.div
    aria-hidden="true"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'rgba(255,255,255,0.04)',
      pointerEvents: 'none',
      zIndex: 10,
    }}
    animate={{ top: ['0%', '100%'] }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);
