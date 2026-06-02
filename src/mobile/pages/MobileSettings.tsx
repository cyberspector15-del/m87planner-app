import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import CosmicBackground from "@/components/CosmicBackground";
import SettingsPlanningMode from "@/components/settings/SettingsPlanningMode";
import SettingsScheduling from "@/components/settings/SettingsScheduling";
import SettingsFeedback from "@/components/settings/SettingsFeedback";
import SettingsAbout from "@/components/settings/SettingsAbout";
import { Button } from "@/components/ui/button";

const MobileSettings = () => {
  return (
    <div className="relative">
      <CosmicBackground />

      <div className="relative z-10 space-y-4">
        <header>
          <h1 className="font-display text-xl font-bold tracking-wider text-glow">
            SETTINGS
          </h1>
          <p className="text-xs text-muted-foreground tracking-wide">
            Customize your M87 experience
          </p>
        </header>

        <SettingsPlanningMode />
        <SettingsScheduling />
        <SettingsFeedback />

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <CreditCard size={16} className="text-muted-foreground" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
              Billing
            </h2>
          </div>

          <Button asChild variant="cosmic-outline" className="w-full">
            <Link to="/m/pricing">View Plans & FLUX</Link>
          </Button>
        </div>

        <SettingsAbout />
      </div>
    </div>
  );
};

export default MobileSettings;
