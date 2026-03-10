import { useState, useCallback } from "react";
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
  // Conversational mode fields
  needsMoreInfo?: boolean;
  followUpQuestion?: string;
}

export const useNLPParse = () => {
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    checkAndIncrementUsage,
    isLimitReached,
    used,
    limit,
    conversationModeEnabled,
    isPro
  } = useAIUsage();

  const parseCommand = useCallback(async (
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

    // Check if limit is already reached before making the call
    if (isLimitReached) {
      return {
        action: "limit_reached",
        message: `You've used all ${limit} AI commands today.`,
        created: { tasks: [], routines: [] },
      };
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
        return null;
      }

      // Check and increment usage before making the AI call
      const usageResult = await checkAndIncrementUsage();

      if (!usageResult.allowed) {
        return {
          action: "limit_reached",
          message: `You've used all ${limit} AI commands today.`,
          created: { tasks: [], routines: [] },
        };
      }

      // Determine mode to use
      const mode = conversationModeEnabled && isPro ? "conversational" : "silent";

      // Use the new AI Gateway
      const response = await supabase.functions.invoke("ai-gateway", {
        body: {
          userId: session.user.id,
          mode,
          messages: [
            ...(conversationContext?.messages || []),
            { role: "user", content: input }
          ],
          metadata: {
            type: "nlp-parse",
            isPro,
          }
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiResponseText = response.data.content;

      // Parse the JSON content from the AI response
      let result: NLPResult;
      try {
        // Clean up markdown code blocks if present
        const jsonString = aiResponseText.replace(/```json\n?|\n?```/g, "").trim();
        result = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        return {
          action: "unknown",
          message: "I couldn't understand that response. Please try again.",
          created: { tasks: [], routines: [] }
        };
      }

      if (result.action === "unknown") {
        toast({
          title: "Command not understood",
          description: "Please try rephrasing your command.",
          variant: "destructive",
        });
        return result;
      }

      // Handle conversational mode - AI needs more info
      if (result.needsMoreInfo && result.followUpQuestion) {
        // Don't show a toast - the UI will handle the follow-up question
        return result;
      }

      if (result.action === "plan_day") {
        toast({
          title: "Planning your day",
          description: "Use the Auto Plan button to schedule your tasks.",
        });
        return result;
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

      return result;
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

      return null;
    } finally {
      setIsParsing(false);
    }
  }, [toast, queryClient, checkAndIncrementUsage, isLimitReached, limit, conversationModeEnabled, isPro]);

  return {
    parseCommand,
    isParsing,
    isLimitReached,
    used,
    limit,
  };
};
