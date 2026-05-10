import { motion } from 'framer-motion';

export const DriftState = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '60px',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 7,
          times: [0, 2 / 7, 4 / 7, 1], // 0s -> 2s (fade in), hold 2s (until 4s), 4s -> 7s (fade out)
          ease: 'easeInOut',
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.625rem',
            color: '#999999',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          DRIFT PHASE
        </p>

        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.875rem',
            color: 'rgba(153, 153, 153, 0.6)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Close your eyes · Breathe · Return when ready
        </p>
      </motion.div>
    </div>
  );
};
