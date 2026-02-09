import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/useGroups";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users, Calendar, Plus } from "lucide-react";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { useState } from "react";

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();
  const [dialogOpen, setDialogOpen] = useState(false);

  const groupIds = groups?.map((g) => g.id) || [];

  const { data: eventCounts } = useQuery({
    queryKey: ["group-event-counts", groupIds],
    queryFn: async () => {
      if (!groupIds.length) return {};
      const { data } = await supabase
        .from("events")
        .select("group_id")
        .in("group_id", groupIds);
      const counts: Record<string, number> = {};
      data?.forEach((e: any) => {
        counts[e.group_id] = (counts[e.group_id] || 0) + 1;
      });
      return counts;
    },
    enabled: groupIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-6 pt-6 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">My Groups</h1>
      </div>

      <div className="px-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups && groups.length > 0 ? (
          groups.map((group) => (
            <button
              key={group.id}
              onClick={() => navigate(`/g/${group.id}`)}
              className="w-full bg-gradient-to-br from-emerald-500/20 to-teal-600/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 text-left hover:scale-[1.02] hover:border-emerald-400/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white truncate">{group.name}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {eventCounts?.[group.id] || 0} events
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {group.member_count || 0} members
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-4 py-16">
            <p className="text-white/50 text-lg">No groups yet</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        )}
      </div>

      <CreateGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
