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

      return (groups || []).map((g: any) => ({
        ...g,
        member_count: countMap[g.id] || 0,
      }));
    },
    enabled: !!user,
  });
}

export function useCreateGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      console.log("useCreateGroup - user:", user);
      if (!user || !user.id) { throw new Error("User not authenticated - no valid user.id"); }

      const invite_code = generateInviteCode();

      const { data: group, error } = await supabase
        .from("groups")
        .insert({ name, created_by: user.id, invite_code })
        .select()
        .single();

      if (error) throw error;

      const { error: memberErr } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "owner" });

      if (memberErr) throw memberErr;

      return group;
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

export function useJoinGroupById() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Must be signed in");

      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return { alreadyMember: true };

      const { error: joinErr } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id, role: "member" });

      if (joinErr) throw joinErr;

      return { alreadyMember: false };
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
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!inviteCode,
  });
}
