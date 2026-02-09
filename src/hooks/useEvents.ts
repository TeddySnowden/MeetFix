import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Event {
  id: string;
  group_id: string;
  name: string;
  status: string;
  created_by: string;
  created_at: string;
  finalized_slot_id: string | null;
  finalized_date: string | null;
}

export interface TimeSlot {
  id: string;
  event_id: string;
  slot_at: string;
  created_by: string;
  created_at: string;
  vote_count: number;
  voted_by_me: boolean;
}

export function useGroupEvents(groupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["events", groupId],
    queryFn: async (): Promise<Event[]> => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId && !!user,
  });
}

export function useCreateEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create event
      const { data: event, error } = await supabase
        .from("events")
        .insert({ group_id: groupId, name, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Auto-create 3 time slots for next 3 days at 18:00 local
      const slots = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        d.setHours(18, 0, 0, 0);
        slots.push({
          event_id: event.id,
          slot_at: d.toISOString(),
          created_by: user.id,
        });
      }

      const { error: slotErr } = await supabase
        .from("time_slots")
        .insert(slots);

      if (slotErr) throw slotErr;

      return event;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events", vars.groupId] });
    },
  });
}

export function useEventDetail(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId && !!user,
  });
}

export function useTimeSlots(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["time_slots", eventId, user?.id],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!eventId) return [];

      const { data: slots, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("event_id", eventId)
        .order("slot_at", { ascending: true });

      if (error) throw error;

      // Get all votes for this event
      const { data: votes, error: voteErr } = await supabase
        .from("time_slot_votes")
        .select("*")
        .eq("event_id", eventId);

      if (voteErr) throw voteErr;

      return (slots || []).map((slot: any) => {
        const slotVotes = (votes || []).filter((v: any) => v.time_slot_id === slot.id);
        return {
          ...slot,
          vote_count: slotVotes.length,
          voted_by_me: user ? slotVotes.some((v: any) => v.user_id === user.id) : false,
        };
      });
    },
    enabled: !!eventId,
  });
}

export function useFinalizeEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      slotId,
      finalizedDate,
    }: {
      eventId: string;
      slotId: string;
      finalizedDate: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .update({
          status: "finalized",
          finalized_slot_id: slotId,
          finalized_date: finalizedDate,
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["event", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useToggleVote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      timeSlotId,
      currentlyVoted,
    }: {
      eventId: string;
      timeSlotId: string;
      currentlyVoted: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (currentlyVoted) {
        const { error } = await supabase
          .from("time_slot_votes")
          .delete()
          .eq("event_id", eventId)
          .eq("time_slot_id", timeSlotId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("time_slot_votes")
          .insert({
            event_id: eventId,
            time_slot_id: timeSlotId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["time_slots", vars.eventId] });
    },
  });
}
