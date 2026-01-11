import { Sparkles, Wand2, Brain, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAutoPlan } from "@/hooks/useAutoPlan";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import AIProcessingOverlay from "./AIProcessingOverlay";
import WinScreen from "./WinScreen";

interface AutoPlanButtonProps {
  selectedDate?: Date;
}

const AutoPlanButton = ({ selectedDate = new Date() }: AutoPlanButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { autoPlan, isPlanning } = useAutoPlan();
  const { settings } = useSettings();

  // Check if we're in manual mode (AI features disabled)
  const isManualMode = settings.planningMode === "manual";

  const initiateAutoPlan = async () => {
    // If "Ask before rescheduling" is enabled, show confirmation first
    if (settings.askBeforeReschedule) {
      setShowConfirmDialog(true);
      return;
    }
    
    // Otherwise proceed directly
    await executeAutoPlan();
  };

  const executeAutoPlan = async () => {
    setShowConfirmDialog(false);
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
    // Show win screen after AI processing completes
    setShowWinScreen(true);
  }, []);

  const handleWinScreenComplete = useCallback(() => {
    setShowWinScreen(false);
    if (results.length > 0) {
      setShowResults(true);
    }
  }, [results.length]);

  // Render disabled state for manual mode
  if (isManualMode) {
    return (
      <div className="glass rounded-xl p-6 relative overflow-hidden opacity-60">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 border border-muted/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                AI Auto-Scheduler
              </h2>
              <p className="text-xs text-muted-foreground">
                Manual planning mode active
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            You're in manual planning mode. Switch to AI-First mode in Settings
            to enable automatic task scheduling.
          </p>

          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            disabled
          >
            <Brain className="w-5 h-5" />
            AI Planning Disabled
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Dialog - Ask Before Rescheduling */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Run AI Auto-Scheduler?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The AI will analyze your tasks and schedule them for{" "}
              {format(selectedDate, "MMMM d, yyyy")}. This may rearrange 
              your existing schedule to find optimal time slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAutoPlan} className="bg-cosmic-teal text-cosmic-black hover:bg-cosmic-teal/90">
              Plan My Day
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Processing Overlay */}
      <AIProcessingOverlay
        isVisible={showOverlay}
        isComplete={isComplete}
        onComplete={handleOverlayComplete}
      />

      {/* Win Screen - emotional confirmation */}
      <WinScreen
        isVisible={showWinScreen}
        variant="planning"
        onComplete={handleWinScreenComplete}
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
              onClick={initiateAutoPlan}
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
                  {/* Only show AI explanation if setting is enabled */}
                  {settings.showAiExplanations && event.reason && (
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
