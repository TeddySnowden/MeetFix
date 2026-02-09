import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function useAutoJoinGroup(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!user || !groupId || joinedRef.current) return;
    joinedRef.current = true;

    console.log("AUTO-JOIN DEBUG:", { userId: user.id, groupId });

    supabase
      .from("group_members")
      .upsert(
        { group_id: groupId, user_id: user.id, role: "member" },
        { onConflict: "group_id,user_id" }
      )
      .select("joined_at")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("JOIN ERROR:", error);
          toast({ title: "Join failed", description: error.message, variant: "destructive" });
        } else {
          const isNew = data && (Date.now() - new Date(data.joined_at).getTime()) < 5000;
          console.log("JOIN SUCCESS:", { data, isNew });
          if (isNew) {
            toast({ title: "Joined group!" });
          }
          queryClient.invalidateQueries({ queryKey: ["groups"] });
        }
      });
  }, [user, groupId]);
}
