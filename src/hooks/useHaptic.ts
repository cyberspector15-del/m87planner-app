import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "processing";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [50, 30, 100],
  processing: [15, 50, 15, 50, 15],
};

export const useHaptic = () => {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (!("vibrate" in navigator)) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch (e) {
      // Vibration not supported or blocked
    }
  }, []);

  return { vibrate };
};
