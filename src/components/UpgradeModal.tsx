import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, MessageSquare, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: "limit-reached" | "conversation-mode";
}

const UpgradeModal = ({ isOpen, onClose, variant }: UpgradeModalProps) => {
  const { vibrate } = useHaptic();

  const handleClose = () => {
    vibrate("light");
    onClose();
  };

  const handleUpgrade = () => {
    vibrate("medium");
    // In future: Open Stripe checkout or subscription page
    // For now, just close the modal
    onClose();
  };

  const content = variant === "limit-reached" 
    ? {
        icon: <Zap className="w-8 h-8 text-cosmic-gold" />,
        title: "Upgrade for deeper planning",
        description: "Free users get 3 AI commands per day. M87 Pro unlocks 20 commands and interactive planning.",
        features: [
          "20 AI commands per day",
          "Conversational AI mode",
          "Priority support",
        ],
      }
    : {
        icon: <MessageSquare className="w-8 h-8 text-cosmic-teal" />,
        title: "Unlock Conversational AI",
        description: "Conversational planning is available in M87 Pro. Let the AI ask clarifying questions to build your perfect schedule.",
        features: [
          "Multi-turn conversations",
          "AI asks clarifying questions",
          "Context-aware planning",
        ],
      };

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
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div 
              className="glass-strong rounded-2xl p-6 overflow-hidden relative"
              style={{
                boxShadow: "0 0 60px 10px hsl(var(--cosmic-gold) / 0.1), 0 0 100px 30px hsl(var(--cosmic-teal) / 0.05)"
              }}
            >
              {/* Ambient glow */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center top, hsl(45 80% 55% / 0.1) 0%, transparent 60%)"
                }}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-cosmic-gold/20 to-cosmic-teal/10 border border-cosmic-silver/20"
                  >
                    {content.icon}
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-display font-semibold text-center text-foreground mb-2">
                  {content.title}
                </h2>

                {/* Description */}
                <p className="text-center text-muted-foreground text-sm mb-6">
                  {content.description}
                </p>

                {/* Features list */}
                <div className="space-y-3 mb-6">
                  {content.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cosmic-teal/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-cosmic-teal" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-cosmic-gold to-cosmic-gold/80 text-cosmic-black font-semibold hover:from-cosmic-gold/90 hover:to-cosmic-gold/70"
                    size="lg"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Not now
                  </Button>
                </div>

                {/* Pro badge */}
                <div className="flex justify-center mt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cosmic-gold/10 border border-cosmic-gold/20 text-xs text-cosmic-gold">
                    <Crown className="w-3 h-3" />
                    M87 Pro
                  </div>
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
