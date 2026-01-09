import { useState, useEffect } from "react";
import { Clock, Brain, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";

interface SchedulingPrefs {
  workStart: string;
  workEnd: string;
  focusStart: string;
  focusEnd: string;
  autoCarry: boolean;
}

const defaultPrefs: SchedulingPrefs = {
  workStart: "09:00",
  workEnd: "17:00",
  focusStart: "09:00",
  focusEnd: "12:00",
  autoCarry: true,
};

const SettingsScheduling = () => {
  const { vibrate } = useHaptic();
  const [prefs, setPrefs] = useState<SchedulingPrefs>(() => {
    const saved = localStorage.getItem("m87_scheduling_prefs");
    return saved ? JSON.parse(saved) : defaultPrefs;
  });

  useEffect(() => {
    localStorage.setItem("m87_scheduling_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const handleChange = (key: keyof SchedulingPrefs, value: string | boolean) => {
    vibrate("light");
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

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
            value={prefs.workStart}
            onChange={(e) => handleChange("workStart", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={prefs.workEnd}
            onChange={(e) => handleChange("workEnd", e.target.value)}
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
            value={prefs.focusStart}
            onChange={(e) => handleChange("focusStart", e.target.value)}
            className="flex-1 bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="time"
            value={prefs.focusEnd}
            onChange={(e) => handleChange("focusEnd", e.target.value)}
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
          checked={prefs.autoCarry}
          onCheckedChange={(checked) => handleChange("autoCarry", checked)}
        />
      </div>
    </div>
  );
};

export default SettingsScheduling;
