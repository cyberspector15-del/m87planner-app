import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AirModeControlsProps {
  isReady: boolean;
  airModeActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function AirModeControls({
  isReady,
  airModeActive,
  onStart,
  onStop,
}: AirModeControlsProps) {
  // Hide the floating Air Mode UI (incl. "TAP ME") on mobile shell routes.
  // NOTE: This component is rendered outside the router, so don't use react-router hooks here.
  if (
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/m') ||
      window.location.pathname === '/' ||
      window.location.pathname.startsWith('/auth'))
  ) {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isSquishing, setIsSquishing] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Keep the UI expanded if air mode is active (e.g. if loaded in active state)
  useEffect(() => {
    if (airModeActive && !expanded) {
      setExpanded(true);
    }
  }, [airModeActive]);

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Generate Ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 500);

    // Trigger Squish Sequence
    setIsSquishing(true);
    setTimeout(() => {
      setIsSquishing(false);
      setExpanded(true);
    }, 350);
  };

  const handleStop = () => {
    onStop();
    setIsReturning(true);
    setExpanded(false);
  };

  const idleVariants = {
    initial: (isReturning: boolean) => ({
      opacity: isReturning ? 0 : 1,
      scaleX: 1,
      scaleY: 1,
    }),
    animate: (isReturning: boolean) => ({
      opacity: 1,
      scaleX: isReturning ? [1, 1.08, 0.85, 1] : 1,
      scaleY: isReturning ? [1, 0.92, 1.1, 1] : 1,
      transition: isReturning
        ? { duration: 0.35, ease: "easeInOut", times: [0, 0.3, 0.7, 1] }
        : { duration: 0.2 }
    }),
    squish: {
      scaleX: [1, 0.85, 1.08, 1],
      scaleY: [1, 1.1, 0.92, 1],
      transition: { duration: 0.35, ease: "easeInOut", times: [0, 0.3, 0.7, 1] }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Inject strictly isolated keyframes for the idle state */}
      <style>{`
        @keyframes air-idle-breathe {
          0%, 100% { border-color: rgba(255, 255, 255, 0.18); }
          50% { border-color: rgba(255, 255, 255, 0.35); }
        }
        .air-idle-btn {
          animation: air-idle-breathe 2.5s ease-in-out infinite;
        }
        .air-idle-btn:hover {
          animation: none;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[99999] flex items-center justify-end">
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="idle-wrapper"
              initial={{ y: 0 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              <motion.button
                custom={isReturning}
                variants={idleVariants}
                initial="initial"
                animate={isSquishing ? "squish" : "animate"}
                exit="exit"
                onClick={handleTap}
                onAnimationComplete={() => {
                  if (isReturning) setIsReturning(false);
                }}
                className="air-idle-btn relative flex items-center justify-center overflow-hidden focus:outline-none"
                style={{
                  width: "140px",
                  height: "44px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                }}
                whileHover={{
                  background: "rgba(255,255,255,0.13)",
                  borderColor: "rgba(255,255,255,0.30)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(69,161,153,0.15)",
                  transition: { duration: 0.25, ease: "easeOut" }
                }}
              >
                {/* Shimmer layer */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 40%, rgba(69,161,153,0.08) 100%)",
                  pointerEvents: "none"
                }} />

                <span className="sim-font-mono text-[11px] text-white tracking-[0.18em] font-bold uppercase relative z-10 select-none">
                  TAP ME
                </span>

                <AnimatePresence>
                  {ripples.map(r => (
                    <motion.div
                      key={r.id}
                      initial={{ scale: 0, opacity: 0.3 }}
                      animate={{ scale: 4, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        left: r.x - 50,
                        top: r.y - 50,
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                        zIndex: 5
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="expanded-wrapper" className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: 6, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 6, x: 10, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={onStart}
                className="relative flex items-center justify-center overflow-hidden focus:outline-none"
                style={{
                  width: "130px",
                  height: "44px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.10)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.20)",
                }}
                whileHover={{
                  borderColor: "rgba(69, 161, 153, 0.5)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(69,161,153,0.2)",
                  transition: { duration: 0.2 }
                }}
              >
                {/* Shimmer layer */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 40%, rgba(69,161,153,0.08) 100%)",
                  pointerEvents: "none"
                }} />

                {/* Active indicator dot if air mode is active */}
                {airModeActive && (
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full absolute left-4 z-10"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9], boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 8px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0)"] }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                  />
                )}

                <span className="sim-font-mono text-[11px] text-white tracking-[0.15em] font-bold uppercase relative z-10 select-none">
                  {isReady ? "AIR MODE" : "AIR MODE"}
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 6, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 6, x: -10, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
                onClick={handleStop}
                className="relative flex items-center justify-center overflow-hidden focus:outline-none"
                style={{
                  width: "80px",
                  height: "44px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
                whileHover={{
                  borderColor: "rgba(207, 48, 48, 0.4)",
                  color: "#CF3030",
                  boxShadow: "0 0 16px rgba(207,48,48,0.15)",
                  transition: { duration: 0.2 }
                }}
              >
                <span
                  className="sim-font-mono text-[11px] tracking-[0.15em] font-bold relative z-10 select-none"
                  style={{ color: "inherit" }} // Relies on the whileHover color update or defaults to rgba below
                >
                  <span className="text-[rgba(255,255,255,0.7)] hover:text-[#CF3030] transition-colors duration-200">STOP</span>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
