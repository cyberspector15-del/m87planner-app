import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAIUsage } from "@/hooks/useAIUsage";

interface NLPResult {
  action: string;
  message: string;
  created: {
    tasks: any[];
    routines: any[];
  };
}

export const useNLPParse = () => {
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tryIncrementUsage } = useAIUsage();

  const parseCommand = async (input: string, skipUsageCheck = false): Promise<{ result: NLPResult | null; limitReached?: boolean }> => {
    if (!input.trim()) {
      toast({
        title: "Empty command",
        description: "Please enter a command.",
        variant: "destructive",
      });
      return { result: null };
    }

    // Check usage limits (unless skipped for onboarding)
    if (!skipUsageCheck) {
      const incrementResult = await tryIncrementUsage();
      if (incrementResult && !incrementResult.allowed) {
        return { result: null, limitReached: true };
      }
    }

    setIsParsing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to use AI commands.",
          variant: "destructive",
        });
        return { result: null };
      }

      const response = await supabase.functions.invoke("nlp-parse", {
        body: { input },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as NLPResult;

      if (result.action === "unknown") {
        toast({
          title: "Command not understood",
          description: "Please try rephrasing your command.",
          variant: "destructive",
        });
        return { result };
      }

      if (result.action === "plan_day") {
        toast({
          title: "Planning your day",
          description: "Use the Auto Plan button to schedule your tasks.",
        });
        return { result };
      }

      const tasksCreated = result.created?.tasks?.length || 0;
      const routinesCreated = result.created?.routines?.length || 0;

      if (tasksCreated > 0 || routinesCreated > 0) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["routines"] });

        toast({
          title: "Success",
          description: result.message || `Created ${tasksCreated} task(s) and ${routinesCreated} routine(s).`,
        });
      } else {
        toast({
          title: "Processed",
          description: result.message,
        });
      }

      return { result };
    } catch (error) {
      console.error("NLP parse error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process command";
      
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
          title: "Command failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return { result: null };
    } finally {
      setIsParsing(false);
    }
  };

  return { parseCommand, isParsing };
};
