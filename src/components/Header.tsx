import { CalendarDays, Settings, Bell, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  // Get user initial from email
  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="relative z-10 glass border-b border-border/30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-cosmic-radial border border-cosmic-silver/30 flex items-center justify-center glow-silver">
                <Sparkles className="w-5 h-5 text-cosmic-silver" />
              </div>
              <div className="absolute inset-0 rounded-full animate-glow-pulse" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wider text-glow">
                M87 PLANNER
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                Cosmic AI Scheduler
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="cosmic-ghost" size="sm" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="cosmic-ghost" size="sm">
              Tasks
            </Button>
            <Button variant="cosmic-ghost" size="sm">
              Routines
            </Button>
            <Button variant="cosmic-ghost" size="sm">
              Analytics
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="cosmic-ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-cosmic-teal rounded-full" />
            </Button>
            <Button variant="cosmic-ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="cosmic-ghost" 
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cosmic-silver/20 to-cosmic-teal/20 border border-cosmic-silver/30 flex items-center justify-center ml-2">
              <span className="text-sm font-medium text-cosmic-silver">{userInitial}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
