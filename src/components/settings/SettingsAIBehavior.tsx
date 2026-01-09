import { useState, useEffect } from "react";
import { Zap, MessageSquare, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";

type StrictnessLevel = "calm" | "balanced" | "strict";

interface AIBehaviorPrefs {
  strictness: StrictnessLevel;
  askBeforeReschedule: boolean;
  showExplanations: boolean;
}

const defaultPrefs: AIBehaviorPrefs = {
  strictness: "balanced",
  askBeforeReschedule: true,
  showExplanations: true,
};

const strictnessOptions: { value: StrictnessLevel; label: string; description: string }[] = [
  { value: "calm", label: "Calm", description: "Gentle suggestions" },
  { value: "balanced", label: "Balanced", description: "Smart nudges" },
  { value: "strict", label: "Strict", description: "Firm scheduling" },
];

const SettingsAIBehavior = () => {
  const { vibrate } = useHaptic();
  const [prefs, setPrefs] = useState<AIBehaviorPrefs>(() => {
    const saved = localStorage.getItem("m87_ai_behavior_prefs");
    return saved ? JSON.parse(saved) : defaultPrefs;
  });

  useEffect(() => {
    localStorage.setItem("m87_ai_behavior_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const handleChange = (key: keyof AIBehaviorPrefs, value: StrictnessLevel | boolean) => {
    vibrate("light");
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

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
              onClick={() => handleChange("strictness", option.value)}
              className={`relative p-3 rounded-xl border text-center transition-all duration-300 ${
                prefs.strictness === option.value
                  ? "border-cosmic-silver/50 bg-cosmic-surface/50"
                  : "border-border/30 bg-card/20 hover:border-border/50"
              }`}
            >
              <span
                className={`font-medium text-sm block ${
                  prefs.strictness === option.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
              {prefs.strictness === option.value && (
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
            checked={prefs.askBeforeReschedule}
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
            checked={prefs.showExplanations}
            onCheckedChange={(checked) => handleChange("showExplanations", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsAIBehavior;
