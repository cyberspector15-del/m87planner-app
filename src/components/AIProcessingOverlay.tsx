import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIProcessingOverlayProps {
  isVisible: boolean;
  isComplete: boolean;
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

const statusMessages = [
  "Analyzing your tasks…",
  "Evaluating priorities and deadlines…",
  "Finding optimal time slots…",
  "Aligning your orbit…",
  "Optimizing your day…",
];

const completionMessages = [
  "Your day is ready.",
  "Your orbit is aligned.",
  "Schedule complete. Focus mode engaged.",
  "Today has been optimized.",
];

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
  const stars = useMemo(() => generateStars(60), []);

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
      {/* Shooting star effect - occasional */}
      <motion.div
        className="absolute h-px bg-gradient-to-r from-transparent via-cosmic-silver to-transparent"
        style={{ width: "80px" }}
        initial={{ x: "-100%", y: "20%", opacity: 0, rotate: 35 }}
        animate={
          isVisible
            ? {
                x: ["0%", "200%"],
                y: ["20%", "60%"],
                opacity: [0, 0.8, 0],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          delay: 3,
          repeat: Infinity,
          repeatDelay: 8,
          ease: "easeOut",
        }}
      />
    </div>
  );
};

const AIProcessingOverlay = ({
  isVisible,
  isComplete,
  onComplete,
}: AIProcessingOverlayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [completionMessage, setCompletionMessage] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible || isComplete) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1400);

    return () => clearInterval(interval);
  }, [isVisible, isComplete]);

  // Handle completion
  useEffect(() => {
    if (isComplete && isVisible) {
      const randomMessage =
        completionMessages[Math.floor(Math.random() * completionMessages.length)];
      setCompletionMessage(randomMessage);
      setShowCompletion(true);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, isVisible, onComplete]);

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
          {/* Backdrop with blur */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-cosmic-black/80"
          />

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cosmic-black via-cosmic-deep/90 to-cosmic-black" />

          {/* Star field */}
          <StarField isVisible={isVisible} />
          <div className="relative z-10 flex flex-col items-center justify-center px-6">
            {/* Orbital ring animation */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8">
              {/* Outer glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, hsl(var(--cosmic-silver) / 0.1) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Primary orbital ring */}
              <motion.div
                className="absolute inset-4 rounded-full border border-cosmic-silver/30"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {/* Orbiting dot 1 */}
                <motion.div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cosmic-silver shadow-[0_0_20px_hsl(var(--cosmic-silver))]"
                />
              </motion.div>

              {/* Secondary orbital ring */}
              <motion.div
                className="absolute inset-10 rounded-full border border-cosmic-teal/20"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {/* Orbiting dot 2 */}
                <motion.div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cosmic-teal/80 shadow-[0_0_15px_hsl(var(--cosmic-teal))]"
                />
              </motion.div>

              {/* Inner orbital ring */}
              <motion.div
                className="absolute inset-16 sm:inset-20 rounded-full border border-cosmic-silver/10"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Center core */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={
                  showCompletion
                    ? { scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }
                    : {}
                }
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-full",
                    "bg-gradient-to-br from-cosmic-deep via-cosmic-grey to-cosmic-deep",
                    "border border-cosmic-silver/20",
                    "shadow-[0_0_40px_hsl(var(--cosmic-silver)/0.2),inset_0_0_20px_hsl(var(--cosmic-black))]"
                  )}
                  animate={
                    showCompletion
                      ? {}
                      : {
                          boxShadow: [
                            "0 0 40px hsl(var(--cosmic-silver) / 0.2), inset 0 0 20px hsl(var(--cosmic-black))",
                            "0 0 60px hsl(var(--cosmic-silver) / 0.4), inset 0 0 20px hsl(var(--cosmic-black))",
                            "0 0 40px hsl(var(--cosmic-silver) / 0.2), inset 0 0 20px hsl(var(--cosmic-black))",
                          ],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Progress arc (only during loading) */}
              {!showCompletion && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="hsl(var(--cosmic-silver))"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.3 }}
                    animate={{ pathLength: 1, opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      pathLength: {
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                      opacity: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  />
                </svg>
              )}

              {/* Completion glow burst */}
              <AnimatePresence>
                {showCompletion && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: [0, 0.6, 0] }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-gradient-radial from-cosmic-silver/30 to-transparent"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Status text */}
            <div className="h-16 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {showCompletion ? (
                  <motion.div
                    key="completion"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <h2 className="font-display text-xl sm:text-2xl text-cosmic-silver tracking-wider mb-2">
                      {completionMessage}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We've planned the rest. You just execute.
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="font-display text-lg sm:text-xl text-cosmic-silver/90 tracking-wide text-center"
                  >
                    {statusMessages[currentMessageIndex]}
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

export default AIProcessingOverlay;
