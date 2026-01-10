import { Sparkles, Hand } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPlanningMode = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();

  const handleModeChange = (newMode: "ai" | "manual") => {
    vibrate("light");
    updateSetting("planningMode", newMode);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

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
            settings.planningMode === "ai"
              ? "border-cosmic-silver/50 bg-cosmic-surface/50 glow-silver"
              : "border-border/30 bg-card/20 hover:border-border/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                settings.planningMode === "ai" ? "bg-cosmic-silver/20" : "bg-muted/50"
              }`}
            >
              <Sparkles
                className={`w-5 h-5 ${
                  settings.planningMode === "ai" ? "text-cosmic-silver" : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
          <span
            className={`font-medium text-sm ${
              settings.planningMode === "ai" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            AI-First Planning
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Let M87 optimize your day
          </p>
          {settings.planningMode === "ai" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cosmic-accent-teal glow-teal" />
          )}
        </button>

        <button
          onClick={() => handleModeChange("manual")}
          className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
            settings.planningMode === "manual"
              ? "border-cosmic-silver/50 bg-cosmic-surface/50 glow-silver"
              : "border-border/30 bg-card/20 hover:border-border/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                settings.planningMode === "manual" ? "bg-cosmic-silver/20" : "bg-muted/50"
              }`}
            >
              <Hand
                className={`w-5 h-5 ${
                  settings.planningMode === "manual" ? "text-cosmic-silver" : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
          <span
            className={`font-medium text-sm ${
              settings.planningMode === "manual" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Manual Planning
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Full control, no AI suggestions
          </p>
          {settings.planningMode === "manual" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cosmic-accent-teal glow-teal" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPlanningMode;
