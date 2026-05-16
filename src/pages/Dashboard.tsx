import { useState } from "react";
import { format, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import CosmicBackground from "@/components/CosmicBackground";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import QuickStats from "@/components/QuickStats";
import TaskList from "@/components/TaskList";
import AutoPlanButton from "@/components/AutoPlanButton";
import CommandCenter from "@/components/CommandCenter";
import DateSelector from "@/components/DateSelector";
import EventDialog from "@/components/EventDialog";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { useEvents } from "@/hooks/useEvents";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react";
import { Zap } from "lucide-react";
import { useFlux } from "../hooks/useFlux";
import FluxHistoryModal from "@/components/FluxHistoryModal";

const Index = () => {
  const navigate = useNavigate();
  const { isActive } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFluxModal, setShowFluxModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: events } = useEvents(selectedDate);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { balance, monthlyAllowance, isLoading: fluxLoading } = useFlux();

  const eventCount = events?.length ?? 0;
  const dateLabel = isToday(selectedDate) 
    ? "Today's Schedule" 
    : format(selectedDate, "EEEE, MMM d");


  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      {/* Onboarding Flow */}
      <OnboardingFlow
        isVisible={showOnboarding}
        onComplete={completeOnboarding}
      />
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          {/* Page Title */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-cosmic-gradient mb-2">
              Welcome back, Explorer
            </h1>
            <p className="text-muted-foreground">
              Your cosmic schedule awaits. Let's make today extraordinary.
            </p>
          </div>

          {/* AI Command Center - Primary Interaction */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CommandCenter />
          </div>

          {/* HUD Cards Row */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
            <div className="lg:col-span-4">
              <QuickStats />
            </div>
            <div 
              className="glass rounded-xl p-4 border border-white/5 cursor-pointer hover:border-[#CF3030]/50 hover:shadow-[0_0_20px_rgba(207,48,48,0.2)] transition-all duration-300 active:scale-[0.98]"
              onClick={() => setShowFluxModal(true)}
            >
              <div className="flex items-start justify-between">
                <div className="bg-[#CF3030]/10 p-2 rounded-lg">
                  <Zap size={20} className="text-[#CF3030]" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-display font-bold text-foreground">
                  {fluxLoading ? '—' : balance}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  FLUX remaining
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                    {fluxLoading ? 'Loading allowance...' : `${monthlyAllowance} allowance / month`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selector */}
              <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: "250ms" }}>
                <DateSelector 
                  selectedDate={selectedDate} 
                  onDateChange={setSelectedDate} 
                />
              </div>

              {/* Timeline */}
              <div className="glass rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      {dateLabel}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {eventCount} event{eventCount !== 1 ? "s" : ""} planned
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <EventDialog 
                      selectedDate={selectedDate} 
                      trigger={
                        <Button 
                          variant="cosmic-outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={(e) => {
                            if (!isActive) {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowUpgradeModal(true);
                            }
                          }}
                        >
                          <Plus size={16} weight="thin" />
                          Add Event
                        </Button>
                      }
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cosmic-teal" />
                      Current
                    </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                        Upcoming
                      </span>
                    </div>
                  </div>
                </div>
                <Timeline selectedDate={selectedDate} />
              </div>
            </div>

            {/* Right Column - Auto Plan & Tasks */}
            <div className="space-y-6">
              {/* Auto Plan Button */}
              <div className="animate-fade-in" style={{ animationDelay: "450ms" }}>
                <AutoPlanButton selectedDate={selectedDate} />
              </div>

              {/* Task List */}
              <div className="animate-fade-in" style={{ animationDelay: "550ms" }}>
                <TaskList />
              </div>
            </div>
          </div>
        </main>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="tier"
        featureName="Add Event"
        requiredTier="event_horizon"
      />
      <FluxHistoryModal
        isOpen={showFluxModal}
        onClose={() => setShowFluxModal(false)}
      />
    </div>
  );
};

export default Index;
