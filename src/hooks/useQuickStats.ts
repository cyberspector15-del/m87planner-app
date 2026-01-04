import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from "date-fns";

export const useQuickStats = () => {
  return useQuery({
    queryKey: ["quick-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

      // Tasks completed today
      const { count: completedToday } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", todayStart)
        .lte("updated_at", todayEnd);

      // Focus time today (sum of event durations)
      const { data: todayEvents } = await supabase
        .from("events")
        .select("start_time, end_time")
        .eq("user_id", user.id)
        .gte("start_time", todayStart)
        .lte("end_time", todayEnd);

      const focusMinutes = todayEvents?.reduce((total, event) => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        return total + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0) || 0;

      const focusHours = (focusMinutes / 60).toFixed(1);

      // Calculate streak (consecutive days with completed tasks)
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = subDays(today, i);
        const dayStart = startOfDay(checkDate).toISOString();
        const dayEnd = endOfDay(checkDate).toISOString();

        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", dayStart)
          .lte("updated_at", dayEnd);

        if (count && count > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // Efficiency this week (completed / total tasks)
      const { count: weekTotal } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd);

      const { count: weekCompleted } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", weekStart)
        .lte("updated_at", weekEnd);

      const efficiency = weekTotal && weekTotal > 0 
        ? Math.round((weekCompleted || 0) / weekTotal * 100) 
        : 0;

      return {
        completedToday: completedToday || 0,
        focusHours,
        streak,
        efficiency,
      };
    },
  });
};
