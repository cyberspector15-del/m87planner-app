import { useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import CommandCenter from "@/components/CommandCenter";
import QuickStats from "@/components/QuickStats";
import DateSelector from "@/components/DateSelector";
import Timeline from "@/components/Timeline";
import AutoPlanButton from "@/components/AutoPlanButton";
import EventDialog from "@/components/EventDialog";
import { useEvents } from "@/hooks/useEvents";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import CosmicBackground from "@/components/CosmicBackground";
import { useFlux } from "@/hooks/useFlux";
import FluxHistoryModal from "@/components/FluxHistoryModal";
import { Mail, Plus, Zap } from "lucide-react";
import { Bell, GearSix, SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.jpg";
import { useMail } from "@/contexts/MailContext";
import { useHaptic } from "@/hooks/useHaptic";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationSettings } from "@/components/NotificationSettings";
import ProfileDrawer from "@/components/ProfileDrawer";

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { vibrate } = useHaptic();
  const { setMailOpen, mailUnread } = useMail();
  const { isActive } = useSubscription();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const { data: events } = useEvents(selectedDate);
  const { balance, monthlyAllowance, isLoading: fluxLoading } = useFlux();
  const [showFluxModal, setShowFluxModal] = useState(false);

  const dateLabel = useMemo(() => {
    return isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, "EEEE, MMM d");
  }, [selectedDate]);

  const eventCount = events?.length ?? 0;

  const fullName = user?.user_metadata?.full_name || user?.email || "U";
  const userInitial = fullName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <div className="relative">
      <CosmicBackground />
      <div className="relative z-10 space-y-4">
        <header className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logoIcon}
                alt="M87 Planner"
                className="h-10 w-10 rounded-full border border-white/10 object-cover shrink-0"
                loading="eager"
                decoding="async"
              />
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold tracking-wide text-foreground truncate">
                  M87 PLANNER
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Cosmic AI Scheduler
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="relative">
                <Button
                  variant="cosmic-ghost"
                  size="icon"
                  onClick={() => {
                    vibrate("light");
                    setMailOpen(true);
                  }}
                  className="opacity-80 hover:opacity-100"
                >
                  <Mail size={16} />
                </Button>
                {mailUnread && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF3B3B]"
                    style={{ boxShadow: "0 0 6px #FF3B3B" }}
                  />
                )}
              </div>

              <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetTrigger asChild>
                  <Button variant="cosmic-ghost" size="icon" className="relative opacity-80 hover:opacity-100">
                    <Bell size={16} weight="thin" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-cosmic-teal rounded-full" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[340px] glass border-l border-border/30 bg-background/95">
                  <SheetHeader>
                    <SheetTitle className="font-display text-xl text-cosmic-gradient">
                      Notifications
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
                  navigate("/m/settings");
                }}
                className="opacity-80 hover:opacity-100"
                title="Settings"
              >
                <GearSix size={16} weight="thin" />
              </Button>

              <Button
                variant="cosmic-ghost"
                size="icon"
                onClick={handleSignOut}
                className="opacity-80 hover:opacity-100"
                title="Sign out"
              >
                <SignOut size={16} weight="thin" />
              </Button>

              <button
                onClick={() => {
                  vibrate("light");
                  setProfileOpen(true);
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-cosmic-silver/20 to-cosmic-teal/20 border border-cosmic-silver/30 flex items-center justify-center ml-1 cursor-pointer overflow-hidden focus:outline-none focus:ring-1 focus:ring-cosmic-silver/50"
                title="Open profile"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || "Profile"}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-cosmic-silver">{userInitial}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="glass rounded-2xl p-3">
          <div className="aspect-video overflow-hidden rounded-xl">
            <div className="h-full overflow-y-auto overflow-x-hidden">
              <CommandCenter compact />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <QuickStats />

          {/* Flux (match desktop card behavior + modal) */}
          <div
            className="glass rounded-xl p-4 border border-white/5 cursor-pointer hover:border-[#CF3030]/50 hover:shadow-[0_0_20px_rgba(207,48,48,0.2)] transition-all duration-300 active:scale-[0.98]"
            onClick={() => setShowFluxModal(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowFluxModal(true);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="bg-[#CF3030]/10 p-2 rounded-lg">
                <Zap size={20} className="text-[#CF3030]" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-display font-bold text-foreground">
                {fluxLoading ? "—" : balance}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                FLUX remaining
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                  {fluxLoading ? "Loading allowance..." : `${monthlyAllowance} allowance / month`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <AutoPlanButton
          selectedDate={selectedDate}
          hideViewResultsButton
          primaryButtonClassName="w-full h-14 text-base !rounded-2xl"
        />

        <div className="-mx-4 px-4">
          <div className="glass rounded-xl p-4 overflow-x-auto">
            <div className="min-w-max">
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-foreground">{dateLabel}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {eventCount} event{eventCount !== 1 ? "s" : ""}
              </p>
            </div>
            <EventDialog
              selectedDate={selectedDate}
              trigger={
                <Button
                  variant="cosmic-outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={(event) => {
                    if (!isActive) {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowUpgradeModal(true);
                    }
                  }}
                >
                  <Plus size={14} />
                  Add
                </Button>
              }
            />
          </div>
          <Timeline selectedDate={selectedDate} />
        </div>
      </div>

      <FluxHistoryModal
        isOpen={showFluxModal}
        onClose={() => setShowFluxModal(false)}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="tier"
        featureName="Add Event"
        requiredTier="event_horizon"
      />

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};

export default MobileDashboard;
