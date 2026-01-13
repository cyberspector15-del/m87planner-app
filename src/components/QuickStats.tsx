import { useState } from "react";
import { CheckCircle2, Clock, Target, Zap, TrendingUp, X, Flame, Calendar, PartyPopper } from "lucide-react";
import { useQuickStats } from "@/hooks/useQuickStats";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, isToday, parseISO, startOfDay, endOfDay, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHaptic } from "@/hooks/useHaptic";
import { useStreakConfetti } from "@/hooks/useStreakConfetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ModalType = "completed" | "focus" | "streak" | "efficiency" | null;

const QuickStats = () => {
  const { data: stats, isLoading } = useQuickStats();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyProgress();
  const { vibrate } = useHaptic();
  const { isMilestone, currentMilestone, nextMilestone, fireConfetti } = useStreakConfetti(stats?.streak);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch tasks completed today
  const { data: todayTasks, isLoading: todayTasksLoading } = useQuery({
    queryKey: ["today-completed-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", dayStart)
        .lte("updated_at", dayEnd)
        .order("updated_at", { ascending: false });

      return data || [];
    },
    enabled: activeModal === "completed",
  });

  // Fetch today's events for focus time
  const { data: todayEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["today-focus-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", dayStart)
        .lte("end_time", dayEnd)
        .order("start_time", { ascending: true });

      return data || [];
    },
    enabled: activeModal === "focus",
  });

  // Fetch streak data (last 30 days of completed tasks)
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["streak-calendar"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29).toISOString();

      const { data } = await supabase
        .from("tasks")
        .select("updated_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", thirtyDaysAgo)
        .lte("updated_at", endOfDay(today).toISOString());

      // Group by day
      const dayMap = new Map<string, number>();
      data?.forEach((task) => {
        const day = format(new Date(task.updated_at), "yyyy-MM-dd");
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });

      // Build 30-day array
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i);
        const dateKey = format(date, "yyyy-MM-dd");
        days.push({
          date: dateKey,
          completed: dayMap.get(dateKey) || 0,
          isToday: i === 0,
        });
      }

      return days;
    },
    enabled: activeModal === "streak",
  });

  // Fetch tasks for selected date (from weekly chart)
  const { data: dayTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["day-completed-tasks", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const dayStart = startOfDay(parseISO(selectedDate)).toISOString();
      const dayEnd = endOfDay(parseISO(selectedDate)).toISOString();

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", dayStart)
        .lte("updated_at", dayEnd)
        .order("updated_at", { ascending: false });

      return data || [];
    },
    enabled: !!selectedDate,
  });

  const handleCardClick = (type: ModalType) => {
    vibrate("light");
    setActiveModal(type);
  };

  const handleBarClick = (data: { date: string; completed: number }) => {
    if (data.completed > 0) {
      vibrate("light");
      setSelectedDate(data.date);
    }
  };

  const totalCompleted = weeklyData?.reduce((sum, day) => sum + day.completed, 0) || 0;
  const maxValue = Math.max(...(weeklyData?.map(d => d.completed) || [0]), 1);

  const statItems = [
    {
      icon: CheckCircle2,
      label: "Completed",
      value: stats?.completedToday.toString() || "0",
      subtext: "tasks today",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      glowClass: "hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      modalType: "completed" as ModalType,
    },
    {
      icon: Clock,
      label: "Focus Time",
      value: `${stats?.focusHours || "0"}h`,
      subtext: "deep work",
      color: "text-cosmic-silver",
      bgColor: "bg-cosmic-silver/10",
      glowClass: "hover:border-cosmic-silver/50 hover:shadow-[0_0_20px_rgba(192,192,192,0.2)]",
      modalType: "focus" as ModalType,
    },
    {
      icon: Target,
      label: "Streak",
      value: stats?.streak.toString() || "0",
      subtext: "days",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      glowClass: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      modalType: "streak" as ModalType,
    },
    {
      icon: Zap,
      label: "Efficiency",
      value: `${stats?.efficiency || 0}%`,
      subtext: "this week",
      color: "text-cosmic-teal",
      bgColor: "bg-cosmic-teal/10",
      glowClass: "hover:border-cosmic-teal/50 hover:glow-teal",
      modalType: "efficiency" as ModalType,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            onClick={() => handleCardClick(stat.modalType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`glass rounded-xl p-4 animate-fade-in transition-all duration-300 cursor-pointer ${stat.glowClass} active:scale-[0.98]`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <TrendingUp className={`w-4 h-4 ${stat.color} opacity-50`} />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-display font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.subtext}
                <span className={`${stat.color} opacity-70 ml-1`}>• tap to view</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Completed Today Modal */}
      <AnimatePresence>
        {activeModal === "completed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass rounded-2xl p-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2.5 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Today's Wins</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-display text-2xl font-bold text-emerald-400">{stats?.completedToday || 0}</span>
                  <span className="text-sm text-muted-foreground">completed</span>
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="max-h-64 overflow-y-auto space-y-2">
                {todayTasksLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : todayTasks && todayTasks.length > 0 ? (
                  todayTasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Completed at {format(new Date(task.updated_at), "h:mm a")}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No tasks completed yet today. You got this! 🚀</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Time Modal */}
      <AnimatePresence>
        {activeModal === "focus" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass rounded-2xl p-6 border border-cosmic-silver/30 shadow-[0_0_30px_rgba(192,192,192,0.15)]"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-cosmic-silver/20 p-2.5 rounded-xl">
                    <Clock className="w-6 h-6 text-cosmic-silver" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Focus Sessions</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmic-silver/20 border border-cosmic-silver/30"
                >
                  <Clock className="w-4 h-4 text-cosmic-silver" />
                  <span className="font-display text-2xl font-bold text-cosmic-silver">{stats?.focusHours || 0}h</span>
                  <span className="text-sm text-muted-foreground">deep work</span>
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="max-h-64 overflow-y-auto space-y-2">
                {eventsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : todayEvents && todayEvents.length > 0 ? (
                  todayEvents.map((event, i) => {
                    const duration = Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60));
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-cosmic-silver/10 border border-cosmic-silver/20"
                      >
                        <Clock className="w-5 h-5 text-cosmic-silver mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                            <span className="text-cosmic-silver ml-2">({duration} min)</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">No focus sessions scheduled today. Plan your deep work! 🎯</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Modal */}
      <AnimatePresence>
        {activeModal === "streak" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass rounded-2xl p-6 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 p-2.5 rounded-xl">
                    <Flame className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Your Streak</h3>
                    <p className="text-sm text-muted-foreground">Last 30 days activity</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30"
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="font-display text-2xl font-bold text-amber-400">{stats?.streak || 0}</span>
                    <span className="text-sm text-muted-foreground">day streak</span>
                  </motion.div>
                  
                  {isMilestone && currentMilestone && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      onClick={() => {
                        vibrate("medium");
                        fireConfetti();
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/50 hover:border-amber-400 transition-colors"
                    >
                      <PartyPopper className="w-4 h-4 text-amber-300" />
                      <span className="text-sm font-medium text-amber-300">🎉 {currentMilestone}-day milestone!</span>
                    </motion.button>
                  )}
                </div>
                
                {nextMilestone && !isMilestone && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-muted-foreground mt-3"
                  >
                    {nextMilestone - (stats?.streak || 0)} days until your next milestone ({nextMilestone} days) 🔥
                  </motion.p>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                {streakLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="grid grid-cols-10 gap-1.5">
                    {streakData?.map((day, i) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.01, type: "spring", stiffness: 300 }}
                        className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                          day.completed > 0
                            ? day.completed >= 3
                              ? "bg-amber-400 text-black"
                              : day.completed >= 2
                              ? "bg-amber-500/70 text-white"
                              : "bg-amber-500/40 text-amber-200"
                            : "bg-muted/30 text-muted-foreground/50"
                        } ${day.isToday ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background" : ""}`}
                        title={`${format(parseISO(day.date), "MMM d")}: ${day.completed} task${day.completed !== 1 ? "s" : ""}`}
                      >
                        {day.completed > 0 ? day.completed : ""}
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>30 days ago</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-muted/30" />
                    <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
                    <div className="w-3 h-3 rounded-sm bg-amber-500/70" />
                    <div className="w-3 h-3 rounded-sm bg-amber-400" />
                    <span>More</span>
                  </div>
                  <span>Today</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efficiency/Weekly Chart Modal */}
      <AnimatePresence>
        {activeModal === "efficiency" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass rounded-2xl p-6 border border-cosmic-teal/30 glow-teal"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-cosmic-teal/20 p-2.5 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-cosmic-teal" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Weekly Progress</h3>
                    <p className="text-sm text-muted-foreground">{totalCompleted} task{totalCompleted !== 1 ? "s" : ""} completed</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmic-teal/20 border border-cosmic-teal/30"
                >
                  <Zap className="w-4 h-4 text-cosmic-teal" />
                  <span className="font-display text-2xl font-bold text-cosmic-teal">{stats?.efficiency || 0}%</span>
                  <span className="text-sm text-muted-foreground">efficiency</span>
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="h-48">
                {weeklyLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} domain={[0, Math.max(maxValue, 3)]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass rounded-lg px-3 py-2 border border-border/50">
                                <p className="text-xs text-muted-foreground">{format(parseISO(data.date), "EEEE, MMM d")}</p>
                                <p className="text-sm font-semibold text-foreground">{data.completed} task{data.completed !== 1 ? "s" : ""}</p>
                                {data.completed > 0 && <p className="text-xs text-cosmic-teal mt-1">Click to view</p>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="completed" radius={[6, 6, 0, 0]} maxBarSize={40} cursor="pointer" onClick={(data) => handleBarClick(data)}>
                        {weeklyData?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={isToday(parseISO(entry.date)) ? 'hsl(var(--cosmic-teal))' : 'hsl(var(--cosmic-silver) / 0.6)'}
                            className="hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs text-center text-muted-foreground mt-4">
                Tap any bar to see completed tasks
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Tasks Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {selectedDate && format(parseISO(selectedDate), "EEEE, MMMM d")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {tasksLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : dayTasks && dayTasks.length > 0 ? (
              dayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed at {format(new Date(task.updated_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No completed tasks for this day
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickStats;
