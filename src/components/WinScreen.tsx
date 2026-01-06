import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";

export type WinScreenVariant = "planning" | "weekly" | "routine" | "rescheduling" | "goals";

interface WinScreenProps {
  isVisible: boolean;
  variant?: WinScreenVariant;
  onComplete?: () => void;
}

interface VariantConfig {
  primary: string[];
  subtext: string[];
}

const variantMessages: Record<WinScreenVariant, VariantConfig> = {
  planning: {
    primary: ["Your day is ready."],
    subtext: [
      "Focus. We've got the rest.",
      "Everything is aligned.",
      "Your priorities are in orbit.",
      "You're clear to focus.",
    ],
  },
  weekly: {
    primary: ["Your week is set."],
    subtext: [
      "Seven days, perfectly aligned.",
      "Your orbit is mapped.",
      "Focus on what matters.",
    ],
  },
  routine: {
    primary: ["Routine activated."],
    subtext: [
      "Consistency builds momentum.",
      "Your rhythm is set.",
      "Small steps, big impact.",
    ],
  },
  rescheduling: {
    primary: ["Schedule adjusted."],
    subtext: [
      "Flexibility is strength.",
      "Your timeline adapts.",
      "Balance restored.",
    ],
  },
  goals: {
    primary: ["Goals are in motion."],
    subtext: [
      "The path is clear.",
      "One step at a time.",
      "Your vision is mapped.",
    ],
  },
};

// Timing constants (in ms)
const FADE_IN_DURATION = 280;
const HOLD_DURATION = 1000;
const FADE_OUT_DURATION = 300;

const WinScreen = ({
  isVisible,
  variant = "planning",
  onComplete,
}: WinScreenProps) => {
  const [primaryMessage, setPrimaryMessage] = useState("");
  const [subMessage, setSubMessage] = useState("");
  const [hasTriggeredFeedback, setHasTriggeredFeedback] = useState(false);

  const { vibrate } = useHaptic();
  const { playComplete, isMuted } = useCosmicSounds();

  // Generate a soft whoosh/chime sound
  const playWinSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Soft low-frequency whoosh
      const whoosh = audioContext.createOscillator();
      const whooshGain = audioContext.createGain();
      const whooshFilter = audioContext.createBiquadFilter();
      
      whoosh.type = "sine";
      whoosh.frequency.setValueAtTime(180, audioContext.currentTime);
      whoosh.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.6);
      
      whooshFilter.type = "lowpass";
      whooshFilter.frequency.setValueAtTime(400, audioContext.currentTime);
      
      whooshGain.gain.setValueAtTime(0, audioContext.currentTime);
      whooshGain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.1);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7);
      
      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(audioContext.destination);
      
      whoosh.start(audioContext.currentTime);
      whoosh.stop(audioContext.currentTime + 0.8);
      
      // Soft chime accent
      setTimeout(() => {
        const chime = audioContext.createOscillator();
        const chimeGain = audioContext.createGain();
        
        chime.type = "sine";
        chime.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        
        chimeGain.gain.setValueAtTime(0, audioContext.currentTime);
        chimeGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.05);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        chime.connect(chimeGain);
        chimeGain.connect(audioContext.destination);
        
        chime.start(audioContext.currentTime);
        chime.stop(audioContext.currentTime + 0.6);
      }, 150);
    } catch (e) {
      // Silently fail if audio context is unavailable
    }
  }, [isMuted]);

  // Select random messages when visible
  useEffect(() => {
    if (isVisible) {
      const config = variantMessages[variant];
      const randomPrimary = config.primary[Math.floor(Math.random() * config.primary.length)];
      const randomSub = config.subtext[Math.floor(Math.random() * config.subtext.length)];
      setPrimaryMessage(randomPrimary);
      setSubMessage(randomSub);
    }
  }, [isVisible, variant]);

  // Trigger haptic and sound once
  useEffect(() => {
    if (isVisible && !hasTriggeredFeedback) {
      setHasTriggeredFeedback(true);
      vibrate("light");
      playWinSound();
    }
    if (!isVisible) {
      setHasTriggeredFeedback(false);
    }
  }, [isVisible, hasTriggeredFeedback, vibrate, playWinSound]);

  // Auto-dismiss after hold duration
  useEffect(() => {
    if (!isVisible) return;

    const totalDuration = FADE_IN_DURATION + HOLD_DURATION + FADE_OUT_DURATION;
    const timer = setTimeout(() => {
      onComplete?.();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: FADE_IN_DURATION / 1000, 
            ease: [0.4, 0, 0.2, 1],
            exit: { duration: FADE_OUT_DURATION / 1000 }
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(16px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-cosmic-black/85"
          />

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cosmic-black via-cosmic-deep/95 to-cosmic-black" />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
            {/* Subtle glowing ring - expands outward */}
            <motion.div
              className="absolute"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.8, 2.5],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
                times: [0, 0.5, 1]
              }}
            >
              <div 
                className="w-64 h-64 sm:w-80 sm:h-80 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(var(--cosmic-silver) / 0.15) 0%, transparent 70%)",
                  boxShadow: "0 0 60px 20px hsl(var(--cosmic-silver) / 0.08)"
                }}
              />
            </motion.div>

            {/* Secondary subtle pulse behind text */}
            <motion.div
              className="absolute"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div 
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(var(--cosmic-silver) / 0.1) 0%, transparent 60%)"
                }}
              />
            </motion.div>

            {/* Primary message */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                delay: 0.1,
                duration: 0.5, 
                ease: [0.4, 0, 0.2, 1] 
              }}
              className={cn(
                "font-display text-3xl sm:text-4xl md:text-5xl font-bold",
                "text-cosmic-white tracking-wide",
                "mb-4"
              )}
            >
              {primaryMessage}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ 
                delay: 0.25,
                duration: 0.4, 
                ease: [0.4, 0, 0.2, 1] 
              }}
              className={cn(
                "text-base sm:text-lg",
                "text-cosmic-silver/70",
                "tracking-wider"
              )}
            >
              {subMessage}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinScreen;
