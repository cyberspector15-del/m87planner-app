import { useState, useEffect } from "react";
import { Vibrate, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHaptic } from "@/hooks/useHaptic";

interface FeedbackPrefs {
  hapticEnabled: boolean;
  soundEnabled: boolean;
}

const defaultPrefs: FeedbackPrefs = {
  hapticEnabled: true,
  soundEnabled: true,
};

const SettingsFeedback = () => {
  const { vibrate } = useHaptic();
  const [prefs, setPrefs] = useState<FeedbackPrefs>(() => {
    const saved = localStorage.getItem("m87_feedback_prefs");
    return saved ? JSON.parse(saved) : defaultPrefs;
  });

  useEffect(() => {
    localStorage.setItem("m87_feedback_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const handleChange = (key: keyof FeedbackPrefs, value: boolean) => {
    if (key === "hapticEnabled" && value) {
      vibrate("medium");
    }
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

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
              <Vibrate className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Haptic feedback</span>
          </div>
          <Switch
            checked={prefs.hapticEnabled}
            onCheckedChange={(checked) => handleChange("hapticEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-foreground">Sound effects</span>
          </div>
          <Switch
            checked={prefs.soundEnabled}
            onCheckedChange={(checked) => handleChange("soundEnabled", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsFeedback;
