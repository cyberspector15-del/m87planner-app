import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, MessageSquare, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "limit_reached" | "conversation_mode";
  currentUsage?: number;
  limit?: number;
}

const UpgradeModal = ({ isOpen, onClose, reason, currentUsage = 3, limit = 3 }: UpgradeModalProps) => {
  const isLimitReached = reason === "limit_reached";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cosmic-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/4 z-50 mx-auto max-w-md"
          >
            <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at top center, hsl(45 80% 55% / 0.1) 0%, transparent 60%)"
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                  >
                    <Crown className="w-8 h-8 text-amber-400" />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-display font-semibold text-center text-foreground mb-2">
                  {isLimitReached ? "Upgrade for deeper planning" : "Unlock conversational AI"}
                </h2>

                {/* Description */}
                <p className="text-center text-muted-foreground mb-6">
                  {isLimitReached ? (
                    <>
                      You've used <span className="text-cosmic-silver font-medium">{currentUsage} of {limit}</span> AI commands today.
                      <br />
                      M87 Pro unlocks 20 commands and interactive planning.
                    </>
                  ) : (
                    <>
                      Conversational AI lets you have a dialogue with M87 for smarter planning.
                      <br />
                      Available exclusively in M87 Pro.
                    </>
                  )}
                </p>

                {/* Features preview */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-cosmic-teal/10">
                      <Zap className="w-4 h-4 text-cosmic-teal" />
                    </div>
                    <span>20 AI commands per day</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-cosmic-teal/10">
                      <MessageSquare className="w-4 h-4 text-cosmic-teal" />
                    </div>
                    <span>Conversational planning mode</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-cosmic-teal/10">
                      <Sparkles className="w-4 h-4 text-cosmic-teal" />
                    </div>
                    <span>Smarter AI with context awareness</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="cosmic-primary"
                    className="w-full py-3 text-base font-medium"
                    onClick={() => {
                      // TODO: Navigate to upgrade flow
                      console.log("Navigate to Pro upgrade");
                      onClose();
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
