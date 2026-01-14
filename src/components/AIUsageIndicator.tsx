import { motion } from "framer-motion";
import { Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIUsageIndicatorProps {
  used: number;
  limit: number;
  isPro: boolean;
  className?: string;
}

const AIUsageIndicator = ({ used, limit, isPro, className }: AIUsageIndicatorProps) => {
  const remaining = Math.max(limit - used, 0);
  const percentage = (used / limit) * 100;
  
  const isLow = remaining <= 1 && !isPro;
  const isEmpty = remaining === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
              isEmpty
                ? "bg-destructive/20 text-destructive border border-destructive/30"
                : isLow
                  ? "bg-cosmic-gold/10 text-cosmic-gold border border-cosmic-gold/20"
                  : "bg-muted/40 text-muted-foreground border border-border/30",
              className
            )}
          >
            <Zap className={cn(
              "w-3 h-3",
              isEmpty ? "text-destructive" : isLow ? "text-cosmic-gold" : "text-cosmic-teal"
            )} />
            
            <span className="font-mono">
              {remaining}/{limit}
            </span>
            
            {isPro && (
              <Crown className="w-3 h-3 text-cosmic-gold" />
            )}

            {/* Mini progress bar */}
            <div className="w-8 h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isEmpty
                    ? "bg-destructive"
                    : isLow
                      ? "bg-cosmic-gold"
                      : "bg-cosmic-teal"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${100 - percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <div className="text-center">
            <p className="font-medium">
              {remaining} command{remaining !== 1 ? "s" : ""} remaining today
            </p>
            <p className="text-xs text-muted-foreground">
              {isPro ? "Pro plan" : "Free plan"} · Resets at midnight
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIUsageIndicator;
