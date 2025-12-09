import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  window_start: string;
  window_end: string;
  target_duration_minutes: number | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

export type RoutineInsert = Omit<Routine, "id" | "user_id" | "created_at" | "updated_at">;
export type RoutineUpdate = Partial<RoutineInsert>;

export const useRoutines = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("routines-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routines",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["routines"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("window_start", { ascending: true });

      if (error) throw error;
      return data as Routine[];
    },
    enabled: !!user,
  });
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (routine: RoutineInsert) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("routines")
        .insert({ ...routine, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create routine: ${error.message}`);
    },
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoutineUpdate }) => {
      const { data, error } = await supabase
        .from("routines")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update routine: ${error.message}`);
    },
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete routine: ${error.message}`);
    },
  });
};
