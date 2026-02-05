import { motion } from "framer-motion";
import { MessageSquare, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationModeToggleProps {
  enabled: boolean;
  isPro: boolean;
  onToggle: () => void;
  onProClick: () => void;
  className?: string;
}

const ConversationModeToggle = ({ 
  enabled, 
  isPro, 
  onToggle, 
  onProClick,
  className 
}: ConversationModeToggleProps) => {
  const handleClick = () => {
    if (!isPro) {
      onProClick();
      return;
    }
    onToggle();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
        enabled && isPro
          ? "bg-cosmic-teal/15 border border-cosmic-teal/40 text-cosmic-teal"
          : isPro
            ? "bg-muted/40 border border-border/30 text-muted-foreground hover:border-cosmic-silver/40"
            : "bg-muted/30 border border-border/20 text-muted-foreground/70 cursor-pointer",
        className
      )}
    >
      <MessageSquare className="w-3.5 h-3.5" />
      <span className="font-medium">Conversation Mode</span>
      
      {!isPro && (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cosmic-gold/15 text-cosmic-gold text-[10px] font-semibold">
          <Crown className="w-2.5 h-2.5" />
          Pro
        </span>
      )}

      {isPro && (
        <motion.div
          className={cn(
            "w-8 h-4 rounded-full relative transition-colors",
            enabled ? "bg-cosmic-teal" : "bg-muted"
          )}
        >
          <motion.div
            className="absolute top-0.5 w-3 h-3 rounded-full bg-foreground shadow-sm"
            animate={{ left: enabled ? 16 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.div>
      )}
    </motion.button>
  );
};

export default ConversationModeToggle;
