import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import OnboardingWelcome from "./OnboardingWelcome";
import OnboardingMentalModel from "./OnboardingMentalModel";
import OnboardingTutorial from "./OnboardingTutorial";
import OnboardingSkipWarning from "./OnboardingSkipWarning";
import AIProcessingOverlay from "@/components/AIProcessingOverlay";
import WinScreen from "@/components/WinScreen";
import { useNLPParse } from "@/hooks/useNLPParse";
import { useHaptic } from "@/hooks/useHaptic";

type OnboardingStep = "welcome" | "mental-model" | "tutorial" | "processing" | "win";

interface OnboardingFlowProps {
  isVisible: boolean;
  onComplete: () => void;
}

const OnboardingFlow = ({ isVisible, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const { parseCommand } = useNLPParse();
  const { vibrate } = useHaptic();

  const handleWelcomeNext = useCallback(() => {
    setStep("mental-model");
  }, []);

  const handleMentalModelNext = useCallback(() => {
    setStep("tutorial");
  }, []);

  const handleTutorialSubmit = useCallback(async (command: string) => {
    setStep("processing");
    
    // Actually process the command
    try {
      await parseCommand(command);
    } catch (e) {
      console.error("Onboarding command error:", e);
    }
  }, [parseCommand]);

  const handleProcessingComplete = useCallback(() => {
    setStep("win");
    vibrate("success");
  }, [vibrate]);

  const handleWinComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleSkipRequest = useCallback(() => {
    setShowSkipWarning(true);
  }, []);

  const handleSkipConfirm = useCallback(() => {
    setShowSkipWarning(false);
    onComplete();
  }, [onComplete]);

  const handleSkipCancel = useCallback(() => {
    setShowSkipWarning(false);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === "welcome" && (
          <OnboardingWelcome 
            key="welcome"
            onNext={handleWelcomeNext}
            onSkip={handleSkipRequest}
          />
        )}

        {/* Step 2: Mental Model */}
        {step === "mental-model" && (
          <OnboardingMentalModel 
            key="mental-model"
            onNext={handleMentalModelNext} 
          />
        )}

        {/* Step 3: Interactive Tutorial */}
        {step === "tutorial" && (
          <OnboardingTutorial 
            key="tutorial"
            onSubmit={handleTutorialSubmit} 
          />
        )}

        {/* Step 4a: AI Processing Overlay */}
        {step === "processing" && (
          <AIProcessingOverlay
            key="processing"
            isVisible={true}
            isComplete={true}
            onComplete={handleProcessingComplete}
          />
        )}

        {/* Step 4b: Win Screen */}
        {step === "win" && (
          <WinScreen
            key="win"
            isVisible={true}
            variant="planning"
            onComplete={handleWinComplete}
          />
        )}
      </AnimatePresence>

      {/* Skip Warning Modal */}
      <AnimatePresence>
        {showSkipWarning && (
          <OnboardingSkipWarning
            onConfirmSkip={handleSkipConfirm}
            onCancel={handleSkipCancel}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OnboardingFlow;
