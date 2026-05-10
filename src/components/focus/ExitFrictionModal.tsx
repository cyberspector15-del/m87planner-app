import { motion } from 'framer-motion';

interface ExitFrictionModalProps {
  focusMinutesCompleted: number;
  onStay: () => void;
  onEnd: () => void;
}

export const ExitFrictionModal = ({
  focusMinutesCompleted,
  onStay,
  onEnd,
}: ExitFrictionModalProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass-m87-heavy"
        style={{
          width: '100%',
          maxWidth: '24rem',
          borderRadius: '12px',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: '1.125rem',
            color: '#FFFFFF',
            margin: '0 0 16px',
            letterSpacing: '0.05em',
            position: 'relative',
            zIndex: 10,
          }}
        >
          END SESSION EARLY?
        </h2>

        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.875rem',
            color: '#999999',
            lineHeight: 1.5,
            margin: '0 0 24px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          Your focus session is still active. Leaving now will mark this session as incomplete.
        </p>

        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.625rem',
            color: '#999999',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          FOCUS TIME: {focusMinutesCompleted}m · STREAK AT RISK
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 10 }}>
          <button
            onClick={onStay}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.9)',
              color: '#000000',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = '#FFFFFF';
              (e.target as HTMLElement).style.boxShadow = '0 0 24px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            STAY IN ORBIT
          </button>

          <button
            onClick={onEnd}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(30,30,30,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)',
              color: '#999999',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 400,
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = '#FFFFFF';
              (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.18)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = '#999999';
              (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)';
            }}
          >
            END SESSION
          </button>
        </div>
      </motion.div>
    </div>
  );
};
