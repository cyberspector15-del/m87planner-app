import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FocusSession } from '@/types/focusMode';

interface SessionCompleteProps {
  session: FocusSession | null;
}

export const SessionComplete = ({ session }: SessionCompleteProps) => {
  const navigate = useNavigate();

  const handleReturn = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="glass-m87 p-12 rounded-[16px] max-w-md w-full z-10">
        <h1 
          className="font-mono text-[#FFFFFF] tracking-[0.2em] uppercase text-xl mb-6 relative z-10"
        >
          Session Complete
        </h1>
        
        {session && (
          <div className="font-mono text-[#999999] text-xs tracking-widest uppercase mb-4 relative z-10">
            FOCUS TIME: {session.focusDuration}m · BREAK: {session.breakTier}
          </div>
        )}

        <p className="font-sans text-[#999999] opacity-80 mb-12 relative z-10">
          Session logged.
        </p>

        <button
          onClick={handleReturn}
          className="h-14 px-8 rounded-[12px] font-display font-bold uppercase tracking-widest text-[#FFFFFF] transition-all duration-300 flex items-center justify-center border-none glass-m87 hover:-translate-y-[1px] mx-auto relative z-10"
          style={{
            background: 'rgba(69,161,153,0.15)',
            boxShadow: 'inset 0 0 0 1px rgba(69,161,153,0.4), 0 0 20px rgba(69,161,153,0.1)',
          }}
        >
          Return to Dashboard
        </button>
      </div>

      {/* Single teal pulse on completion */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          initial={{ width: 0, height: 0, opacity: 0.2 }}
          animate={{ width: '100vw', height: '100vw', opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="rounded-full bg-[#45A199] mix-blend-screen"
        />
      </div>
    </motion.div>
  );
};
