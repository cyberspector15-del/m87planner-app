import { useState, useEffect } from 'react';

export const useSwapWindow = (timeUntilBreakMs?: number) => {
  const [swapAllowed, setSwapAllowed] = useState(true);
  const [swapUsed, setSwapUsed] = useState(false);

  useEffect(() => {
    // If timeUntilBreakMs is provided, check if we're within the 2 minute window
    if (timeUntilBreakMs !== undefined && timeUntilBreakMs <= 120000) {
      setSwapAllowed(false);
    }
  }, [timeUntilBreakMs]);

  const useSwap = () => {
    if (swapAllowed && !swapUsed) {
      setSwapUsed(true);
      return true; // indicates success
    }
    return false; // failed to swap
  };

  return { swapAllowed, swapUsed, useSwap };
};
