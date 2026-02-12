import { useState } from "react";
import { Trophy, Calendar, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFinalizeEvent, TimeSlot, Activity } from "@/hooks/useEvents";
import { toast } from "@/hooks/use-toast";

interface FinalizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slots: TimeSlot[];
  activities: Activity[];
}

function formatSlot(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function FinalizeDialog({ open, onOpenChange, eventId, slots, activities }: FinalizeDialogProps) {
  const finalize = useFinalizeEvent();
  const sortedSlots = [...slots].sort((a, b) => b.vote_count - a.vote_count);
  const sortedActivities = [...activities].sort((a, b) => b.vote_count - a.vote_count);
  const topSlot = sortedSlots[0];
  const topActivity = sortedActivities[0];

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const chosenSlot = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : topSlot;
  const chosenActivity = selectedActivity ?? topActivity?.name ?? null;

  const handleFinalize = async () => {
    if (!chosenSlot) return;
    try {
      await finalize.mutateAsync({
        eventId,
        slotId: chosenSlot.id,
        finalizedDate: chosenSlot.slot_at,
        finalizedActivity: chosenActivity || undefined,
      });
      toast({
        title: "Event finalized! 🎉",
        description: `${formatSlot(chosenSlot.slot_at).day}${chosenActivity ? ` · ${chosenActivity}` : ""}`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto border border-purple-400/50 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.25)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-200 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
            <Trophy className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            Finalize Event
          </DialogTitle>
          <DialogDescription className="text-purple-300/80">
            Choose the winning time slot{activities.length > 0 ? " and activity" : ""}. Most voted are pre-selected.
          </DialogDescription>
        </DialogHeader>

        {/* Time slots */}
        <div className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">Date</h4>
          {sortedSlots.map((slot) => {
            const { day, time } = formatSlot(slot.slot_at);
            const isSelected = (selectedSlotId ?? topSlot?.id) === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`w-full rounded-xl p-3 text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? "bg-purple-500/10 border-2 border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-purple-400/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "bg-gradient-to-r from-purple-600 to-cyan-500" : "bg-white/10"
                }`}>
                  {isSelected ? <Check className="w-4 h-4 text-white" /> : <Calendar className="w-4 h-4 text-purple-300/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-purple-100 text-sm">{day}</p>
                  <p className="text-xs text-purple-300/60">{time}</p>
                </div>
                <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">{slot.vote_count} votes</span>
              </button>
            );
          })}
        </div>

        {/* Activities */}
        {sortedActivities.length > 0 && (
          <div className="space-y-2 py-2">
            <h4 className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">Activity</h4>
            {sortedActivities.map((act) => {
              const isSelected = (selectedActivity ?? topActivity?.name) === act.name;
              return (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act.name)}
                  className={`w-full rounded-xl p-3 text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? "bg-purple-500/10 border-2 border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                      : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-purple-400/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-gradient-to-r from-purple-600 to-cyan-500" : "bg-white/10"
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-purple-300/60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-purple-100 text-sm">{act.name}</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">{act.vote_count} votes</span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleFinalize}
            disabled={!chosenSlot || finalize.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow border-0"
          >
            {finalize.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Confirm & Finalize"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
