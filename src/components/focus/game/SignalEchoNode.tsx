import { motion } from 'framer-motion';

interface SignalEchoNodeProps {
  isPlaybackActive: boolean;
  isUserCorrect: boolean;
  isUserWrong: boolean;
  isInteractive: boolean;
  onClick: () => void;
  index: number;
}

export const SignalEchoNode = ({
  isPlaybackActive,
  isUserCorrect,
  isUserWrong,
  isInteractive,
  onClick,
  index,
}: SignalEchoNodeProps) => {
  const bg = isPlaybackActive
    ? 'rgba(255,255,255,0.95)'
    : isUserCorrect
    ? 'rgba(69,161,153,0.8)'
    : 'rgba(40,40,40,0.7)';

  const shadow = isPlaybackActive
    ? '0 0 24px rgba(255,255,255,0.5), inset 0 0 8px rgba(255,255,255,0.2)'
    : isUserCorrect
    ? '0 0 20px rgba(69,161,153,0.4), inset 0 0 6px rgba(69,161,153,0.2)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.1)';

  const scale = isPlaybackActive ? 1.1 : isUserCorrect ? 1.05 : 1;

  return (
    <motion.button
      key={index}
      animate={{
        backgroundColor: bg,
        boxShadow: shadow,
        scale,
        opacity: isUserWrong ? [1, 0, 0, 1] : 1,
      }}
      transition={
        isUserWrong
          ? { duration: 0.4, times: [0, 0.2, 0.7, 1], ease: 'easeInOut' }
          : { duration: isPlaybackActive ? 0.3 : 0.15, ease: 'easeOut' }
      }
      onClick={isInteractive ? onClick : undefined}
      aria-label={`Node ${index + 1}`}
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        border: 'none',
        cursor: isInteractive ? 'pointer' : 'default',
        background: 'rgba(40,40,40,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: 0,
      }}
    />
  );
};

