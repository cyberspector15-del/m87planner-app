import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAIUsage } from "@/hooks/useAIUsage";
import type { AIMessage, ConversationalTurnResult } from "@/services/ai/types";

export const useConversationalAI = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tryIncrementUsage, status } = useAIUsage();

  const sendMessage = useCallback(async (input: string): Promise<ConversationalTurnResult | null> => {
    if (!input.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return null;
    }

    // Check if conversation mode is allowed (Pro only)
    if (!status.canUseConversationMode) {
      toast({
        title: "Pro feature",
        description: "Conversational AI is available in M87 Pro.",
      });
      return null;
    }

    // Check usage limits
    const incrementResult = await tryIncrementUsage();
    if (!incrementResult?.allowed) {
      toast({
        title: "Daily limit reached",
        description: "You've used all your AI commands for today.",
      });
      return null;
    }

    setIsProcessing(true);

    // Add user message to history
    const userMessage: AIMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);

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

      const response = await supabase.functions.invoke("ai-conversation", {
        body: { 
          messages: messages,
          input 
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ConversationalTurnResult;

      // Add assistant response to history
      const assistantMessage: AIMessage = { role: "assistant", content: result.response };
      setMessages(prev => [...prev, assistantMessage]);

      // If the conversation is complete and actions were taken
      if (result.isComplete && result.created) {
        const tasksCreated = result.created.tasks?.length || 0;
        const routinesCreated = result.created.routines?.length || 0;

        if (tasksCreated > 0 || routinesCreated > 0) {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["routines"] });

          toast({
            title: "Success",
            description: `Created ${tasksCreated} task(s) and ${routinesCreated} routine(s).`,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Conversational AI error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process message";
      
      toast({
        title: "AI error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [messages, status.canUseConversationMode, tryIncrementUsage, toast, queryClient]);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearConversation,
  };
};
