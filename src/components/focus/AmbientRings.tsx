import { motion } from 'framer-motion';

interface AmbientRingsProps {
  ringCount?: number;
}

// Continuous expanding ring animation originating from the center
// Used during the Rest Mode phase
export const AmbientRings = ({ ringCount = 1 }: AmbientRingsProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ width: '0vw', height: '0vw', opacity: 0.04 }}
          animate={{ width: '80vw', height: '80vw', opacity: 0 }}
          transition={{
            duration: 8,
            ease: 'linear',
            repeat: Infinity,
            delay: i * 2.5,
          }}
          style={{
            border: '1px solid #FFFFFF',
            borderRadius: '50%',
            position: 'absolute',
          }}
        />
      ))}
    </div>
  );
};
