import { motion } from "framer-motion";
import { WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AIUsageIndicatorProps {
  used: number;
  limit: number;
  tier: "free" | "pro";
  className?: string;
}

const AIUsageIndicator = ({ used, limit, tier, className }: AIUsageIndicatorProps) => {
  const remaining = Math.max(limit - used, 0);
  const percentage = (used / limit) * 100;
  const isLow = remaining <= 1 && remaining > 0;
  const isExhausted = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
        isExhausted 
          ? "bg-destructive/10 border border-destructive/30" 
          : isLow 
            ? "bg-cosmic-gold/10 border border-cosmic-gold/30"
            : "bg-muted/40 border border-border/30",
        className
      )}
    >
      {isExhausted ? (
        <WarningCircle size={14} weight="thin" className="text-destructive" />
      ) : null}
      
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "font-medium",
          isExhausted 
            ? "text-destructive" 
            : isLow 
              ? "text-cosmic-gold"
              : "text-muted-foreground"
        )}>
          {remaining}
        </span>
        <span className="text-muted-foreground/70">
          / {limit} left
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="w-12 h-1 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isExhausted 
              ? "bg-destructive" 
              : isLow 
                ? "bg-cosmic-gold"
                : "bg-cosmic-teal"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {tier === "free" && (
        <span className="text-muted-foreground/50 ml-1">Free</span>
      )}
      {tier === "pro" && (
        <span className="text-cosmic-gold/70 ml-1 font-medium">Pro</span>
      )}
    </motion.div>
  );
};

export default AIUsageIndicator;
