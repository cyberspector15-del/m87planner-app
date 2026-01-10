import { Clock, Brain, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsScheduling = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();

  const handleChange = (key: "workHoursStart" | "workHoursEnd" | "focusHoursStart" | "focusHoursEnd" | "autoCarryTasks", value: string | boolean) => {
    vibrate("light");
    updateSetting(key, value as never);
  };

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
            onChange={(e) => handleChange("workHoursStart", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={settings.workHoursEnd}
            onChange={(e) => handleChange("workHoursEnd", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
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
            onChange={(e) => handleChange("focusHoursStart", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={settings.focusHoursEnd}
            onChange={(e) => handleChange("focusHoursEnd", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
          />
        </div>
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
          onCheckedChange={(checked) => handleChange("autoCarryTasks", checked)}
        />
      </div>
    </div>
  );
};

export default SettingsScheduling;
