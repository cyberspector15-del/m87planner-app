import { useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";

const MILESTONES = [7, 14, 30, 60, 90, 100, 365];
const STORAGE_KEY = "m87-last-celebrated-streak";

export const useStreakConfetti = (currentStreak: number | undefined) => {
  const hasTriggeredRef = useRef(false);

  const fireConfetti = useCallback(() => {
    // Cosmic gold/amber confetti burst
    const colors = ["#fbbf24", "#f59e0b", "#d97706", "#ffffff", "#c0c0c0"];
    
    // First burst - center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
    });

    // Second burst - left side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        zIndex: 9999,
      });
    }, 150);

    // Third burst - right side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        zIndex: 9999,
      });
    }, 300);

    // Star shower for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.3 },
        colors,
        shapes: ["circle"],
        scalar: 1.2,
        zIndex: 9999,
      });
    }, 450);
  }, []);

  const checkAndCelebrate = useCallback(() => {
    if (!currentStreak || currentStreak === 0) return false;

    const lastCelebrated = localStorage.getItem(STORAGE_KEY);
    const lastCelebratedStreak = lastCelebrated ? parseInt(lastCelebrated, 10) : 0;

    // Find if current streak is at a milestone and hasn't been celebrated
    const isMilestone = MILESTONES.includes(currentStreak);
    const shouldCelebrate = isMilestone && currentStreak > lastCelebratedStreak;

    if (shouldCelebrate && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      localStorage.setItem(STORAGE_KEY, currentStreak.toString());
      fireConfetti();
      return true;
    }

    return false;
  }, [currentStreak, fireConfetti]);

  // Auto-check on streak change
  useEffect(() => {
    if (currentStreak !== undefined) {
      hasTriggeredRef.current = false;
      checkAndCelebrate();
    }
  }, [currentStreak, checkAndCelebrate]);

  return {
    fireConfetti,
    checkAndCelebrate,
    isMilestone: currentStreak ? MILESTONES.includes(currentStreak) : false,
    currentMilestone: currentStreak && MILESTONES.includes(currentStreak) ? currentStreak : null,
    nextMilestone: currentStreak ? MILESTONES.find(m => m > currentStreak) : MILESTONES[0],
  };
};
