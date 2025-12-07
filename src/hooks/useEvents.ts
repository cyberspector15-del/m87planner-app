import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string | null;
  travel_buffer_minutes: number | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, "id" | "created_at" | "updated_at">;
export type EventUpdate = Partial<EventInsert>;

export const useEvents = (date?: Date) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time event update:", payload);
          queryClient.invalidateQueries({ queryKey: ["events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["events", date?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      // Filter by date if provided
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: Omit<EventInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event created",
        description: "Your event has been scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event updated",
        description: "Your event has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted",
        description: "Your event has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
