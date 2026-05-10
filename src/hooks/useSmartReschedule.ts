import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { callAIGateway } from "@/lib/aiGateway";
import type { AITask } from "@/lib/aiGateway";
import { addMinutes, parseISO } from "date-fns";

export interface RescheduledTask {
  task_id: string;
  task_title: string;
  new_date: string;
  new_time: string;
  priority?: string;
  reason?: string;
}

export interface SmartRescheduleResult {
  rescheduled: RescheduledTask[];
  summary: string;
}

export const useSmartReschedule = () => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const smartReschedule = async (): Promise<SmartRescheduleResult | null> => {
    setIsRescheduling(true);

    try {
      // 1. Fetch incomplete / overdue tasks from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized: Please log in to reschedule tasks.");
      const currentUserId = session.user.id;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, priority, duration_minutes, deadline, flexible')
        .eq('user_id', currentUserId)
        .eq('completed', false)
        .order('priority', { ascending: true })
        .limit(10);

      if (tasksError) {
        throw new Error(`Failed to load tasks: ${tasksError.message}`);
      }

      if (!tasksData || tasksData.length === 0) {
        toast({
          title: "Nothing to reschedule",
          description: "No incomplete tasks to reschedule.",
        });
        return { rescheduled: [], summary: "No incomplete tasks found." };
      }

      const incompleteTasks: AITask[] = tasksData.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        duration_minutes: t.duration_minutes,
        deadline: t.deadline,
        flexible: t.flexible,
        completed: false,
      }));

      // 2. Call the AI Gateway with smart-reschedule mode
      const response = await callAIGateway({
        mode: "smart-reschedule",
        tasks: incompleteTasks,
        metadata: {
          currentDate: new Date().toISOString(),
        },
      });

      // Log raw response before any parsing so errors are visible in DevTools
      console.log("[useSmartReschedule] raw ai-gateway response:", response);

      // 3. Extract rescheduled tasks from parsed response
      let rescheduled: RescheduledTask[] = [];
      // Guard against undefined content (unexpected response shape)
      let summary: string = response?.content ?? "";

      try {
        if (response?.parsed && typeof response.parsed === "object") {
          const parsed = response.parsed as {
            rescheduled?: unknown;
            summary?: unknown;
          };
          const rawList = parsed.rescheduled;
          if (Array.isArray(rawList)) {
            // Validate each item has minimum required shape
            rescheduled = rawList.filter(
              (t): t is RescheduledTask =>
                t !== null &&
                typeof t === "object" &&
                typeof (t as RescheduledTask).task_title === "string" &&
                typeof (t as RescheduledTask).new_date === "string"
            );
          }
          summary =
            typeof parsed.summary === "string" ? parsed.summary : summary;
        } else if (typeof response?.content === "string" && response.content.trim()) {
          // Fallback: try to parse raw content
          const jsonString = response.content
            .replace(/```json\n?|\n?```/g, "")
            .trim();
          const fallback = JSON.parse(jsonString) as {
            rescheduled?: unknown;
            summary?: string;
          };
          const rawList = fallback.rescheduled;
          if (Array.isArray(rawList)) {
            rescheduled = rawList.filter(
              (t): t is RescheduledTask =>
                t !== null &&
                typeof t === "object" &&
                typeof (t as RescheduledTask).task_title === "string" &&
                typeof (t as RescheduledTask).new_date === "string"
            );
          }
          summary = fallback.summary ?? summary;
        }
      } catch (parseError) {
        console.warn(
          "[useSmartReschedule] Could not parse AI response, using content as summary.",
          parseError
        );
        summary = response?.content ?? "Reschedule complete.";
      }

      // 4. Apply rescheduled dates back to Supabase
      if (rescheduled.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Unauthorized: Please log in to reschedule tasks.");

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const operations = rescheduled.map(async (task) => {
          // Combine date and time
          const dateStr = task.new_date.includes('T') ? task.new_date.split('T')[0] : task.new_date;
          const timeStr = task.new_time || "09:00:00";
          const isoDeadline = `${dateStr}T${timeStr.includes(':') ? (timeStr.split(':').length === 2 ? timeStr + ":00" : timeStr) : "09:00:00"}`;
          
          const isUuid = task.task_id && uuidRegex.test(task.task_id);
          
          // 1. Update Tasks table
          let updateQuery = supabase.from("tasks").update({ deadline: isoDeadline });
          
          if (isUuid) {
            updateQuery = updateQuery.eq("id", task.task_id);
          } else {
            updateQuery = updateQuery.eq("user_id", session.user.id).eq("title", task.task_title);
          }
          
          const { error: taskError } = await updateQuery;
          if (taskError) throw taskError;

          // 2. Insert into Events table
          const startTime = parseISO(isoDeadline);
          const endTime = addMinutes(startTime, 60);

          const { error: eventError } = await supabase.from("events").insert({
            user_id: session.user.id,
            task_id: isUuid ? task.task_id : null,
            title: task.task_title,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'scheduled'
          });

          if (eventError) throw eventError;
        });

        await Promise.all(operations);

        // Refresh lists
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });

        toast({
          title: "Smart Reschedule Complete",
          description: summary || `Rescheduled ${rescheduled.length} task(s) and updated your calendar.`,
        });
      } else {
        toast({
          title: "No changes made",
          description: summary || "The AI found no tasks that needed rescheduling.",
        });
      }

      return { rescheduled, summary };
    } catch (error) {
      console.error("Smart reschedule error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to reschedule tasks";

      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        toast({
          title: "Rate limit exceeded",
          description: "Please wait a moment and try again.",
          variant: "destructive",
        });
      } else if (
        errorMessage.includes("402") ||
        errorMessage.includes("credits")
      ) {
        toast({
          title: "AI credits exhausted",
          description: "Please add credits to continue using AI features.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reschedule failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return null;
    } finally {
      setIsRescheduling(false);
    }
  };

  return { smartReschedule, isRescheduling };
};
