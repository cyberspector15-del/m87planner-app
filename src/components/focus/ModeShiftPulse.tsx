import { motion } from 'framer-motion';

// Single radial pulse that fires once on transition to Rest Mode
export const ModeShiftPulse = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ width: '0vw', height: '0vw', opacity: 0.12 }}
        animate={{ width: '60vw', height: '60vw', opacity: 0 }}
        transition={{
          duration: 0.8,
          ease: 'easeOut',
        }}
        style={{
          background: 'rgba(69,161,153,0.12)', // teal mode-shift signal
          borderRadius: '50%',
          position: 'absolute',
        }}
      />
    </div>
  );
};
