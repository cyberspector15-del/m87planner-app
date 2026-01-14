import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AIUsageStatus, AIIncrementResult, SubscriptionTier } from "@/services/ai/types";

const STORAGE_KEY = "m87-ai-usage";
const DEFAULT_STATUS: AIUsageStatus = {
  used: 0,
  limit: 3,
  tier: "free",
  remaining: 3,
  conversationModeEnabled: false,
  canUseConversationMode: false,
};

export const useAIUsage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AIUsageStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);

  // Get initial status from localStorage for instant load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if the stored date is today
        if (parsed.date === new Date().toISOString().split("T")[0]) {
          setStatus(parsed.status);
        }
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Fetch status from database
  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(DEFAULT_STATUS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_ai_usage_status", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const jsonData = data as Record<string, unknown>;
        const newStatus: AIUsageStatus = {
          used: (jsonData.used as number) || 0,
          limit: (jsonData.limit as number) || 3,
          tier: (jsonData.tier as SubscriptionTier) || "free",
          remaining: (jsonData.remaining as number) || 3,
          conversationModeEnabled: (jsonData.conversationModeEnabled as boolean) || false,
          canUseConversationMode: (jsonData.canUseConversationMode as boolean) || false,
        };
        setStatus(newStatus);
        
        // Cache in localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          status: newStatus,
        }));
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

  // Check if command is allowed (without incrementing)
  const canExecuteCommand = useCallback((): boolean => {
    return status.remaining > 0;
  }, [status.remaining]);

  // Check if conversation mode can be used
  const canUseConversationMode = useCallback((): boolean => {
    return status.canUseConversationMode;
  }, [status.canUseConversationMode]);

  // Increment usage and check if allowed
  const tryIncrementUsage = useCallback(async (): Promise<AIIncrementResult | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("increment_ai_usage", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error("Invalid response from increment_ai_usage");
      }

      const jsonData = data as Record<string, unknown>;
      const result: AIIncrementResult = {
        allowed: (jsonData.allowed as boolean) || false,
        used: (jsonData.used as number) || 0,
        limit: (jsonData.limit as number) || 3,
        tier: (jsonData.tier as SubscriptionTier) || "free",
        remaining: (jsonData.remaining as number) || 0,
      };

      // Update local status
      setStatus((prev) => ({
        ...prev,
        used: result.used,
        remaining: result.remaining,
        tier: result.tier,
        limit: result.limit,
      }));

      // Update localStorage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: new Date().toISOString().split("T")[0],
        status: {
          ...status,
          used: result.used,
          remaining: result.remaining,
        },
      }));

      return result;
    } catch (error) {
      console.error("Error incrementing AI usage:", error);
      return null;
    }
  }, [user, status]);

  // Toggle conversation mode (Pro only)
  const toggleConversationMode = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    
    // Only Pro users can enable conversation mode
    if (enabled && !status.canUseConversationMode) {
      return false;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ conversation_mode_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setStatus((prev) => ({
        ...prev,
        conversationModeEnabled: enabled,
      }));

      return true;
    } catch (error) {
      console.error("Error toggling conversation mode:", error);
      return false;
    }
  }, [user, status.canUseConversationMode]);

  return {
    status,
    loading,
    canExecuteCommand,
    canUseConversationMode,
    tryIncrementUsage,
    toggleConversationMode,
    refetch: fetchStatus,
    isPro: status.tier === "pro",
    isFree: status.tier === "free",
  };
};
