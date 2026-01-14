import { motion } from "framer-motion";
import { MessageSquare, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConversationModeToggleProps {
  enabled: boolean;
  isPro: boolean;
  onToggle: (enabled: boolean) => void;
  onProClick?: () => void;
  compact?: boolean;
}

const ConversationModeToggle = ({
  enabled,
  isPro,
  onToggle,
  onProClick,
  compact = false,
}: ConversationModeToggleProps) => {
  const { vibrate } = useHaptic();

  const handleClick = () => {
    if (!isPro) {
      vibrate("light");
      onProClick?.();
      return;
    }
    
    vibrate("medium");
    onToggle(!enabled);
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
                isPro
                  ? enabled
                    ? "bg-cosmic-teal/20 text-cosmic-teal border border-cosmic-teal/30"
                    : "bg-muted/40 text-muted-foreground border border-border/50 hover:border-cosmic-silver/30"
                  : "bg-cosmic-gold/10 text-cosmic-gold/80 border border-cosmic-gold/20 cursor-pointer"
              )}
            >
              {isPro ? (
                <>
                  <MessageSquare className="w-3 h-3" />
                  {enabled ? "Conversation" : "Silent"}
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <Crown className="w-3 h-3" />
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card border-border">
            {isPro 
              ? enabled 
                ? "AI will ask clarifying questions" 
                : "AI executes commands silently"
              : "Conversation Mode · Pro only"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300",
        isPro
          ? enabled
            ? "bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/30"
            : "bg-muted/30 text-muted-foreground border-border/50 hover:border-cosmic-silver/30"
          : "bg-cosmic-gold/5 text-cosmic-gold/60 border-cosmic-gold/20 cursor-pointer"
      )}
    >
      <div className="relative">
        <MessageSquare className="w-4 h-4" />
        {!isPro && (
          <Crown className="w-2.5 h-2.5 absolute -top-1 -right-1 text-cosmic-gold" />
        )}
      </div>
      
      <span className="text-sm font-medium">
        {isPro 
          ? enabled 
            ? "Conversation Mode" 
            : "Silent Mode"
          : "Conversation Mode"
        }
      </span>
      
      {isPro && (
        <div
          className={cn(
            "w-10 h-5 rounded-full relative transition-colors duration-300",
            enabled ? "bg-cosmic-teal/30" : "bg-muted/50"
          )}
        >
          <motion.div
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full",
              enabled ? "bg-cosmic-teal" : "bg-muted-foreground/50"
            )}
            animate={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      )}
      
      {!isPro && (
        <span className="text-xs bg-cosmic-gold/20 text-cosmic-gold px-1.5 py-0.5 rounded-full">
          Pro
        </span>
      )}
    </motion.button>
  );
};

export default ConversationModeToggle;
