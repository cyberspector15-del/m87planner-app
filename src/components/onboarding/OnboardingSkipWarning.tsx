import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";

interface OnboardingSkipWarningProps {
  onConfirmSkip: () => void;
  onCancel: () => void;
}

const OnboardingSkipWarning = ({ onConfirmSkip, onCancel }: OnboardingSkipWarningProps) => {
  const { vibrate } = useHaptic();

  const handleSkip = () => {
    vibrate("light");
    onConfirmSkip();
  };

  const handleCancel = () => {
    vibrate("light");
    onCancel();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center px-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-cosmic-black/90 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 glass-strong rounded-2xl p-8 max-w-sm w-full text-center"
        style={{
          boxShadow: "0 0 40px 10px hsl(var(--cosmic-silver) / 0.05)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }}
          className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </motion.div>

        <h3 className="font-display text-xl font-semibold text-cosmic-white mb-2">
          Skip the tutorial?
        </h3>
        <p className="text-cosmic-silver/70 text-sm mb-6 leading-relaxed">
          Skipping means you won't see how M87 works. You can always restart it later in settings.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="cosmic-primary"
            onClick={handleCancel}
            className="w-full"
          >
            Continue tutorial
          </Button>
          <button
            onClick={handleSkip}
            className="text-sm text-cosmic-silver/50 hover:text-cosmic-silver/70 transition-colors py-2"
          >
            Skip anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingSkipWarning;
