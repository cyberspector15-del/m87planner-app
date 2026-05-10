import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { callAIGateway } from "@/lib/aiGateway";
import type { AITask } from "@/lib/aiGateway";

export interface ScheduledEvent {
  id?: string;
  task_id?: string;
  title?: string;
  task_title?: string;
  start_time: string;
  end_time: string;
  reason?: string;
  reasoning?: string;
}

export interface AutoPlanResult {
  message: string;
  scheduled: ScheduledEvent[];
  summary?: string;
}

export const useAutoPlan = () => {
  const [isPlanning, setIsPlanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autoPlan = async (date: Date): Promise<AutoPlanResult | null> => {
    setIsPlanning(true);

    try {
      // 1. Fetch the user's tasks from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized: Please log in to use Auto-Plan.");
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
          title: "No tasks to schedule",
          description: "No tasks found to schedule.",
        });
        return { message: "No tasks found to schedule.", scheduled: [] };
      }

      const tasks: AITask[] = tasksData.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        duration_minutes: t.duration_minutes,
        deadline: t.deadline,
        flexible: t.flexible,
        completed: false,
      }));

      // 2. Call the AI Gateway with auto-scheduler mode
      const response = await callAIGateway({
        mode: "auto-scheduler",
        tasks,
        metadata: {
          targetDate: date.toISOString(),
          targetDateLabel: date.toDateString(),
        },
      });

      // Log raw response before any parsing so errors are visible in DevTools
      console.log("[useAutoPlan] raw ai-gateway response:", response);

      // 3. Extract scheduled_blocks from parsed response
      let scheduled: ScheduledEvent[] = [];
      let summary = "";
      // Guard against undefined content (unexpected response shape)
      let message: string = response?.content ?? "";

      try {
        if (response?.parsed && typeof response.parsed === "object") {
          const parsed = response.parsed as {
            scheduled_blocks?: unknown;
            scheduled?: unknown;
            summary?: unknown;
            message?: unknown;
          };

          const rawBlocks = parsed.scheduled_blocks ?? parsed.scheduled;
          if (Array.isArray(rawBlocks)) {
            // Validate each block has minimum required shape before storing
            scheduled = rawBlocks.filter(
              (b): b is ScheduledEvent =>
                b !== null &&
                typeof b === "object" &&
                typeof (b as ScheduledEvent).title === "string"
            );
          }
          summary = typeof parsed.summary === "string" ? parsed.summary : "";
          message = typeof parsed.message === "string" ? parsed.message : message;
        } else if (typeof response?.content === "string" && response.content.trim()) {
          // Fallback: try parsing the raw content string
          const jsonString = response.content
            .replace(/```json\n?|\n?```/g, "")
            .trim();
          const fallback = JSON.parse(jsonString) as {
            scheduled_blocks?: unknown;
            scheduled?: unknown;
            summary?: string;
            message?: string;
          };
          const rawBlocks = fallback.scheduled_blocks ?? fallback.scheduled;
          if (Array.isArray(rawBlocks)) {
            scheduled = rawBlocks.filter(
              (b): b is ScheduledEvent =>
                b !== null &&
                typeof b === "object" &&
                typeof (b as ScheduledEvent).title === "string"
            );
          }
          summary = fallback.summary ?? "";
          message = fallback.message ?? message;
        }
      } catch (parseError) {
        console.warn("[useAutoPlan] Could not parse AI response, using content as summary.", parseError);
        // Response wasn't JSON — treat content as the summary message
        summary = response?.content ?? "AI scheduling complete.";
      }

      if (scheduled.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Unauthorized: Please log in to save your schedule.");

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // Perform parallel insertions
        await Promise.all(
          scheduled.map(async (block) => {
            const taskId = block.task_id && uuidRegex.test(block.task_id) ? block.task_id : null;
            const title = block.task_title || block.title || "Scheduled Task";
            
            const { error: insertError } = await supabase.from("events").insert({
              user_id: session.user.id,
              task_id: taskId,
              title: title,
              start_time: block.start_time,
              end_time: block.end_time,
              status: "scheduled",
            });

            if (insertError) {
              console.error(`Error inserting block "${title}":`, insertError);
              throw insertError;
            }
          })
        );

        toast({
          title: "Auto-Plan Complete",
          description: summary || message || `Your day is ready with ${scheduled.length} blocks.`,
        });
        
        // Refresh UI
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      } else {
        toast({
          title: "No tasks scheduled",
          description: summary || message || "No available time slots found.",
        });
      }

      return { message: message || summary, scheduled, summary };
    } catch (error) {
      console.error("Auto-plan error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to auto-plan";

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
          title: "Auto-Plan failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return null;
    } finally {
      setIsPlanning(false);
    }
  };

  return { autoPlan, isPlanning };
};