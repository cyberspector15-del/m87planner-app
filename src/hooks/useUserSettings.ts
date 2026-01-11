// Re-export from context for backward compatibility
// Components using useUserSettings will continue to work
import { useSettings, type UserSettings } from "@/contexts/SettingsContext";

export type { UserSettings };

export const useUserSettings = () => {
  const { settings, loading, saving, updateSetting, refetch } = useSettings();
  
  return {
    settings,
    loading,
    saving,
    updateSetting,
    refetch,
  };
};
