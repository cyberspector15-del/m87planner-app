import { useState, useEffect } from "react";
import { Bell, BellSlash, Clock, Flask } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
];

export function NotificationSettings() {
  const { user } = useAuth();
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    isLoading, 
    subscribe, 
    unsubscribe,
    testNotification 
  } = usePushNotifications();
  
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("reminder_minutes")
        .eq("user_id", user.id)
        .single();
      
      if (data?.reminder_minutes) {
        setReminderMinutes(String(data.reminder_minutes));
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleReminderChange = async (value: string) => {
    if (!user) return;
    
    setReminderMinutes(value);
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ reminder_minutes: parseInt(value) })
        .eq("user_id", user.id);
      
      if (error) throw error;
      toast.success("Reminder time updated");
    } catch (error) {
      console.error("Error updating reminder time:", error);
      toast.error("Failed to update reminder time");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellSlash size={20} weight="thin" />
          <p className="text-sm">Push notifications are not supported in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cosmic-purple/20">
          <Bell size={20} weight="thin" className="text-cosmic-purple" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Notification Settings</h3>
          <p className="text-xs text-muted-foreground">
            Configure event reminders and travel alerts
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-toggle">Push Notifications</Label>
            <p className="text-xs text-muted-foreground">
              {permission === "denied" 
                ? "Notifications are blocked by your browser" 
                : isSubscribed 
                  ? "You'll receive event reminders" 
                  : "Enable to receive event reminders"}
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || permission === "denied"}
          />
        </div>

        {/* Reminder Time Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={16} weight="thin" className="text-muted-foreground" />
            <Label htmlFor="reminder-time">Event Reminder Time</Label>
          </div>
          <Select
            value={reminderMinutes}
            onValueChange={handleReminderChange}
            disabled={!isSubscribed || isSaving}
          >
            <SelectTrigger id="reminder-time" className="w-full">
              <SelectValue placeholder="Select reminder time" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            You'll also receive travel alerts when it's time to leave
          </p>
        </div>

        {/* Test Notification */}
        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={testNotification}
            className="w-full"
          >
            <Flask size={16} weight="thin" className="mr-2" />
            Test Notification
          </Button>
        )}
      </div>
    </div>
  );
}
