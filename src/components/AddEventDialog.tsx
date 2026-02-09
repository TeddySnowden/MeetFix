import { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, X, ArrowRight } from "lucide-react";
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

interface SlotState {
  date: Date | undefined;
  time: string;
  duration: string;
  popoverOpen: boolean;
}

const defaultSlot = (): SlotState => ({ date: undefined, time: "18:00", duration: "2h", popoverOpen: false });

export function AddEventDialog({ open, onOpenChange, groupId }: AddEventDialogProps) {
  const [step, setStep] = useState(0); // 0 = dates, 1 = activities
  const [eventName, setEventName] = useState("Plans");
  const [slots, setSlots] = useState<SlotState[]>([defaultSlot()]);
  const [activities, setActivities] = useState<string[]>([""]);
  const createEvent = useCreateEvent();
  const navigate = useNavigate();

  const updateSlot = (idx: number, patch: Partial<SlotState>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSlot = () => {
    if (slots.length < 3) setSlots((prev) => [...prev, defaultSlot()]);
  };

  const removeSlot = (idx: number) => {
    if (slots.length > 1) setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const addActivity = () => {
    if (activities.length < 3) setActivities((prev) => [...prev, ""]);
  };

  const removeActivity = (idx: number) => {
    if (activities.length > 1) setActivities((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateActivity = (idx: number, value: string) => {
    setActivities((prev) => prev.map((a, i) => (i === idx ? value : a)));
  };

  const allSlotsValid = eventName.trim().length > 0 && slots.length >= 1 && slots.every((s) => s.date && s.time && s.duration);
  const allActivitiesValid = activities.length >= 1 && activities.every((a) => a.trim().length > 0);

  const handleCreate = async () => {
    if (!allSlotsValid || !allActivitiesValid) {
      toast({ title: "Missing fields", description: "Fill all date slots and activities.", variant: "destructive" });
      return;
    }

    const slotInputs: SlotInput[] = slots.map((s) => ({
      date: s.date!,
      time: s.time,
      duration: s.duration,
    }));
    const activityNames = activities.map((a) => a.trim());

    try {
      const event = await createEvent.mutateAsync({
        groupId,
        name: eventName.trim(),
        slots: slotInputs,
        activities: activityNames,
      });
      toast({ title: "Event created!", description: `${slots.length} date slots + ${activities.length} activities added.` });
      resetAndClose();
      navigate(`/e/${event.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setEventName("Plans");
    setSlots([defaultSlot()]);
    setActivities([""]);
    onOpenChange(false);
  };

  const handleDateSelect = useCallback((idx: number, d: Date | undefined) => {
    updateSlot(idx, { date: d, popoverOpen: false });
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Add 1–3 date slots for the group to vote on."
              : "Add 1–3 activity options for the group to vote on."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {["Date Slots", "Activities"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="w-6 h-px bg-border" />}
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
                step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                <span className="w-4 h-4 rounded-full bg-background/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                {label}
              </div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold">Event Name</Label>
              <Input
                placeholder="e.g. BBQ Party, Team Dinner, Hiking Plans"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            {slots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Add date slots for voting (1–3 required)</p>
            )}
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <Label className="text-xs">Date {idx + 1}</Label>
                  <Popover open={slot.popoverOpen} onOpenChange={(o) => updateSlot(idx, { popoverOpen: o })}>
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
                        onSelect={(d) => handleDateSelect(idx, d)}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  disabled={slots.length <= 1}
                  onClick={() => removeSlot(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {slots.length < 3 && (
              <Button variant="outline" size="sm" className="w-full" onClick={addSlot}>
                <Plus className="w-4 h-4 mr-1" /> Add Date Slot
              </Button>
            )}
            <Button
              className="w-full gradient-primary mt-2"
              disabled={!allSlotsValid}
              onClick={() => setStep(1)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Add activities (1–3 required)</p>
            )}
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Activity {idx + 1}</Label>
                  <Input
                    value={act}
                    onChange={(e) => updateActivity(idx, e.target.value)}
                    placeholder="e.g. BBQ, Drinks, Hike..."
                    className="h-9 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  disabled={activities.length <= 1}
                  onClick={() => removeActivity(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {activities.length < 3 && (
              <Button variant="outline" size="sm" className="w-full" onClick={addActivity}>
                <Plus className="w-4 h-4 mr-1" /> Add Activity
              </Button>
            )}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                className="flex-1 gradient-primary"
                disabled={!allActivitiesValid || createEvent.isPending}
                onClick={handleCreate}
              >
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
