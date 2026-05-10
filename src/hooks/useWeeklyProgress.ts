import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export interface DayProgress {
  day: string;
  shortDay: string;
  completed: number;
  date: string;
}

export const useWeeklyProgress = () => {
  return useQuery({
    queryKey: ["weekly-progress"],
    queryFn: async (): Promise<DayProgress[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const today = new Date();
      const days: DayProgress[] = [];

      // Get tasks completed in the last 7 days
      const weekStart = startOfDay(subDays(today, 6)).toISOString();
      const weekEnd = endOfDay(today).toISOString();

      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("updated_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", weekStart)
        .lte("updated_at", weekEnd);

      // Group by day
      const tasksByDay = new Map<string, number>();
      completedTasks?.forEach((task) => {
        const dayKey = format(new Date(task.updated_at), "yyyy-MM-dd");
        tasksByDay.set(dayKey, (tasksByDay.get(dayKey) || 0) + 1);
      });

      // Build array for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateKey = format(date, "yyyy-MM-dd");
        days.push({
          day: format(date, "EEE"),
          shortDay: format(date, "EEEEE"),
          completed: tasksByDay.get(dateKey) || 0,
          date: dateKey,
        });
      }

      return days;
    },
    refetchInterval: 60000,
  });
};
