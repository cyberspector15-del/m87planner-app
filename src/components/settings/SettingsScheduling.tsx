import { Clock, Brain, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";

// Helper to compare times
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const clampTime = (time: string, min: string, max: string): string => {
  const timeMin = timeToMinutes(time);
  const minMin = timeToMinutes(min);
  const maxMin = timeToMinutes(max);
  
  if (timeMin < minMin) return min;
  if (timeMin > maxMin) return max;
  return time;
};

const SettingsScheduling = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();

  // Handle working hours with validation
  const handleWorkHoursChange = useCallback(
    (type: "start" | "end", value: string) => {
      if (!value) return;
      
      vibrate("light");
      
      if (type === "start") {
        updateSetting("workHoursStart", value);
        // If start is after end, adjust end
        if (timeToMinutes(value) >= timeToMinutes(settings.workHoursEnd)) {
          const newEnd = `${String(Math.min(23, parseInt(value.split(":")[0]) + 1)).padStart(2, "0")}:00`;
          updateSetting("workHoursEnd", newEnd);
        }
        // Clamp focus hours to stay within new working hours
        const clampedFocusStart = clampTime(settings.focusHoursStart, value, settings.workHoursEnd);
        const clampedFocusEnd = clampTime(settings.focusHoursEnd, value, settings.workHoursEnd);
        if (clampedFocusStart !== settings.focusHoursStart) {
          updateSetting("focusHoursStart", clampedFocusStart);
        }
        if (clampedFocusEnd !== settings.focusHoursEnd) {
          updateSetting("focusHoursEnd", clampedFocusEnd);
        }
      } else {
        updateSetting("workHoursEnd", value);
        // If end is before start, adjust start
        if (timeToMinutes(value) <= timeToMinutes(settings.workHoursStart)) {
          const newStart = `${String(Math.max(0, parseInt(value.split(":")[0]) - 1)).padStart(2, "0")}:00`;
          updateSetting("workHoursStart", newStart);
        }
        // Clamp focus hours to stay within new working hours
        const clampedFocusStart = clampTime(settings.focusHoursStart, settings.workHoursStart, value);
        const clampedFocusEnd = clampTime(settings.focusHoursEnd, settings.workHoursStart, value);
        if (clampedFocusStart !== settings.focusHoursStart) {
          updateSetting("focusHoursStart", clampedFocusStart);
        }
        if (clampedFocusEnd !== settings.focusHoursEnd) {
          updateSetting("focusHoursEnd", clampedFocusEnd);
        }
      }
    },
    [settings, updateSetting, vibrate]
  );

  // Handle focus hours with validation (must stay within working hours)
  const handleFocusHoursChange = useCallback(
    (type: "start" | "end", value: string) => {
      if (!value) return;
      
      vibrate("light");
      
      // Clamp to working hours
      const clampedValue = clampTime(value, settings.workHoursStart, settings.workHoursEnd);
      
      if (type === "start") {
        updateSetting("focusHoursStart", clampedValue);
        // If start is after end, adjust end
        if (timeToMinutes(clampedValue) >= timeToMinutes(settings.focusHoursEnd)) {
          const newEnd = clampTime(
            `${String(Math.min(23, parseInt(clampedValue.split(":")[0]) + 1)).padStart(2, "0")}:00`,
            settings.workHoursStart,
            settings.workHoursEnd
          );
          updateSetting("focusHoursEnd", newEnd);
        }
      } else {
        updateSetting("focusHoursEnd", clampedValue);
        // If end is before start, adjust start
        if (timeToMinutes(clampedValue) <= timeToMinutes(settings.focusHoursStart)) {
          const newStart = clampTime(
            `${String(Math.max(0, parseInt(clampedValue.split(":")[0]) - 1)).padStart(2, "0")}:00`,
            settings.workHoursStart,
            settings.workHoursEnd
          );
          updateSetting("focusHoursStart", newStart);
        }
      }
    },
    [settings, updateSetting, vibrate]
  );

  const handleAutoCarryChange = useCallback(
    (checked: boolean) => {
      vibrate("light");
      updateSetting("autoCarryTasks", checked);
    },
    [updateSetting, vibrate]
  );

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-5">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
          Scheduling Preferences
        </h2>
      </div>

      {/* Working Hours */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Working Hours</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={settings.workHoursStart}
            onChange={(e) => handleWorkHoursChange("start", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-silver/50 transition-all cursor-pointer appearance-none [color-scheme:dark]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={settings.workHoursEnd}
            onChange={(e) => handleWorkHoursChange("end", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-silver/50 transition-all cursor-pointer appearance-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Focus Hours */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="w-4 h-4" />
          <span>Focus / Deep Work Hours</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={settings.focusHoursStart}
            onChange={(e) => handleFocusHoursChange("start", e.target.value)}
            min={settings.workHoursStart}
            max={settings.workHoursEnd}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-silver/50 transition-all cursor-pointer appearance-none [color-scheme:dark]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={settings.focusHoursEnd}
            onChange={(e) => handleFocusHoursChange("end", e.target.value)}
            min={settings.workHoursStart}
            max={settings.workHoursEnd}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-silver/50 transition-all cursor-pointer appearance-none [color-scheme:dark]"
          />
        </div>
        <p className="text-xs text-muted-foreground/70">
          Must be within working hours
        </p>
      </div>

      {/* Auto Carry */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <span className="text-sm text-foreground">Auto-carry unfinished tasks</span>
            <p className="text-xs text-muted-foreground">
              Move incomplete tasks to the next day
            </p>
          </div>
        </div>
        <Switch
          checked={settings.autoCarryTasks}
          onCheckedChange={handleAutoCarryChange}
        />
      </div>
    </div>
  );
};

export default SettingsScheduling;
