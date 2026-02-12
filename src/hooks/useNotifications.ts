import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface Notification {
  id: string;
  user_id: string;
  event_id: string;
  type: string;
  title: string;
  message: string;
  scheduled_for: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .lte("scheduled_for", now)
        .order("scheduled_for", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // poll every minute for newly scheduled notifs
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

/**
 * Schedule the 4 notification types for all group members of an event.
 * Called when an event is packed up.
 */
export function useScheduleNotifications() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventName,
      finalizedDate,
      groupId,
    }: {
      eventId: string;
      eventName: string;
      finalizedDate: string;
      groupId: string;
    }) => {
      if (!user?.id) return;

      const eventTime = new Date(finalizedDate);
      const now = new Date();

      // Get all group members
      const { data: members, error: memErr } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);
      if (memErr) throw memErr;

      const memberIds = (members || []).map((m: any) => m.user_id);
      if (!memberIds.length) return;

      // Get bring items and claims for personalized messages
      const { data: items } = await supabase
        .from("bring_items")
        .select("id, name, emoji")
        .eq("event_id", eventId);

      const { data: claims } = await supabase
        .from("item_claims")
        .select("item_id, user_id")
        .in("item_id", (items || []).map((i: any) => i.id));

      // Get user timelines for dress/travel times
      const { data: timelines } = await supabase
        .from("event_user_timeline")
        .select("user_id, dress_up_time, travel_time, dress_minutes, travel_minutes")
        .eq("event_id", eventId);

      const timelineMap: Record<string, any> = {};
      (timelines || []).forEach((t: any) => {
        timelineMap[t.user_id] = t;
      });

      // Build claim map per user
      const userClaimMap: Record<string, string[]> = {};
      (claims || []).forEach((c: any) => {
        const item = (items || []).find((i: any) => i.id === c.item_id);
        if (item) {
          if (!userClaimMap[c.user_id]) userClaimMap[c.user_id] = [];
          userClaimMap[c.user_id].push(`${item.emoji || "📦"} ${item.name}`);
        }
      });

      const notifications: any[] = [];

      for (const uid of memberIds) {
        const userClaims = userClaimMap[uid] || [];
        const claimText = userClaims.length > 0 ? userClaims.join(", ") : "nothing yet";
        const tl = timelineMap[uid];

        // T-24h
        const t24 = new Date(eventTime.getTime() - 24 * 60 * 60000);
        if (t24 > now) {
          notifications.push({
            user_id: uid,
            event_id: eventId,
            type: "t_24h",
            title: `Tomorrow's event! 🎉`,
            message: `${eventName} is tomorrow. Get ready!`,
            scheduled_for: t24.toISOString(),
          });
        }

        // T-4h
        const t4 = new Date(eventTime.getTime() - 4 * 60 * 60000);
        if (t4 > now) {
          notifications.push({
            user_id: uid,
            event_id: eventId,
            type: "t_4h",
            title: `Bringing your stuff?! 🎒`,
            message: `You're bringing: ${claimText}`,
            scheduled_for: t4.toISOString(),
          });
        }

        // Dress start
        if (tl?.dress_up_time) {
          const dressTime = new Date(tl.dress_up_time);
          if (dressTime > now) {
            notifications.push({
              user_id: uid,
              event_id: eventId,
              type: "dress_start",
              title: `Get ready! Time to dress up ⏰`,
              message: `${eventName} starts in ${(tl.dress_minutes || 0) + (tl.travel_minutes || 0)} minutes. Start getting dressed!`,
              scheduled_for: dressTime.toISOString(),
            });
          }
        }

        // Travel start
        if (tl?.travel_time) {
          const travelTime = new Date(tl.travel_time);
          if (travelTime > now) {
            notifications.push({
              user_id: uid,
              event_id: eventId,
              type: "travel_start",
              title: `Time to leave! 🚗`,
              message: `Don't forget: ${claimText}`,
              scheduled_for: travelTime.toISOString(),
            });
          }
        }
      }

      if (notifications.length > 0) {
        // Delete existing notifications for this event to avoid duplicates
        await supabase
          .from("notifications")
          .delete()
          .eq("event_id", eventId);

        const { error } = await supabase
          .from("notifications")
          .insert(notifications);
        if (error) throw error;
      }
    },
  });
}
