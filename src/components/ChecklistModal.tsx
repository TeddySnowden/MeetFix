import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Circle, CheckCircle2 } from "lucide-react";

interface ChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FinalizedEvent {
  id: string;
  name: string;
  group_id: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  emoji: string | null;
  claimed: boolean;
}

export function ChecklistModal({ open, onOpenChange }: ChecklistModalProps) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Fetch all finalized events the user has access to
  const { data: events } = useQuery({
    queryKey: ["finalized-events-checklist", user?.id],
    queryFn: async (): Promise<FinalizedEvent[]> => {
      if (!user?.id) return [];

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberships?.length) return [];

      const groupIds = memberships.map((m: any) => m.group_id);

      const { data, error } = await supabase
        .from("events")
        .select("id, name, group_id")
        .in("group_id", groupIds)
        .eq("status", "finalized")
        .order("finalized_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!user,
  });

  // Auto-select first event
  useEffect(() => {
    if (events?.length && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) setSelectedEventId("");
  }, [open]);

  // Fetch items with claim status for selected event
  const { data: items } = useQuery({
    queryKey: ["checklist-items", selectedEventId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!selectedEventId) return [];

      const { data: bringItems, error } = await supabase
        .from("bring_items")
        .select("id, name, emoji")
        .eq("event_id", selectedEventId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!bringItems?.length) return [];

      const { data: claims } = await supabase
        .from("item_claims")
        .select("item_id")
        .in("item_id", bringItems.map((i: any) => i.id));

      const claimedIds = new Set((claims || []).map((c: any) => c.item_id));

      return bringItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        emoji: item.emoji,
        claimed: claimedIds.has(item.id),
      }));
    },
    enabled: !!selectedEventId,
  });

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-white/10 text-white max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            Quick Checklist
          </DialogTitle>
        </DialogHeader>

        {/* Event selector */}
        {events && events.length > 0 && (
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select event..." />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/20 text-white z-[100]">
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id} className="text-white focus:bg-white/10 focus:text-white">
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Items list */}
        {items && items.length > 0 ? (
          <div className="space-y-2 mt-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  item.claimed
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {item.claimed ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-7 h-7 text-yellow-400 shrink-0" />
                )}
                <span className="text-base text-white">
                  {item.emoji || "📦"} {item.name}
                </span>
              </div>
            ))}
          </div>
        ) : selectedEventId ? (
          <p className="text-white/50 text-sm text-center py-6">No items for this event.</p>
        ) : (
          <p className="text-white/50 text-sm text-center py-6">No finalized events found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
