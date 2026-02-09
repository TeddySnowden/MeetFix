import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Event } from "./useEvents";

export function useNearestFinalizedEvent() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["nearest-finalized-event", user?.id],
    queryFn: async (): Promise<Event | null> => {
      if (!user) return null;

      // Get user's groups
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberships?.length) return null;

      const groupIds = memberships.map((m: any) => m.group_id);

      // Get nearest finalized event (by finalized_date >= now, or most recent)
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .in("group_id", groupIds)
        .eq("status", "finalized")
        .not("finalized_date", "is", null)
        .order("finalized_date", { ascending: true })
        .limit(1);

      if (events?.length) return events[0] as Event;

      // Fallback: most recent event of any status
      const { data: recent } = await supabase
        .from("events")
        .select("*")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(1);

      return recent?.[0] as Event || null;
    },
    enabled: !!user,
  });
}
