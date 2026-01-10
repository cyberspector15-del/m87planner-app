import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  planningMode: "ai" | "manual";
  workHoursStart: string;
  workHoursEnd: string;
  focusHoursStart: string;
  focusHoursEnd: string;
  autoCarryTasks: boolean;
  aiStrictness: "calm" | "balanced" | "strict";
  askBeforeReschedule: boolean;
  showAiExplanations: boolean;
  hapticEnabled: boolean;
  soundEnabled: boolean;
}

const defaultSettings: UserSettings = {
  planningMode: "ai",
  workHoursStart: "09:00",
  workHoursEnd: "17:00",
  focusHoursStart: "09:00",
  focusHoursEnd: "12:00",
  autoCarryTasks: true,
  aiStrictness: "balanced",
  askBeforeReschedule: true,
  showAiExplanations: true,
  hapticEnabled: true,
  soundEnabled: true,
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `planning_mode, work_hours_start, work_hours_end, focus_hours_start, 
           focus_hours_end, auto_carry_tasks, ai_strictness, ask_before_reschedule, 
           show_ai_explanations, haptic_enabled, sound_enabled`
        )
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          planningMode: (data.planning_mode as "ai" | "manual") || "ai",
          workHoursStart: data.work_hours_start?.slice(0, 5) || "09:00",
          workHoursEnd: data.work_hours_end?.slice(0, 5) || "17:00",
          focusHoursStart: data.focus_hours_start?.slice(0, 5) || "09:00",
          focusHoursEnd: data.focus_hours_end?.slice(0, 5) || "12:00",
          autoCarryTasks: data.auto_carry_tasks ?? true,
          aiStrictness: (data.ai_strictness as "calm" | "balanced" | "strict") || "balanced",
          askBeforeReschedule: data.ask_before_reschedule ?? true,
          showAiExplanations: data.show_ai_explanations ?? true,
          hapticEnabled: data.haptic_enabled ?? true,
          soundEnabled: data.sound_enabled ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      if (!user) return;

      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSaving(true);

      // Map frontend key to database column
      const columnMap: Record<keyof UserSettings, string> = {
        planningMode: "planning_mode",
        workHoursStart: "work_hours_start",
        workHoursEnd: "work_hours_end",
        focusHoursStart: "focus_hours_start",
        focusHoursEnd: "focus_hours_end",
        autoCarryTasks: "auto_carry_tasks",
        aiStrictness: "ai_strictness",
        askBeforeReschedule: "ask_before_reschedule",
        showAiExplanations: "show_ai_explanations",
        hapticEnabled: "haptic_enabled",
        soundEnabled: "sound_enabled",
      };

      const dbColumn = columnMap[key];
      
      // Convert time strings to proper format for database
      let dbValue: string | boolean = value as string | boolean;
      if (key === "workHoursStart" || key === "workHoursEnd" || 
          key === "focusHoursStart" || key === "focusHoursEnd") {
        dbValue = `${value}:00`;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ [dbColumn]: dbValue, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating setting:", error);
        // Revert on error
        await fetchSettings();
        toast({
          title: "Error saving setting",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [user, fetchSettings, toast]
  );

  return {
    settings,
    loading,
    saving,
    updateSetting,
    refetch: fetchSettings,
  };
};
