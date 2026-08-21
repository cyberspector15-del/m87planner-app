import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useFocusSessionAward = () => {
  const queryClient = useQueryClient();

  const awardFocusSession = useCallback(
    async (sessionId: string) => {
      const { data, error } = await supabase.rpc("award_focus_session", {
        p_session_id: sessionId,
      });

      if (error) {
        console.error("Error awarding focus session OMV:", error);
        return;
      }

      if (data > 0) {
        queryClient.invalidateQueries({ queryKey: ["omv-balance"] });
        queryClient.invalidateQueries({ queryKey: ["omv-transactions"] });
        toast({ title: `Focus session: +${data} OMV` });
      }
    },
    [queryClient]
  );

  return { awardFocusSession };
};
