import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

const WeeklyProgressChart = () => {
  const { data: weeklyData, isLoading } = useWeeklyProgress();
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

  const handleBarClick = (data: { date: string }) => {
    setSelectedDate(data.date);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalCompleted = weeklyData?.reduce((sum, day) => sum + day.completed, 0) || 0;
  const maxValue = Math.max(...(weeklyData?.map(d => d.completed) || [0]), 1);

  return (
    <>
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cosmic-teal" />
              Weekly Progress
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCompleted} task{totalCompleted !== 1 ? "s" : ""} completed this week
            </p>
          </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                cursor="pointer"
                onClick={(data) => data.completed > 0 && handleBarClick(data)}
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
        </div>
      </div>

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

export default WeeklyProgressChart;
