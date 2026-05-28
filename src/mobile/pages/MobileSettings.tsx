import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MobileSettings = () => {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">App preferences</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Mobile settings screen scaffold.
        </p>
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link to="/settings">Open desktop settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileSettings;

