import { motion } from "framer-motion";
import { ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ConversationModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

const ConversationModeToggle = ({ 
  enabled, 
  onToggle, 
  className 
}: ConversationModeToggleProps) => {
  const handleClick = () => {
    onToggle();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
        enabled
          ? "bg-cosmic-teal/15 border border-cosmic-teal/40 text-cosmic-teal"
          : "bg-muted/40 border border-border/30 text-muted-foreground hover:border-cosmic-silver/40",
        className
      )}
    >
      <ChatCircle size={14} weight="thin" />
      <span className="font-medium">Conversation Mode</span>
      
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
    </motion.button>
  );
};

export default ConversationModeToggle;
