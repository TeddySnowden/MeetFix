import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEvent, SlotInput } from "@/hooks/useEvents";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
}

const TIMES = timeOptions();
const DURATIONS = ["1h", "2h", "3h"];
const ACTIVITY_PRESETS = ["BBQ", "Drinks", "Hike", "Custom"];

interface SlotState {
  date: Date | undefined;
  time: string;
  duration: string;
}

interface ActivityState {
  preset: string;
  custom: string;
}

const defaultSlot = (): SlotState => ({ date: undefined, time: "18:00", duration: "2h" });
const defaultActivity = (): ActivityState => ({ preset: "", custom: "" });

export function AddEventDialog({ open, onOpenChange, groupId }: AddEventDialogProps) {
  const [slots, setSlots] = useState<SlotState[]>([defaultSlot(), defaultSlot(), defaultSlot()]);
  const [activities, setActivities] = useState<ActivityState[]>([defaultActivity(), defaultActivity(), defaultActivity()]);
  const createEvent = useCreateEvent();
  const navigate = useNavigate();

  const updateSlot = (idx: number, patch: Partial<SlotState>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const updateActivity = (idx: number, patch: Partial<ActivityState>) => {
    setActivities((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const getActivityName = (a: ActivityState) => (a.preset === "Custom" ? a.custom.trim() : a.preset);

  const allSlotsValid = slots.every((s) => s.date && s.time && s.duration);
  const allActivitiesValid = activities.every((a) => getActivityName(a).length > 0);
  const canCreate = allSlotsValid && allActivitiesValid;

  const handleCreate = async () => {
    const slotInputs: SlotInput[] = slots.map((s) => ({
      date: s.date!,
      time: s.time,
      duration: s.duration,
    }));
    const activityNames = activities.map(getActivityName);

    try {
      const event = await createEvent.mutateAsync({
        groupId,
        name: "Group Event",
        slots: slotInputs,
        activities: activityNames,
      });
      toast({ title: "Event created!", description: "3 date slots + 3 activities added." });
      resetAndClose();
      navigate(`/e/${event.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const resetAndClose = () => {
    setSlots([defaultSlot(), defaultSlot(), defaultSlot()]);
    setActivities([defaultActivity(), defaultActivity(), defaultActivity()]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>Pick 3 date slots and 3 activity options for the group to vote on.</DialogDescription>
        </DialogHeader>

        {/* Date Slots Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date Slots</h3>
          <div className="grid gap-3">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <Label className="text-xs">Date {idx + 1}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("w-full justify-start text-left font-normal", !slot.date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {slot.date ? format(slot.date, "MMM d") : "Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={slot.date}
                        onSelect={(d) => updateSlot(idx, { date: d })}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Select value={slot.time} onValueChange={(v) => updateSlot(idx, { time: v })}>
                    <SelectTrigger className="w-[90px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dur.</Label>
                  <Select value={slot.duration} onValueChange={(v) => updateSlot(idx, { duration: v })}>
                    <SelectTrigger className="w-[70px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Options Section */}
        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity Options</h3>
          <div className="space-y-2">
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Activity {idx + 1}</Label>
                  <Select value={act.preset} onValueChange={(v) => updateActivity(idx, { preset: v, custom: v === "Custom" ? act.custom : "" })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_PRESETS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {act.preset === "Custom" && (
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={act.custom}
                      onChange={(e) => updateActivity(idx, { custom: e.target.value })}
                      placeholder="e.g. Bowling"
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full gradient-primary mt-4"
          disabled={!canCreate || createEvent.isPending}
          onClick={handleCreate}
        >
          {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
