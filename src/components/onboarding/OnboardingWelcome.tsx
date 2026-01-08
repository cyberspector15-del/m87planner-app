import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";

interface OnboardingWelcomeProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingWelcome = ({ onNext, onSkip }: OnboardingWelcomeProps) => {
  const { vibrate } = useHaptic();
  const { playTick } = useCosmicSounds();

  const handleBegin = () => {
    vibrate("medium");
    playTick();
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-cosmic-black" />
      
      {/* Subtle radial glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        style={{
          background: "radial-gradient(ellipse at center, hsl(var(--cosmic-deep) / 0.4) 0%, transparent 60%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Main text */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-cosmic-white tracking-wide mb-6"
        >
          Welcome, Explorer.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-lg md:text-xl text-cosmic-silver/80 mb-12 leading-relaxed"
        >
          M87 plans your day so you can focus on living it.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            variant="cosmic-primary"
            size="lg"
            onClick={handleBegin}
            className="px-10 py-6 text-lg font-display tracking-wide"
          >
            Begin
          </Button>
          <button
            onClick={onSkip}
            className="text-sm text-cosmic-silver/40 hover:text-cosmic-silver/60 transition-colors"
          >
            Skip tutorial
          </button>
        </motion.div>
      </div>

      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cosmic-silver/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              delay: 0.5 + Math.random() * 1,
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default OnboardingWelcome;
