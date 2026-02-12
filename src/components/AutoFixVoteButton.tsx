import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTimeSlots, useActivities } from "@/hooks/useEvents";

interface AutoFixVoteButtonProps {
  eventId: string;
}

export function AutoFixVoteButton({ eventId }: AutoFixVoteButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Use the same cached queries as EventDetail for realtime state
  const { data: slots } = useTimeSlots(eventId);
  const { data: activities } = useActivities(eventId);

  // Derive hasVoted from the query cache — updates instantly on vote/undo
  const hasVoted =
    (slots || []).some((s) => s.voted_by_me) ||
    (activities || []).some((a) => a.voted_by_me);

  if (!user || hasVoted) return null;

  const handleAutoFix = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      // Get vote counts for slots
      const { data: slotVotes } = await supabase
        .from("time_slot_votes")
        .select("time_slot_id")
        .eq("event_id", eventId);

      // Find most popular slot
      if (slots && slots.length > 0) {
        const slotCounts: Record<string, number> = {};
        (slotVotes || []).forEach((v: any) => {
          slotCounts[v.time_slot_id] = (slotCounts[v.time_slot_id] || 0) + 1;
        });
        const bestSlot = slots.reduce(
          (best, s) =>
            (slotCounts[s.id] || 0) > (slotCounts[best.id] || 0) ? s : best,
          slots[0]
        );

        await supabase.from("time_slot_votes").insert({
          event_id: eventId,
          time_slot_id: bestSlot.id,
          user_id: user.id,
        });
      }

      // Get vote counts for activities
      if (activities && activities.length > 0) {
        const { data: actVotes } = await supabase
          .from("activity_votes")
          .select("activity_id")
          .eq("event_id", eventId);

        const actCounts: Record<string, number> = {};
        (actVotes || []).forEach((v: any) => {
          actCounts[v.activity_id] = (actCounts[v.activity_id] || 0) + 1;
        });
        const bestAct = activities.reduce(
          (best, a) =>
            (actCounts[a.id] || 0) > (actCounts[best.id] || 0) ? a : best,
          activities[0]
        );

        await supabase.from("activity_votes").insert({
          event_id: eventId,
          activity_id: bestAct.id,
          user_id: user.id,
        });
      }

      if (navigator.vibrate) navigator.vibrate(30);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["time_slots", eventId] });
      queryClient.invalidateQueries({ queryKey: ["activities", eventId] });
      toast({
        title: "⚡ AUTO-FIX APPLIED",
        description: "Voted for the most popular choices.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAutoFix}
      disabled={loading}
      className="autofix-vote-btn mt-2 w-full py-2 px-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
    >
      <Zap className="w-4 h-4 inline mr-1.5" />
      {loading ? "FIXING..." : "AUTO-FIX VOTE"}
    </button>
  );
}
