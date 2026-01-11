import { useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "processing";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [50, 30, 100],
  processing: [15, 50, 15, 50, 15],
};

export const useHaptic = () => {
  const { settings } = useSettings();

  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    // Check if haptics are enabled in settings
    if (!settings.hapticEnabled) return;
    
    if (!("vibrate" in navigator)) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch (e) {
      // Vibration not supported or blocked
    }
  }, [settings.hapticEnabled]);

  return { vibrate, isEnabled: settings.hapticEnabled };
};
