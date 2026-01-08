import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "m87-onboarding-complete";

export const useOnboarding = () => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    }
    return false;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if not completed
    if (!isOnboardingComplete) {
      setShowOnboarding(true);
    }
  }, [isOnboardingComplete]);

  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const resetOnboarding = useCallback(() => {
    setIsOnboardingComplete(false);
    setShowOnboarding(true);
    localStorage.removeItem(ONBOARDING_KEY);
  }, []);

  const triggerOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return {
    isOnboardingComplete,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    triggerOnboarding,
  };
};
