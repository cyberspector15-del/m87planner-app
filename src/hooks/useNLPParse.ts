import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { callAIGateway, AIMessage } from "@/lib/aiGateway";
import { addMinutes, parseISO, format } from "date-fns";

interface NLPResult {
  action: string;
  message: string;
  data?: {
    tasks?: Array<{
      title?: string;
      priority?: string;
      duration_minutes?: number;
      scheduled_for?: string;
    }>;
    routines?: Array<{
      title?: string;
      frequency?: string;
      time_of_day?: string;
    }>;
    suggestion?: string;
  };
  needsMoreInfo?: boolean;
  followUpQuestion?: string;
}

const parseScheduledFor = (value: string | undefined): string | null => {
  if (!value) return null;
  if (value === 'now' || value === 'today') {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    // fallback: schedule for 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }
  return parsed.toISOString();
};

export const useNLPParse = () => {
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const conversationModeEnabled = false; // Or fetch from context if needed, but removing useAIUsage for now

  const parseCommand = useCallback(
    async (
      input: string,
      conversationContext?: { messages: Array<{ role: string; content: string }> }
    ): Promise<NLPResult | null> => {
      if (!input.trim()) {
        toast({
          title: "Empty command",
          description: "Please enter a command.",
          variant: "destructive",
        });
        return null;
      }

      setIsParsing(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          toast({
            title: "Not authenticated",
            description: "Please sign in to use AI commands.",
            variant: "destructive",
          });
          return null;
        }


        const messages: AIMessage[] = [
          ...(conversationContext?.messages.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })) ?? []),
          { role: "user" as const, content: input },
        ];

        const mode = conversationModeEnabled ? "conversation" : "ai-command";
        console.log("calling ai gateway (ai-command)...");
        const response = await callAIGateway({ mode, messages });
        console.log("gateway response:", response);

        const aiResponseText: string = response?.content ?? "";

        let result: NLPResult;

        if (response?.parsed && typeof response.parsed === "object") {
          try {
            const raw = response.parsed as Partial<NLPResult>;
            result = {
              action: typeof raw.action === "string" ? raw.action : "unknown",
              message: typeof raw.message === "string" ? raw.message : aiResponseText || "Done.",
              data: raw.data,
              needsMoreInfo: raw.needsMoreInfo,
              followUpQuestion: raw.followUpQuestion,
            };
          } catch (castError) {
            console.warn("[useNLPParse] Failed to cast parsed response:", castError);
            result = {
              action: "unknown",
              message: aiResponseText || "Received an unexpected response. Please try again.",
            };
          }
        } else {
          try {
            const jsonString = aiResponseText.replace(/```json\n?|\n?```/g, "").trim();
            result = JSON.parse(jsonString);
          } catch {
            if (conversationModeEnabled) {
              result = { action: "conversation", message: aiResponseText };
            } else {
              result = { action: "unknown", message: "I couldn't understand that response. Please try again." };
            }
          }
        }

        if (result.action === "unknown") {
          toast({
            title: "Command not understood",
            description: "Please try rephrasing your command.",
            variant: "destructive",
          });
          return result;
        }

        if (result.needsMoreInfo && result.followUpQuestion) {
          return result;
        }

        if (result.action === "plan_day") {
          toast({
            title: "Planning your day",
            description: "Use the Auto Plan button to schedule your tasks.",
          });
          return result;
        }

        // Execute DB inserts based on action
        try {
          const tasksToInsert = result.data?.tasks || [];
          const routinesToInsert = result.data?.routines || [];

          const mapPriority = (p?: string): number => {
            if (!p) return 2;
            const lowP = p.toLowerCase();
            if (lowP.includes("high")) return 1;
            if (lowP.includes("low")) return 3;
            return 2;
          };

          if (result.action === "create_task" || result.action === "schedule") {
            for (const t of tasksToInsert) {
              const priority = mapPriority(t.priority);
              const duration = t.duration_minutes || 30;
              const deadline = parseScheduledFor(t.scheduled_for);

              // 1. Insert into tasks table
              const { data: newTask, error: taskError } = await supabase
                .from("tasks")
                .insert({
                  title: t.title || "Untitled Task",
                  priority,
                  duration_minutes: duration,
                  deadline: deadline,
                  user_id: session.user.id,
                  completed: false,
                  flexible: !deadline,
                })
                .select()
                .single();

              if (taskError) throw taskError;

              // 2. If scheduled, also insert into events table
              if (deadline && newTask) {
                const startTime = parseISO(deadline);
                const endTime = addMinutes(startTime, duration);

                const { error: eventError } = await supabase.from("events").insert({
                  title: t.title || "Untitled Task",
                  start_time: startTime.toISOString(),
                  end_time: endTime.toISOString(),
                  user_id: session.user.id,
                  task_id: newTask.id,
                  status: "scheduled",
                });

                if (eventError) throw eventError;
              }
            }
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["events"] });
          } else if (result.action === "create_routine") {
            for (const r of routinesToInsert) {
              const frequency = ["daily", "weekly", "weekdays", "weekends"].includes(
                r.frequency?.toLowerCase() || ""
              )
                ? (r.frequency!.toLowerCase() as any)
                : "daily";

              const duration = r.duration_minutes || 30;
              
              // Handle time_of_day (AI might return HH:mm or HH:mm:ss)
              let windowStart = r.time_of_day || "09:00:00";
              if (windowStart.split(":").length === 2) windowStart += ":00";

              // Calculate window_end
              const dummyDate = new Date();
              const [h, m, s] = windowStart.split(":").map(Number);
              dummyDate.setHours(h, m, s || 0);
              const endDate = addMinutes(dummyDate, duration);
              const windowEnd = format(endDate, "HH:mm:ss");

              const { error: routineError } = await supabase.from("routines").insert({
                title: r.title || "Untitled Routine",
                frequency,
                window_start: windowStart,
                window_end: windowEnd,
                target_duration_minutes: duration,
                user_id: session.user.id,
                active: true,
              });

              if (routineError) throw routineError;
            }
            queryClient.invalidateQueries({ queryKey: ["routines"] });
          } else if (result.action === "reschedule") {
            let hasChanges = false;
            for (const task of tasksToInsert) {
              if (!task.title) continue;
              
              const { data: existing, error: fetchError } = await supabase
                .from("tasks")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("title", task.title)
                .limit(1)
                .maybeSingle();

              if (fetchError) throw fetchError;

              const priority = mapPriority(task.priority);
              const duration = task.duration_minutes || 30;
              const deadline = task.scheduled_for ? task.scheduled_for : null;

              const taskPayload = {
                title: task.title,
                priority,
                duration_minutes: duration,
                deadline: deadline,
                flexible: !deadline,
              };

              if (existing) {
                const { error } = await supabase.from("tasks").update(taskPayload).eq("id", existing.id);
                if (error) throw error;
              } else {
                const { error } = await supabase.from("tasks").insert({ ...taskPayload, user_id: session.user.id, completed: false });
                if (error) throw error;
              }
              hasChanges = true;
            }
            if (hasChanges) {
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
            }
          }

          // Show success notifications
          if (["create_task", "schedule", "create_routine", "reschedule"].includes(result.action)) {
            toast({
              title: "Success",
              description: result.message || "Action completed successfully.",
            });
          } else {
            // For query, message, conversation, etc.
            toast({
              title: "Processed",
              description: result.message || aiResponseText,
            });
          }

        } catch (dbError) {
          console.error("Database operation failed:", dbError);
          const msg = dbError instanceof Error ? dbError.message : "Database operation failed.";
          toast({
            title: "Database Error",
            description: msg,
            variant: "destructive",
          });
          // Do not return null so that the UI doesn't break, but the action wasn't persisted.
          return {
            ...result,
            message: `Error saving: ${msg}`,
          };
        }

        return result;

      } catch (error) {
        console.error("NLP parse error:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to process command";

        if (
          errorMessage.includes("429") ||
          errorMessage.includes("Rate limit")
        ) {
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
            title: "Command failed",
            description: errorMessage,
            variant: "destructive",
          });
        }

        return null;
      } finally {
        setIsParsing(false);
      }
    },
    [
      toast,
      queryClient,
    ]
  );

  return {
    parseCommand,
    isParsing,
  };
};
