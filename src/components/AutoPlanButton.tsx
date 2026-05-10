import {
  MagicWand,
  Brain,
  CircleNotch,
  Lock,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAutoPlan } from "@/hooks/useAutoPlan";
import { useSmartReschedule } from "@/hooks/useSmartReschedule";
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
import type { ScheduledEvent } from "@/hooks/useAutoPlan";
import type { RescheduledTask } from "@/hooks/useSmartReschedule";

interface AutoPlanButtonProps {
  selectedDate?: Date;
}

/** Safely format a date string — returns fallback string if date is invalid. */
function safeFormat(dateStr: string | null | undefined, fmt: string, fallback = "--"): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}

const AutoPlanButton = ({ selectedDate = new Date() }: AutoPlanButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ScheduledEvent[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Smart Reschedule state
  const [showRescheduleResults, setShowRescheduleResults] = useState(false);
  const [rescheduleResults, setRescheduleResults] = useState<RescheduledTask[]>([]);
  const [rescheduleSummary, setRescheduleSummary] = useState("");
  const [showRescheduleOverlay, setShowRescheduleOverlay] = useState(false);
  const [isRescheduleComplete, setIsRescheduleComplete] = useState(false);
  const [planSummary, setPlanSummary] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const { autoPlan, isPlanning } = useAutoPlan();
  const { smartReschedule, isRescheduling } = useSmartReschedule();
  const { settings } = useSettings();

  // Check if we're in manual mode (AI features disabled)
  const isManualMode = settings.planningMode === "manual";

  const initiateAutoPlan = async () => {
    if (settings.askBeforeReschedule) {
      setShowConfirmDialog(true);
      return;
    }
    await executeAutoPlan();
  };

  const executeAutoPlan = async () => {
    setShowConfirmDialog(false);
    setShowOverlay(true);
    setIsComplete(false);
    setPlanError(null);

    try {
      const result = await autoPlan(selectedDate);

      if (result?.scheduled && result.scheduled.length > 0) {
        setResults(result.scheduled);
        setPlanSummary(result.summary ?? result.message ?? "");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auto-plan failed unexpectedly.";
      console.error("[AutoPlanButton] executeAutoPlan error:", err);
      setPlanError(msg);
    } finally {
      setIsComplete(true);
    }
  };

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setIsComplete(false);
    setShowWinScreen(true);
  }, []);

  const handleWinScreenComplete = useCallback(() => {
    setShowWinScreen(false);
    if (results.length > 0) {
      setShowResults(true);
    }
  }, [results.length]);

  // ── Smart Reschedule handlers ──
  const handleSmartReschedule = async () => {
    setShowRescheduleOverlay(true);
    setIsRescheduleComplete(false);
    setRescheduleError(null);

    try {
      const result = await smartReschedule();

      if (result) {
        setRescheduleResults(Array.isArray(result.rescheduled) ? result.rescheduled : []);
        setRescheduleSummary(typeof result.summary === "string" ? result.summary : "");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Smart reschedule failed unexpectedly.";
      console.error("[AutoPlanButton] handleSmartReschedule error:", err);
      setRescheduleError(msg);
    } finally {
      setIsRescheduleComplete(true);
    }
  };

  const handleRescheduleOverlayComplete = useCallback(() => {
    setShowRescheduleOverlay(false);
    setIsRescheduleComplete(false);
    if (rescheduleResults.length > 0) {
      setShowRescheduleResults(true);
    }
  }, [rescheduleResults.length]);

  // Render disabled state for manual mode
  if (isManualMode) {
    return (
      <div className="glass rounded-xl p-6 relative overflow-hidden opacity-60">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 border border-muted/30 flex items-center justify-center">
              <Lock size={24} weight="thin" className="text-muted-foreground" />
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
            <Brain size={20} weight="thin" />
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
              {format(selectedDate, "MMMM d, yyyy")}. This may rearrange your
              existing schedule to find optimal time slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAutoPlan}
              className="bg-cosmic-teal text-cosmic-black hover:bg-cosmic-teal/90"
            >
              Plan My Day
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Processing Overlay — Auto Plan */}
      <AIProcessingOverlay
        isVisible={showOverlay}
        isComplete={isComplete}
        onComplete={handleOverlayComplete}
      />

      {/* AI Processing Overlay — Smart Reschedule */}
      <AIProcessingOverlay
        isVisible={showRescheduleOverlay}
        isComplete={isRescheduleComplete}
        onComplete={handleRescheduleOverlayComplete}
      />

      {/* Win Screen — emotional confirmation */}
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
              <Brain size={24} weight="thin" className="text-cosmic-silver" />
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
            M87's AI will analyze your tasks, priorities, and deadlines to
            create an optimal schedule. It finds available slots and places
            tasks intelligently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Auto Plan My Day */}
            <Button
              variant="cosmic-primary"
              size="lg"
              className="flex-1 gap-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={initiateAutoPlan}
              disabled={isPlanning || showOverlay || isRescheduling || showRescheduleOverlay}
            >
              {isPlanning || showOverlay ? (
                <>
                  <CircleNotch size={20} weight="thin" className="animate-spin" />
                  Planning...
                </>
              ) : (
                <>Auto Plan My Day</>
              )}
            </Button>

            {/* View Results */}
            <Button
              variant="cosmic-outline"
              size="lg"
              className="gap-2"
              onClick={() => results.length > 0 && setShowResults(true)}
              disabled={results.length === 0}
            >
              <MagicWand size={16} weight="thin" />
              View Results
            </Button>
          </div>

          {/* Smart Reschedule button */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 border-cosmic-silver/20 text-cosmic-silver hover:bg-cosmic-silver/10 hover:border-cosmic-silver/40 transition-all"
              onClick={handleSmartReschedule}
              disabled={isRescheduling || showRescheduleOverlay || isPlanning || showOverlay}
            >
              {isRescheduling || showRescheduleOverlay ? (
                <>
                  <CircleNotch size={18} weight="thin" className="animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <ArrowsClockwise size={18} weight="thin" />
                  Smart Reschedule
                </>
              )}
            </Button>
          </div>

          {/* Quick tips */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="text-cosmic-teal">Tip:</span> Make sure your
              tasks have priorities and durations set for best results.{" "}
              <span className="text-cosmic-silver">
                {format(selectedDate, "MMMM d, yyyy")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Auto Plan Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              Auto-Plan Results
            </DialogTitle>
            <DialogDescription>
              {planSummary ||
                `AI scheduled ${results.length} task(s) for ${format(selectedDate, "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {planError ? (
                <p className="text-sm text-destructive text-center py-4">{planError}</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {planSummary || "No time blocks were returned by the AI."}
                </p>
              ) : (
                results.map((event, index) => (
                  <div
                    key={event?.id || index}
                    className="p-4 rounded-lg bg-background/50 border border-border/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{event?.title ?? "Untitled"}</h4>
                      <span className="text-xs text-cosmic-teal">
                        {safeFormat(event?.start_time, "h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>
                        {safeFormat(event?.start_time, "h:mm a")} –{" "}
                        {safeFormat(event?.end_time, "h:mm a")}
                      </span>
                    </div>
                    {settings.showAiExplanations && event?.reason && (
                      <p className="text-xs text-muted-foreground italic">
                        {event.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Smart Reschedule Results Dialog */}
      <Dialog open={showRescheduleResults} onOpenChange={setShowRescheduleResults}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <ArrowsClockwise size={18} weight="thin" className="text-cosmic-silver" />
              Smart Reschedule Results
            </DialogTitle>
            <DialogDescription>
              {rescheduleSummary || `${rescheduleResults.length} task(s) rescheduled by AI`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {rescheduleError ? (
                <p className="text-sm text-destructive text-center py-4">{rescheduleError}</p>
              ) : rescheduleResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {rescheduleSummary || "No tasks needed rescheduling."}
                </p>
              ) : (
                <>
                  {console.log("[AutoPlanButton] Rendering rescheduleResults:", rescheduleResults)}
                  {rescheduleResults.map((task, index) => (
                    <div
                      key={task?.task_id || index}
                      className="p-4 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{task?.task_title ?? "Untitled"}</h4>
                        <span className="text-xs text-cosmic-teal">
                          {task?.new_date} {task?.new_time}
                        </span>
                      </div>
                      {settings.showAiExplanations && task?.reason && (
                        <p className="text-xs text-muted-foreground italic">
                          {task.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoPlanButton;
