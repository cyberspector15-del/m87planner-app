import { Sparkles, Wand2, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAutoPlan } from "@/hooks/useAutoPlan";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import AIProcessingOverlay from "./AIProcessingOverlay";

interface AutoPlanButtonProps {
  selectedDate?: Date;
}

const AutoPlanButton = ({ selectedDate = new Date() }: AutoPlanButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { autoPlan, isPlanning } = useAutoPlan();

  const handleAutoPlan = async () => {
    setShowOverlay(true);
    setIsComplete(false);
    
    const result = await autoPlan(selectedDate);
    
    if (result?.scheduled && result.scheduled.length > 0) {
      setResults(result.scheduled);
      setIsComplete(true);
    } else {
      // Even if no results, show completion
      setIsComplete(true);
    }
  };

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setIsComplete(false);
    if (results.length > 0) {
      setShowResults(true);
    }
  }, [results.length]);

  return (
    <>
      {/* AI Processing Overlay */}
      <AIProcessingOverlay
        isVisible={showOverlay}
        isComplete={isComplete}
        onComplete={handleOverlayComplete}
      />

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
            M87's AI will analyze your tasks, priorities, and deadlines to create
            an optimal schedule. It finds available slots and places tasks intelligently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="cosmic-primary"
              size="lg"
              className="flex-1 gap-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleAutoPlan}
              disabled={isPlanning || showOverlay}
            >
              {isPlanning || showOverlay ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Auto Plan My Day
                </>
              )}
            </Button>
            <Button 
              variant="cosmic-outline" 
              size="lg" 
              className="gap-2"
              onClick={() => results.length > 0 && setShowResults(true)}
              disabled={results.length === 0}
            >
              <Wand2 className="w-4 h-4" />
              View Results
            </Button>
          </div>

          {/* Quick tips */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="text-cosmic-teal">Tip:</span> Make sure your tasks have
              priorities and durations set for best results.
              {" "}
              <span className="text-cosmic-silver">
                {format(selectedDate, "MMMM d, yyyy")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-teal" />
              Auto-Plan Results
            </DialogTitle>
            <DialogDescription>
              AI scheduled {results.length} task(s) for {format(selectedDate, "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {results.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-4 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    <span className="text-xs text-cosmic-teal">
                      {format(new Date(event.start_time), "h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>
                      {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                    </span>
                  </div>
                  {event.reason && (
                    <p className="text-xs text-muted-foreground italic">
                      {event.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoPlanButton;
