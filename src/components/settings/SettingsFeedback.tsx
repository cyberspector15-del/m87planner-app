import { Vibrate, SpeakerHigh } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsFeedback = () => {
  const { vibrate } = useHaptic();
  const { settings, loading, updateSetting } = useUserSettings();

  const handleChange = (key: "hapticEnabled" | "soundEnabled", value: boolean) => {
    if (key === "hapticEnabled" && value) {
      vibrate("medium");
    }
    updateSetting(key, value);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
          Feedback & Feel
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Vibrate size={16} weight="thin" className="text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Haptic feedback</span>
          </div>
          <Switch
            checked={settings.hapticEnabled}
            onCheckedChange={(checked) => handleChange("hapticEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <SpeakerHigh size={16} weight="thin" className="text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Sound effects</span>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => handleChange("soundEnabled", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsFeedback;
