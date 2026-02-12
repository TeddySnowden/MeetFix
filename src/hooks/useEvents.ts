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
  finalized_activity: string | null;
  packed_up: boolean;
}

export interface Activity {
  id: string;
  event_id: string;
  name: string;
  created_by: string;
  created_at: string;
  vote_count: number;
  voted_by_me: boolean;
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

export interface EventWithSlotInfo extends Event {
  first_slot_at: string | null;
  total_votes: number;
}

export function useGroupEventsWithSlots(groupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["events", groupId, "with-slots"],
    queryFn: async (): Promise<EventWithSlotInfo[]> => {
      if (!groupId) return [];

      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!events?.length) return [];

      const eventIds = events.map((e: any) => e.id);

      // Fetch first time slot per event
      const { data: slots } = await supabase
        .from("time_slots")
        .select("event_id, slot_at")
        .in("event_id", eventIds)
        .order("slot_at", { ascending: true });

      // Fetch vote counts
      const { data: votes } = await supabase
        .from("time_slot_votes")
        .select("event_id")
        .in("event_id", eventIds);

      // Build first-slot map (earliest per event)
      const firstSlotMap: Record<string, string> = {};
      (slots || []).forEach((s: any) => {
        if (!firstSlotMap[s.event_id]) {
          firstSlotMap[s.event_id] = s.slot_at;
        }
      });

      // Build vote count map
      const voteCountMap: Record<string, number> = {};
      (votes || []).forEach((v: any) => {
        voteCountMap[v.event_id] = (voteCountMap[v.event_id] || 0) + 1;
      });

      return events.map((e: any) => ({
        ...e,
        first_slot_at: firstSlotMap[e.id] || null,
        total_votes: voteCountMap[e.id] || 0,
      }));
    },
    enabled: !!groupId && !!user,
  });
}

export interface SlotInput {
  date: Date;   // calendar date
  time: string; // "HH:mm"
  duration: string; // "1h" | "2h" | "3h"
}

export function useCreateEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      slots: slotInputs,
      activities,
    }: {
      groupId: string;
      name: string;
      slots: SlotInput[];
      activities?: string[];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: event, error } = await supabase
        .from("events")
        .insert({ group_id: groupId, name, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      const slotRows = slotInputs.map((s) => {
        const [h, m] = s.time.split(":").map(Number);
        const d = new Date(s.date);
        d.setHours(h, m, 0, 0);
        return {
          event_id: event.id,
          slot_at: d.toISOString(),
          created_by: user.id,
        };
      });

      const { error: slotErr } = await supabase.from("time_slots").insert(slotRows);
      if (slotErr) throw slotErr;

      if (activities?.length) {
        const actRows = activities.map((name) => ({
          event_id: event.id,
          name,
          created_by: user.id,
        }));
        const { error: actErr } = await supabase.from("activities").insert(actRows);
        if (actErr) throw actErr;
      }

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

export function useActivities(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", eventId, user?.id],
    queryFn: async (): Promise<Activity[]> => {
      if (!eventId) return [];

      const { data: acts, error } = await supabase
        .from("activities")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const { data: votes, error: voteErr } = await supabase
        .from("activity_votes")
        .select("*")
        .eq("event_id", eventId);

      if (voteErr) throw voteErr;

      return (acts || []).map((act: any) => {
        const actVotes = (votes || []).filter((v: any) => v.activity_id === act.id);
        return {
          ...act,
          vote_count: actVotes.length,
          voted_by_me: user ? actVotes.some((v: any) => v.user_id === user.id) : false,
        };
      });
    },
    enabled: !!eventId,
  });
}

export function useToggleActivityVote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      activityId,
      currentlyVoted,
    }: {
      eventId: string;
      activityId: string;
      currentlyVoted: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (currentlyVoted) {
        // Deselect: just delete this vote
        const { error } = await supabase
          .from("activity_votes")
          .delete()
          .eq("activity_id", activityId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Enforce 1 vote: delete any existing activity vote for this event first
        await supabase
          .from("activity_votes")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        const { error } = await supabase
          .from("activity_votes")
          .insert({ event_id: eventId, activity_id: activityId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["activities", vars.eventId] });
    },
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
      finalizedActivity,
    }: {
      eventId: string;
      slotId: string;
      finalizedDate: string;
      finalizedActivity?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .update({
          status: "finalized",
          finalized_slot_id: slotId,
          finalized_date: finalizedDate,
          finalized_activity: finalizedActivity || null,
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

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, groupId }: { eventId: string; groupId: string }) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
      return { groupId };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events", vars.groupId] });
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
        // Deselect: just delete this vote
        const { error } = await supabase
          .from("time_slot_votes")
          .delete()
          .eq("event_id", eventId)
          .eq("time_slot_id", timeSlotId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Enforce 1 vote: delete any existing vote for this event first
        await supabase
          .from("time_slot_votes")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

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

export function usePackUpEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("events")
        .update({ packed_up: true })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["event", vars.eventId] });
    },
  });
}
