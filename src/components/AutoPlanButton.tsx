import { Sparkles, Wand2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AutoPlanButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="glass rounded-xl p-6 relative overflow-hidden">
      {/* Animated background glow */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(circle at center, hsl(175 40% 45% / 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cosmic-silver/20 to-cosmic-teal/20 border border-cosmic-silver/30 flex items-center justify-center glow-silver">
            <Brain className="w-6 h-6 text-cosmic-silver" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">
              AI Auto-Scheduler
            </h2>
            <p className="text-xs text-muted-foreground">
              Let AI optimize your day
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          M87's AI will analyze your tasks, routines, and travel times to create
          an optimal schedule. It considers your preferences and priorities.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="cosmic-primary"
            size="lg"
            className="flex-1 gap-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Sparkles className="w-5 h-5" />
            Auto Plan My Day
          </Button>
          <Button variant="cosmic-outline" size="lg" className="gap-2">
            <Wand2 className="w-4 h-4" />
            Preview
          </Button>
        </div>

        {/* Quick tips */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            <span className="text-cosmic-teal">Tip:</span> You can also type
            natural language like{" "}
            <span className="text-cosmic-silver">"plan my day"</span> or{" "}
            <span className="text-cosmic-silver">"add gym 3x a week"</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoPlanButton;
