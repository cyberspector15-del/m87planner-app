import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Settings, Bell, LogOut } from "lucide-react";
import logoIcon from "@/assets/logo-icon.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/useHaptic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import RoutineList from "@/components/RoutineList";
import TaskList from "@/components/TaskList";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import { NotificationSettings } from "@/components/NotificationSettings";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { vibrate } = useHaptic();
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
              <div className="w-10 h-10 rounded-full border border-cosmic-silver/30 overflow-hidden glow-silver">
                <img src={logoIcon} alt="M87 Logo" className="w-full h-full object-cover" />
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
            <Sheet open={tasksOpen} onOpenChange={setTasksOpen}>
              <SheetTrigger asChild>
                <Button variant="cosmic-ghost" size="sm">
                  Tasks
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] glass border-l border-border/30 bg-background/95">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-cosmic-gradient">
                    Task Management
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <TaskList />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet open={routinesOpen} onOpenChange={setRoutinesOpen}>
              <SheetTrigger asChild>
                <Button variant="cosmic-ghost" size="sm">
                  Routines
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] glass border-l border-border/30 bg-background/95">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-cosmic-gradient">
                    Routine Management
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <RoutineList />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
              <SheetTrigger asChild>
                <Button variant="cosmic-ghost" size="sm">
                  Analytics
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] glass border-l border-border/30 bg-background/95">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-cosmic-gradient">
                    Analytics
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <AnalyticsPanel />
                </div>
              </SheetContent>
            </Sheet>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="cosmic-ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-cosmic-teal rounded-full" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[450px] glass border-l border-border/30 bg-background/95">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-cosmic-gradient">
                    Notification Settings
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <NotificationSettings />
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="cosmic-ghost"
              size="icon"
              onClick={() => {
                vibrate("light");
                navigate("/settings");
              }}
            >
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
