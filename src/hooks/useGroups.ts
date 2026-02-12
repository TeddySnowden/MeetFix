import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  max_members: number;
  member_count?: number;
}

export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) return [];

      const { data: memberships, error: memErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memErr) throw memErr;
      if (!memberships?.length) return [];

      const groupIds = memberships.map((m: any) => m.group_id);

      const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds);

      if (error) throw error;

      // Get member counts
      const { data: counts } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);

      const countMap: Record<string, number> = {};
      counts?.forEach((c: any) => {
        countMap[c.group_id] = (countMap[c.group_id] || 0) + 1;
      });

      // Get latest event per group for sorting by last activity
      const { data: latestEvents } = await supabase
        .from("events")
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      const lastActivityMap: Record<string, string> = {};
      (latestEvents || []).forEach((e: any) => {
        if (!lastActivityMap[e.group_id]) {
          lastActivityMap[e.group_id] = e.created_at;
        }
      });

      const result = (groups || []).map((g: any) => ({
        ...g,
        member_count: countMap[g.id] || 0,
      }));

      // Sort by last activity DESC (most active first), fallback to group created_at
      result.sort((a, b) => {
        const aTime = lastActivityMap[a.id] || a.created_at;
        const bTime = lastActivityMap[b.id] || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return result;
    },
    enabled: !!user,
  });
}

export function useCreateGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user || !user.id) { throw new Error("User not authenticated"); }

      const { data, error } = await supabase
        .rpc("create_group", { group_name: name });

      if (error) throw error;

      // data is jsonb with id, name, invite_code
      return data as { id: string; name: string; invite_code: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error("Must be signed in");

      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase())
        .maybeSingle();

      if (groupErr) throw groupErr;
      if (!group) throw new Error("Invalid invite code");

      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return group; // Already a member

      const { error: joinErr } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "member" });

      if (joinErr) throw joinErr;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, updates }: { groupId: string; updates: { max_members?: number; invite_code?: string } }) => {
      const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useGroupByInviteCode(inviteCode: string | undefined) {
  return useQuery({
    queryKey: ["group-invite", inviteCode],
    queryFn: async () => {
      if (!inviteCode) return null;

      const { data, error } = await supabase
        .rpc("get_group_by_invite_code", { invite_code_input: inviteCode })
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!inviteCode,
  });
}
