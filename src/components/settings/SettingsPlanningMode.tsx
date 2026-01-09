import { useState, useEffect } from "react";
import { Sparkles, Hand } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

const SettingsPlanningMode = () => {
  const { vibrate } = useHaptic();
  const [mode, setMode] = useState<"ai" | "manual">(() => {
    const saved = localStorage.getItem("m87_planning_mode");
    return (saved as "ai" | "manual") || "ai";
  });

  useEffect(() => {
    localStorage.setItem("m87_planning_mode", mode);
  }, [mode]);

  const handleModeChange = (newMode: "ai" | "manual") => {
    vibrate("light");
    setMode(newMode);
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
          Planning Mode
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how much control M87 has over your schedule.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleModeChange("ai")}
          className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
            mode === "ai"
              ? "border-cosmic-silver/50 bg-cosmic-surface/50 glow-silver"
              : "border-border/30 bg-card/20 hover:border-border/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                mode === "ai" ? "bg-cosmic-silver/20" : "bg-muted/50"
              }`}
            >
              <Sparkles
                className={`w-5 h-5 ${
                  mode === "ai" ? "text-cosmic-silver" : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
          <span
            className={`font-medium text-sm ${
              mode === "ai" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            AI-First Planning
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Let M87 optimize your day
          </p>
          {mode === "ai" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cosmic-accent-teal glow-teal" />
          )}
        </button>

        <button
          onClick={() => handleModeChange("manual")}
          className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
            mode === "manual"
              ? "border-cosmic-silver/50 bg-cosmic-surface/50 glow-silver"
              : "border-border/30 bg-card/20 hover:border-border/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                mode === "manual" ? "bg-cosmic-silver/20" : "bg-muted/50"
              }`}
            >
              <Hand
                className={`w-5 h-5 ${
                  mode === "manual" ? "text-cosmic-silver" : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
          <span
            className={`font-medium text-sm ${
              mode === "manual" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Manual Planning
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Full control, no AI suggestions
          </p>
          {mode === "manual" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cosmic-accent-teal glow-teal" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPlanningMode;
