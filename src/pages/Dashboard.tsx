import { useState } from "react";
import { format, isToday } from "date-fns";
import CosmicBackground from "@/components/CosmicBackground";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import QuickStats from "@/components/QuickStats";
import TaskList from "@/components/TaskList";
import AutoPlanButton from "@/components/AutoPlanButton";
import NLPInput from "@/components/NLPInput";
import DateSelector from "@/components/DateSelector";
import { useEvents } from "@/hooks/useEvents";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: events } = useEvents(selectedDate);

  const eventCount = events?.length ?? 0;
  const dateLabel = isToday(selectedDate) 
    ? "Today's Schedule" 
    : format(selectedDate, "EEEE, MMM d");

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
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

          {/* Quick Stats */}
          <div className="mb-8">
            <QuickStats />
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selector */}
              <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <DateSelector 
                  selectedDate={selectedDate} 
                  onDateChange={setSelectedDate} 
                />
              </div>

              {/* Timeline */}
              <div className="glass rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      {dateLabel}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {eventCount} event{eventCount !== 1 ? "s" : ""} planned
                    </p>
                  </div>
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
                <Timeline selectedDate={selectedDate} />
              </div>
            </div>

            {/* Right Column - Tasks & AI */}
            <div className="space-y-6">
              {/* AI Command Input */}
              <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
                <NLPInput />
              </div>

              {/* Auto Plan Button */}
              <div className="animate-fade-in" style={{ animationDelay: "500ms" }}>
                <AutoPlanButton />
              </div>

              {/* Task List */}
              <div className="animate-fade-in" style={{ animationDelay: "600ms" }}>
                <TaskList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
