import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const getLocalDate = () => new Date().toLocaleDateString("en-CA");

/** Awards the server-controlled daily OMV check-in on a user's first dashboard visit each day. */
export const useDailyCheckin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const today = getLocalDate();
    const storageKey = `m87-daily-checkin:${user.id}`;

    if (localStorage.getItem(storageKey) === today) return;

    const awardCheckin = async () => {
      const { data, error } = await supabase.rpc("award_daily_checkin");

      if (error) {
        console.error("Error awarding daily check-in:", error);
        return;
      }

      // The RPC is the authoritative idempotency check. Record every successful
      // response, including a zero-value no-op, to avoid needless calls today.
      localStorage.setItem(storageKey, today);

      if (data > 0) {
        queryClient.invalidateQueries({ queryKey: ["omv-balance"] });
        queryClient.invalidateQueries({ queryKey: ["omv-transactions"] });
        toast({ title: `Daily check-in: +${data} OMV` });
      }
    };

    void awardCheckin();
  }, [queryClient, user]);
};
