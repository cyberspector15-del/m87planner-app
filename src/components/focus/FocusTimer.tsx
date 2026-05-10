interface FocusTimerProps {
  secondsLeft: number;
  phase: 'focus' | 'break';
  isDrift?: boolean;
}

// Format seconds as MM:SS
const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const FocusTimer = ({ secondsLeft, phase, isDrift }: FocusTimerProps) => {
  const isBreak = phase === 'break';

  return (
    <div
      style={{
        position: 'absolute',
        top: isBreak ? '28%' : '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        userSelect: 'none',
        animation: isBreak
          ? 'timerGlowBreak 6s ease-in-out infinite'
          : 'timerGlow 3s ease-in-out infinite',
        transition: 'top 0.6s ease-in-out',
        zIndex: 15,
      }}
    >
      <div
        className="glass-m87-light"
        style={{
          padding: '32px 48px',
          background: isBreak ? 'rgba(14,14,14,0.15)' : undefined,
          backdropFilter: isBreak ? 'blur(8px)' : undefined,
          WebkitBackdropFilter: isBreak ? 'blur(8px)' : undefined,
        }}
      >
        <style>{`
          @keyframes timerGlow {
            0%,  100% { filter: drop-shadow(0 0 60px rgba(69,161,153,0.08)); }
            50%        { filter: drop-shadow(0 0 60px rgba(69,161,153,0.18)); }
          }
          @keyframes timerGlowBreak {
            0%,  100% { filter: drop-shadow(0 0 60px rgba(69,161,153,0.02)); }
            50%        { filter: drop-shadow(0 0 60px rgba(69,161,153,0.06)); }
          }
        `}</style>

        {/* Main countdown */}
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: (isBreak || isDrift) ? 400 : 700,
            fontSize: 'clamp(4rem, 12vw, 9rem)',
            lineHeight: 1,
            color: '#FFFFFF',
            opacity: isDrift ? 0.5 : isBreak ? 0.7 : 1,
            letterSpacing: '0.04em',
            transition: 'font-weight 0.6s ease-in-out, opacity 0.6s ease-in-out',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {formatTime(secondsLeft)}
        </div>

        {/* Sublabel */}
        <div
          style={{
            marginTop: '1.25rem',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#999999',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'all 0.6s ease-in-out',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {isDrift ? 'DRIFT PHASE' : isBreak ? 'Rest Mode Active' : 'Deep Focus Active'}
        </div>
      </div>
    </div>
  );
};
