import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const checkWindowEnd = new Date(now.getTime() + 2 * 60 * 1000); // Check 2 minutes ahead

    console.log(`Checking for reminders between ${now.toISOString()} and ${checkWindowEnd.toISOString()}`);

    // Get all profiles with notifications enabled
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, reminder_minutes, notifications_enabled")
      .eq("notifications_enabled", true);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users with notifications enabled");
      return new Response(
        JSON.stringify({ message: "No users with notifications enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications: Array<{ user_id: string; notification: object }> = [];

    for (const profile of profiles) {
      const reminderMinutes = profile.reminder_minutes || 15;
      
      // Calculate the time window for events that should get reminders now
      const eventWindowStart = new Date(now.getTime() + reminderMinutes * 60 * 1000);
      const eventWindowEnd = new Date(checkWindowEnd.getTime() + reminderMinutes * 60 * 1000);

      // Get upcoming events for this user
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("status", "scheduled")
        .gte("start_time", eventWindowStart.toISOString())
        .lte("start_time", eventWindowEnd.toISOString());

      if (eventsError) {
        console.error(`Error fetching events for user ${profile.user_id}:`, eventsError);
        continue;
      }

      for (const event of events || []) {
        const eventTime = new Date(event.start_time);
        const travelBuffer = event.travel_buffer_minutes || 0;
        
        // Add event reminder notification
        notifications.push({
          user_id: profile.user_id,
          notification: {
            title: `⏰ Upcoming: ${event.title}`,
            body: `Starts in ${reminderMinutes} minutes${event.location ? ` at ${event.location}` : ""}`,
            tag: `event-reminder-${event.id}`,
            url: "/dashboard",
          },
        });

        // Check if we need to send travel alert (leave now)
        if (travelBuffer > 0) {
          const leaveTime = new Date(eventTime.getTime() - travelBuffer * 60 * 1000);
          const leaveTimeWithBuffer = new Date(leaveTime.getTime() + 2 * 60 * 1000);
          
          if (leaveTime >= now && leaveTime <= checkWindowEnd) {
            notifications.push({
              user_id: profile.user_id,
              notification: {
                title: `🚗 Time to leave!`,
                body: `Leave now for ${event.title}${event.location ? ` at ${event.location}` : ""}`,
                tag: `travel-leave-${event.id}`,
                url: "/dashboard",
              },
            });
          }

          // Check for 10-minute pre-departure warning
          const preLeaveTime = new Date(leaveTime.getTime() - 10 * 60 * 1000);
          if (preLeaveTime >= now && preLeaveTime <= checkWindowEnd) {
            notifications.push({
              user_id: profile.user_id,
              notification: {
                title: `🚗 Prepare to leave`,
                body: `Leave in 10 minutes for ${event.title}`,
                tag: `travel-prepare-${event.id}`,
                url: "/dashboard",
              },
            });
          }
        }
      }
    }

    console.log(`Sending ${notifications.length} notifications`);

    // Send all notifications
    const sendNotification = async (n: { user_id: string; notification: object }) => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(n),
        });
        return response.ok;
      } catch (error) {
        console.error("Failed to send notification:", error);
        return false;
      }
    };

    const results = await Promise.all(notifications.map(sendNotification));
    const successCount = results.filter(Boolean).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: successCount,
        total: notifications.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in schedule-reminders:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
