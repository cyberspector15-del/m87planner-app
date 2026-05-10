import { Info } from "@phosphor-icons/react";

const SettingsAbout = () => {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Info size={16} weight="thin" className="text-muted-foreground" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
          About
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <span className="text-foreground font-mono">1.0.0</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/20">
          M87 Planner is built to remove friction between intention and action.
        </p>
      </div>
    </div>
  );
};

export default SettingsAbout;
