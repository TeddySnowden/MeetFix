import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TimelineEntry {
  id: string;
  event_id: string;
  user_id: string;
  dress_up_time: string | null;
  travel_time: string | null;
  created_at: string;
}

export function useTimeline(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["timeline", eventId, user?.id],
    queryFn: async (): Promise<TimelineEntry | null> => {
      if (!eventId || !user) return null;

      const { data, error } = await supabase
        .from("event_user_timeline")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TimelineEntry | null;
    },
    enabled: !!eventId && !!user,
  });
}

export function useGroupTimelines(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group-timelines", eventId],
    queryFn: async (): Promise<TimelineEntry[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("event_user_timeline")
        .select("*")
        .eq("event_id", eventId);

      if (error) throw error;
      return (data || []) as TimelineEntry[];
    },
    enabled: !!eventId && !!user,
  });
}

export function useUpsertTimeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      dressUpTime,
      travelTime,
    }: {
      eventId: string;
      dressUpTime?: string | null;
      travelTime?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if entry exists
      const { data: existing } = await supabase
        .from("event_user_timeline")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const updateData: Record<string, any> = {};
        if (dressUpTime !== undefined) updateData.dress_up_time = dressUpTime;
        if (travelTime !== undefined) updateData.travel_time = travelTime;

        const { error } = await supabase
          .from("event_user_timeline")
          .update(updateData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_user_timeline")
          .insert({
            event_id: eventId,
            user_id: user.id,
            dress_up_time: dressUpTime || null,
            travel_time: travelTime || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["timeline", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-timelines", vars.eventId] });
    },
  });
}
