import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BringItem {
  id: string;
  event_id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
  claim?: ItemClaim | null;
}

export interface ItemClaim {
  id: string;
  item_id: string;
  user_id: string;
  claimed_at: string;
}

export function useBringItems(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bring_items", eventId],
    queryFn: async (): Promise<BringItem[]> => {
      if (!eventId) return [];

      const { data: items, error } = await supabase
        .from("bring_items")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const { data: claims, error: claimErr } = await supabase
        .from("item_claims")
        .select("*")
        .in("item_id", (items || []).map((i: any) => i.id));

      if (claimErr) throw claimErr;

      return (items || []).map((item: any) => ({
        ...item,
        claim: (claims || []).find((c: any) => c.item_id === item.id) || null,
      }));
    },
    enabled: !!eventId && !!user,
  });
}

export function useAddItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      name,
      emoji,
      maxQuantity = 6,
    }: {
      eventId: string;
      name: string;
      emoji: string;
      maxQuantity?: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bring_items")
        .insert({ event_id: eventId, name, emoji, created_by: user.id, max_quantity: maxQuantity })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["bring_items", data.event_id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, eventId }: { itemId: string; eventId: string }) => {
      const { error } = await supabase
        .from("bring_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bring_items", data.eventId] });
    },
  });
}

export function useClaimItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, eventId }: { itemId: string; eventId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("item_claims")
        .upsert({ item_id: itemId, user_id: user.id }, { onConflict: "user_id" });

      if (error) throw error;
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bring_items", data.eventId] });
    },
  });
}

export function useUnclaimItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, eventId }: { itemId: string; eventId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("item_claims")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bring_items", data.eventId] });
    },
  });
}
