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
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Finalize Event
          </DialogTitle>
          <DialogDescription>
            Choose the winning time slot{activities.length > 0 ? " and activity" : ""}. Most voted are pre-selected.
          </DialogDescription>
        </DialogHeader>

        {/* Time slots */}
        <div className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</h4>
          {sortedSlots.map((slot) => {
            const { day, time } = formatSlot(slot.slot_at);
            const isSelected = (selectedSlotId ?? topSlot?.id) === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`w-full rounded-xl p-3 text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "gradient-primary" : "bg-muted"
                }`}>
                  {isSelected ? <Check className="w-4 h-4 text-primary-foreground" /> : <Calendar className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{day}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{slot.vote_count} votes</span>
              </button>
            );
          })}
        </div>

        {/* Activities */}
        {sortedActivities.length > 0 && (
          <div className="space-y-2 py-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</h4>
            {sortedActivities.map((act) => {
              const isSelected = (selectedActivity ?? topActivity?.name) === act.name;
              return (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act.name)}
                  className={`w-full rounded-xl p-3 text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "gradient-primary" : "bg-muted"
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 text-primary-foreground" /> : <Sparkles className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{act.name}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{act.vote_count} votes</span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleFinalize}
            disabled={!chosenSlot || finalize.isPending}
            className="w-full gradient-primary"
          >
            {finalize.isPending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              "Confirm & Finalize"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
