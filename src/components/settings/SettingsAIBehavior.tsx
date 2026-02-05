import { Zap, MessageSquare, HelpCircle, Crown, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAIUsage } from "@/hooks/useAIUsage";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StrictnessLevel = "calm" | "balanced" | "strict";

const strictnessOptions: { value: StrictnessLevel; label: string; description: string }[] = [
  { value: "calm", label: "Calm", description: "Gentle suggestions" },
  { value: "balanced", label: "Balanced", description: "Smart nudges" },
  { value: "strict", label: "Strict", description: "Firm scheduling" },
];

const SettingsAIBehavior = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();
  const { 
    used, 
    limit, 
    tier, 
    isPro, 
    conversationModeEnabled, 
    toggleConversationMode,
    loading: usageLoading 
  } = useAIUsage();

  const handleChange = (key: "aiStrictness" | "askBeforeReschedule" | "showAiExplanations", value: StrictnessLevel | boolean) => {
    vibrate("light");
    updateSetting(key, value as never);
  };

  const handleConversationModeToggle = () => {
    if (!isPro) return;
    vibrate("light");
    toggleConversationMode();
  };

  if (loading || usageLoading) {
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

      {/* AI Usage Display */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cosmic-teal" />
            <span className="text-sm text-muted-foreground">Daily AI Commands</span>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            tier === "pro" 
              ? "bg-cosmic-gold/15 text-cosmic-gold" 
              : "bg-muted/50 text-muted-foreground"
          )}>
            {tier === "pro" ? "Pro" : "Free"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                used >= limit ? "bg-destructive" : "bg-cosmic-teal"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {used}/{limit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">
          {tier === "pro" 
            ? "Pro members get 20 AI commands per day." 
            : "Upgrade to Pro for 20 commands/day and conversational AI."}
        </p>
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
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cosmic-teal" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-4 pt-2">
        {/* Conversation Mode Toggle - Pro Feature */}
        <div className={cn(
          "flex items-center justify-between p-3 -mx-3 rounded-xl transition-colors",
          !isPro && "bg-muted/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isPro ? "bg-cosmic-teal/10" : "bg-muted/50"
            )}>
              <MessageSquare className={cn(
                "w-4 h-4",
                isPro ? "text-cosmic-teal" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Conversation Mode</span>
                {!isPro && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cosmic-gold/15 text-cosmic-gold text-[10px] font-semibold">
                    <Crown className="w-2.5 h-2.5" />
                    Pro
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {isPro 
                  ? "AI can ask clarifying questions" 
                  : "Upgrade to unlock interactive planning"}
              </span>
            </div>
          </div>
          <Switch
            checked={conversationModeEnabled}
            onCheckedChange={handleConversationModeToggle}
            disabled={!isPro}
          />
        </div>

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
