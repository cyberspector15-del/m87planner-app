import { Zap, MessageSquare, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";

type StrictnessLevel = "calm" | "balanced" | "strict";

const strictnessOptions: { value: StrictnessLevel; label: string; description: string }[] = [
  { value: "calm", label: "Calm", description: "Gentle suggestions" },
  { value: "balanced", label: "Balanced", description: "Smart nudges" },
  { value: "strict", label: "Strict", description: "Firm scheduling" },
];

const SettingsAIBehavior = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();

  const handleChange = (key: "aiStrictness" | "askBeforeReschedule" | "showAiExplanations", value: StrictnessLevel | boolean) => {
    vibrate("light");
    updateSetting(key, value as never);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-5">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
          AI Behavior
        </h2>
      </div>

      {/* Strictness Selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4" />
          <span>AI Strictness</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {strictnessOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange("aiStrictness", option.value)}
              className={`relative p-3 rounded-xl border text-center transition-all duration-300 ${
                settings.aiStrictness === option.value
                  ? "border-cosmic-silver/50 bg-cosmic-surface/50"
                  : "border-border/30 bg-card/20 hover:border-border/50"
              }`}
            >
              <span
                className={`font-medium text-sm block ${
                  settings.aiStrictness === option.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
              {settings.aiStrictness === option.value && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cosmic-accent-teal" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Ask before rescheduling</span>
          </div>
          <Switch
            checked={settings.askBeforeReschedule}
            onCheckedChange={(checked) => handleChange("askBeforeReschedule", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Show AI explanations</span>
          </div>
          <Switch
            checked={settings.showAiExplanations}
            onCheckedChange={(checked) => handleChange("showAiExplanations", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsAIBehavior;
