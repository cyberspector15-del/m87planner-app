import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AIUsageStatus {
  used: number;
  limit: number;
  remaining: number;
  tier: "free" | "pro";
  conversationModeEnabled: boolean;
  canUseConversationMode: boolean;
}

interface AIUsageResponse {
  used: number;
  limit: number;
  remaining: number;
  tier: string;
  conversationModeEnabled: boolean;
  canUseConversationMode: boolean;
}

interface AIIncrementResponse {
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
  remaining: number;
}

const defaultStatus: AIUsageStatus = {
  used: 0,
  limit: 3,
  remaining: 3,
  tier: "free",
  conversationModeEnabled: false,
  canUseConversationMode: false,
};

export const useAIUsage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AIUsageStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(defaultStatus);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_ai_usage_status", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data) {
        const response = data as unknown as AIUsageResponse;
        setStatus({
          used: response.used || 0,
          limit: response.limit || 3,
          remaining: response.remaining || 0,
          tier: (response.tier as "free" | "pro") || "free",
          conversationModeEnabled: response.conversationModeEnabled || false,
          canUseConversationMode: response.canUseConversationMode || false,
        });
      }
    } catch (error) {
      console.error("Error fetching AI usage status:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const checkAndIncrementUsage = useCallback(async (): Promise<{ allowed: boolean; remaining: number }> => {
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    try {
      const { data, error } = await supabase.rpc("increment_ai_usage", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data) {
        const response = data as unknown as AIIncrementResponse;
        // Update local status
        setStatus(prev => ({
          ...prev,
          used: response.used || prev.used + 1,
          remaining: response.remaining || 0,
        }));

        return {
          allowed: response.allowed ?? false,
          remaining: response.remaining ?? 0,
        };
      }

      return { allowed: false, remaining: 0 };
    } catch (error) {
      console.error("Error incrementing AI usage:", error);
      return { allowed: false, remaining: 0 };
    }
  }, [user]);

  const toggleConversationMode = useCallback(async () => {
    if (!user || !status.canUseConversationMode) return;

    const newValue = !status.conversationModeEnabled;
    
    // Optimistic update
    setStatus(prev => ({ ...prev, conversationModeEnabled: newValue }));

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          conversation_mode_enabled: newValue,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling conversation mode:", error);
      // Revert on error
      setStatus(prev => ({ ...prev, conversationModeEnabled: !newValue }));
    }
  }, [user, status.conversationModeEnabled, status.canUseConversationMode]);

  return {
    ...status,
    loading,
    refetch: fetchStatus,
    checkAndIncrementUsage,
    toggleConversationMode,
    isPro: status.tier === "pro",
    isLimitReached: status.remaining <= 0,
  };
};
