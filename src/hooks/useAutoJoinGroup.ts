import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useAutoJoinGroup(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || !groupId || attempted.current) return;
    attempted.current = true;

    (async () => {
      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return; // Already a member, silent

      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id, role: "member" });

      if (error) {
        // Unique constraint violation = already a member, ignore
        if (error.code === "23505") return;
        console.error("Auto-join error:", error);
        return;
      }

      toast({ title: "Joined group!" });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    })();
  }, [user, groupId, queryClient]);
}
