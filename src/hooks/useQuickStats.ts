import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";
import { useEffect } from "react";

export const useQuickStats = () => {
  const queryClient = useQueryClient();

  // Subscribe to task changes to invalidate stats
  useEffect(() => {
    const channel = supabase
      .channel("quick-stats-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quick-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quick-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quick-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["quick-stats"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const today = new Date();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayISO = startOfToday.toISOString();

      const todayEnd = endOfDay(today).toISOString();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const thirtyDaysAgo = subDays(today, 30).toISOString();

      // Fetch all data in parallel for efficiency
      const [
        completedTodayResult,
        allCompletedTasksResult,
        weekTotalResult,
        weekCompletedResult,
        todaySessionsResult,
      ] = await Promise.all([
        // Tasks completed today
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", startOfTodayISO)
          .lte("updated_at", todayEnd),
        
        // All completed tasks in last 30 days for streak calculation
        supabase
          .from("tasks")
          .select("updated_at")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", thirtyDaysAgo)
          .lte("updated_at", todayEnd),
        
        // Total tasks this week
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", weekStart)
          .lte("created_at", weekEnd),
        
        // Completed tasks this week
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", weekStart)
          .lte("updated_at", weekEnd),

        // Focus sessions today
        supabase
          .from("focus_sessions")
          .select("focus_minutes_completed, created_at, user_id")
          .eq("user_id", user.id)
          .gt("focus_minutes_completed", 0)
          .gte("created_at", startOfTodayISO),
      ]);

      // Calculate focus time from focus_sessions
      const totalMinutes = todaySessionsResult.data?.reduce((sum, session) => {
        return sum + (session.focus_minutes_completed || 0);
      }, 0) ?? 0;


      const focusHours = (totalMinutes / 60).toFixed(1);

      // Calculate streak from completed tasks data
      let streak = 0;
      if (allCompletedTasksResult.data && allCompletedTasksResult.data.length > 0) {
        // Group tasks by day
        const completedDays = new Set<string>();
        allCompletedTasksResult.data.forEach((task) => {
          const day = startOfDay(new Date(task.updated_at)).toISOString();
          completedDays.add(day);
        });

        // Count consecutive days from today
        for (let i = 0; i < 30; i++) {
          const checkDay = startOfDay(subDays(today, i)).toISOString();
          if (completedDays.has(checkDay)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      // Calculate efficiency
      const weekTotal = weekTotalResult.count || 0;
      const weekCompleted = weekCompletedResult.count || 0;
      const efficiency = weekTotal > 0 
        ? Math.round((weekCompleted / weekTotal) * 100) 
        : 0;

      return {
        completedToday: completedTodayResult.count || 0,
        focusHours,
        streak,
        efficiency,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
