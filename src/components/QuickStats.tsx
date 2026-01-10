import { useState } from "react";
import { CheckCircle2, Clock, Target, Zap, TrendingUp, X } from "lucide-react";
import { useQuickStats } from "@/hooks/useQuickStats";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHaptic } from "@/hooks/useHaptic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QuickStats = () => {
  const { data: stats, isLoading } = useQuickStats();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyProgress();
  const { vibrate } = useHaptic();
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch tasks for selected date
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

  const handleWeeklyCardClick = () => {
    vibrate("light");
    setShowWeeklyChart(true);
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
      clickable: false,
    },
    {
      icon: Clock,
      label: "Focus Time",
      value: `${stats?.focusHours || "0"}h`,
      subtext: "deep work",
      color: "text-cosmic-silver",
      bgColor: "bg-cosmic-silver/10",
      clickable: false,
    },
    {
      icon: Target,
      label: "Streak",
      value: stats?.streak.toString() || "0",
      subtext: "days",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      clickable: false,
    },
    {
      icon: Zap,
      label: "Efficiency",
      value: `${stats?.efficiency || 0}%`,
      subtext: "this week",
      color: "text-cosmic-teal",
      bgColor: "bg-cosmic-teal/10",
      clickable: true,
      onClick: handleWeeklyCardClick,
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
          <div
            key={stat.label}
            onClick={stat.clickable ? stat.onClick : undefined}
            className={`glass rounded-xl p-4 animate-fade-in transition-all duration-300 ${
              stat.clickable 
                ? "cursor-pointer hover:border-cosmic-teal/50 hover:glow-teal active:scale-[0.98]" 
                : "hover:border-cosmic-silver/30"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.clickable && (
                <TrendingUp className="w-4 h-4 text-cosmic-teal/50" />
              )}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-display font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.subtext}
                {stat.clickable && <span className="text-cosmic-teal/70 ml-1">• tap to view</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cinematic Weekly Chart Overlay */}
      <AnimatePresence>
        {showWeeklyChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWeeklyChart(false)}
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Chart Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass rounded-2xl p-6 border border-cosmic-teal/30 glow-teal"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowWeeklyChart(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-cosmic-teal/20 p-2.5 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-cosmic-teal" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      Weekly Progress
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {totalCompleted} task{totalCompleted !== 1 ? "s" : ""} completed
                    </p>
                  </div>
                </div>

                {/* Efficiency Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmic-teal/20 border border-cosmic-teal/30"
                >
                  <Zap className="w-4 h-4 text-cosmic-teal" />
                  <span className="font-display text-2xl font-bold text-cosmic-teal">
                    {stats?.efficiency || 0}%
                  </span>
                  <span className="text-sm text-muted-foreground">efficiency</span>
                </motion.div>
              </motion.div>

              {/* Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="h-48"
              >
                {weeklyLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        allowDecimals={false}
                        domain={[0, Math.max(maxValue, 3)]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass rounded-lg px-3 py-2 border border-border/50">
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(data.date), "EEEE, MMM d")}
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {data.completed} task{data.completed !== 1 ? "s" : ""}
                                </p>
                                {data.completed > 0 && (
                                  <p className="text-xs text-cosmic-teal mt-1">Click to view</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="completed" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                        cursor="pointer"
                        onClick={(data) => handleBarClick(data)}
                      >
                        {weeklyData?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={isToday(parseISO(entry.date)) 
                              ? 'hsl(var(--cosmic-teal))' 
                              : 'hsl(var(--cosmic-silver) / 0.6)'
                            }
                            className="hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-center text-muted-foreground mt-4"
              >
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
