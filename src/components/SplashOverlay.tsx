import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import { useCosmicSounds } from "@/hooks/useCosmicSounds";

interface SplashOverlayProps {
  isVisible: boolean;
  variant?: "loading" | "signin" | "signup";
  onComplete?: () => void;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

const loadingMessages = [
  "Initializing cosmic systems…",
  "Calibrating your orbit…",
  "Preparing your universe…",
];

const signinMessages = [
  "Welcome back, explorer…",
  "Restoring your orbit…",
  "Aligning your trajectory…",
];

const signupMessages = [
  "Creating your universe…",
  "Mapping your cosmic journey…",
  "Initiating your orbit…",
];

const completionMessages: Record<string, string[]> = {
  loading: ["Systems online.", "Ready to navigate."],
  signin: ["Welcome back.", "Your orbit awaits."],
  signup: ["Welcome to M87.", "Your journey begins."],
};

// Generate star field
const generateStars = (count: number): Star[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));
};

const StarField = ({ isVisible }: { isVisible: boolean }) => {
  const stars = useMemo(() => generateStars(50), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-cosmic-silver"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            isVisible
              ? {
                  opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
                  scale: [0.8, 1, 0.8],
                }
              : { opacity: 0, scale: 0 }
          }
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const SplashOverlay = ({
  isVisible,
  variant = "loading",
  onComplete,
}: SplashOverlayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const hasPlayedInitiate = useRef(false);

  const { vibrate } = useHaptic();
  const { playInitiate, playTick, playComplete } = useCosmicSounds();

  const messages =
    variant === "signin"
      ? signinMessages
      : variant === "signup"
      ? signupMessages
      : loadingMessages;

  // Play initiate sound and haptic when overlay appears
  useEffect(() => {
    if (isVisible && !hasPlayedInitiate.current) {
      hasPlayedInitiate.current = true;
      playInitiate();
      vibrate("processing");
    }
    if (!isVisible) {
      hasPlayedInitiate.current = false;
    }
  }, [isVisible, playInitiate, vibrate]);

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        playTick();
        vibrate("light");
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isVisible, messages.length, playTick, vibrate]);

  // Show completion after messages cycle
  useEffect(() => {
    if (!isVisible) return;

    const totalDuration = messages.length * 1200 + 500;
    const timer = setTimeout(() => {
      const randomMessage =
        completionMessages[variant][
          Math.floor(Math.random() * completionMessages[variant].length)
        ];
      setCompletionMessage(randomMessage);
      setShowCompletion(true);
      playComplete();
      vibrate("success");
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [isVisible, messages.length, variant, playComplete, vibrate]);

  // Call onComplete after showing completion
  useEffect(() => {
    if (showCompletion) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showCompletion, onComplete]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      setShowCompletion(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-cosmic-black/90"
          />

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cosmic-black via-cosmic-deep/90 to-cosmic-black" />

          {/* Star field */}
          <StarField isVisible={isVisible} />

          <div className="relative z-10 flex flex-col items-center justify-center px-6">
            {/* Logo and orbital animation */}
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 mb-8">
              {/* Outer glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, hsl(var(--cosmic-silver) / 0.15) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Orbital ring */}
              <motion.div
                className="absolute inset-4 rounded-full border border-cosmic-silver/25"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cosmic-silver shadow-[0_0_20px_hsl(var(--cosmic-silver))]" />
              </motion.div>

              {/* Secondary ring */}
              <motion.div
                className="absolute inset-8 rounded-full border border-cosmic-silver/10"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Center logo */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={
                  showCompletion
                    ? { scale: [1, 1.2, 1], opacity: [1, 0.9, 1] }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-full",
                    "bg-gradient-to-br from-cosmic-deep via-cosmic-grey to-cosmic-deep",
                    "border border-cosmic-silver/30",
                    "flex items-center justify-center",
                    "shadow-[0_0_50px_hsl(var(--cosmic-silver)/0.25),inset_0_0_25px_hsl(var(--cosmic-black))]"
                  )}
                  animate={
                    showCompletion
                      ? {}
                      : {
                          boxShadow: [
                            "0 0 50px hsl(var(--cosmic-silver) / 0.25), inset 0 0 25px hsl(var(--cosmic-black))",
                            "0 0 70px hsl(var(--cosmic-silver) / 0.45), inset 0 0 25px hsl(var(--cosmic-black))",
                            "0 0 50px hsl(var(--cosmic-silver) / 0.25), inset 0 0 25px hsl(var(--cosmic-black))",
                          ],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                </motion.div>
              </motion.div>

              {/* Completion glow burst */}
              <AnimatePresence>
                {showCompletion && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.6, opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-gradient-radial from-cosmic-silver/30 to-transparent"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center mb-6"
            >
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-widest text-glow">
                M87 PLANNER
              </h1>
            </motion.div>

            {/* Status text */}
            <div className="h-12 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {showCompletion ? (
                  <motion.p
                    key="completion"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="font-display text-lg sm:text-xl text-cosmic-silver tracking-wide text-center"
                  >
                    {completionMessage}
                  </motion.p>
                ) : (
                  <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="text-base sm:text-lg text-cosmic-silver/80 tracking-wide text-center"
                  >
                    {messages[currentMessageIndex]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashOverlay;
