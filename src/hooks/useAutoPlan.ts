import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ScheduledEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

interface AutoPlanResult {
  message: string;
  scheduled: ScheduledEvent[];
}

export const useAutoPlan = () => {
  const [isPlanning, setIsPlanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autoPlan = async (date: Date): Promise<AutoPlanResult | null> => {
    setIsPlanning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to use Auto-Plan.",
          variant: "destructive",
        });
        return null;
      }

      const response = await supabase.functions.invoke("auto-plan", {
        body: { date: date.toISOString() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as AutoPlanResult;

      if (result.scheduled && result.scheduled.length > 0) {
        toast({
          title: "Auto-Plan Complete",
          description: result.message,
        });

        // Invalidate events to refresh timeline
        queryClient.invalidateQueries({ queryKey: ["events"] });
      } else {
        toast({
          title: "No tasks scheduled",
          description: result.message || "No available tasks to schedule.",
        });
      }

      return result;
    } catch (error) {
      console.error("Auto-plan error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to auto-plan";
      
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        toast({
          title: "Rate limit exceeded",
          description: "Please wait a moment and try again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("402") || errorMessage.includes("credits")) {
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