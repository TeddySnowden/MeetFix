import { useState } from "react";
import { Trophy, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFinalizeEvent, TimeSlot } from "@/hooks/useEvents";
import { toast } from "@/hooks/use-toast";

interface FinalizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slots: TimeSlot[];
}

function formatSlot(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function FinalizeDialog({ open, onOpenChange, eventId, slots }: FinalizeDialogProps) {
  const finalize = useFinalizeEvent();
  const sorted = [...slots].sort((a, b) => b.vote_count - a.vote_count);
  const winner = sorted[0];
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const chosen = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : winner;

  const handleFinalize = async () => {
    if (!chosen) return;
    try {
      await finalize.mutateAsync({
        eventId,
        slotId: chosen.id,
        finalizedDate: chosen.slot_at,
      });
      toast({ title: "Event finalized! 🎉", description: `Scheduled for ${formatSlot(chosen.slot_at).day} at ${formatSlot(chosen.slot_at).time}` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Finalize Event
          </DialogTitle>
          <DialogDescription>
            Choose the winning time slot. The most voted slot is pre-selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-60 overflow-y-auto">
          {sorted.map((slot) => {
            const { day, time } = formatSlot(slot.slot_at);
            const isSelected = (selectedSlotId ?? winner?.id) === slot.id;
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
                  {isSelected ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  )}
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

        <DialogFooter>
          <Button
            onClick={handleFinalize}
            disabled={!chosen || finalize.isPending}
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
