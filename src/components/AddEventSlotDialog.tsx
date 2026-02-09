import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronRight, Loader2 } from "lucide-react";
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

interface AddEventSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

// Generate time options in 15-min increments
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
}

const defaultSlot = (): SlotState => ({
  date: undefined,
  time: "18:00",
  duration: "2h",
});

export function AddEventSlotDialog({
  open,
  onOpenChange,
  groupId,
}: AddEventSlotDialogProps) {
  const [step, setStep] = useState(0); // 0,1,2
  const [slots, setSlots] = useState<SlotState[]>([
    defaultSlot(),
    defaultSlot(),
    defaultSlot(),
  ]);
  const [eventName, setEventName] = useState("Meeting");
  const createEvent = useCreateEvent();
  const navigate = useNavigate();

  const updateSlot = (idx: number, patch: Partial<SlotState>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const currentSlot = slots[step];
  const isLastStep = step === 2;
  const canProceed = currentSlot?.date && currentSlot?.time && currentSlot?.duration;
  const canCreate = canProceed && eventName.trim();

  const handleNext = () => {
    if (isLastStep) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    const validSlots: SlotInput[] = slots
      .filter((s) => s.date)
      .map((s) => ({
        date: s.date!,
        time: s.time,
        duration: s.duration,
      }));

    if (validSlots.length !== 3) return;

    try {
      const event = await createEvent.mutateAsync({
        groupId,
        name: eventName.trim(),
        slots: validSlots,
      });
      toast({ title: "Event created!", description: "3 time slots added." });
      resetAndClose();
      navigate(`/e/${event.id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSlots([defaultSlot(), defaultSlot(), defaultSlot()]);
    setEventName("Meeting");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAndClose();
        else onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Event Slots</DialogTitle>
          <DialogDescription>
            Pick 3 time options for the group to vote on.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-medium mb-3">
          Slot {step + 1} of 3
        </p>

        {/* Slot form */}
        <div className="space-y-4">
          {/* Date */}
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1.5",
                    !currentSlot.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentSlot.date
                    ? format(currentSlot.date, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentSlot.date}
                  onSelect={(d) => updateSlot(step, { date: d })}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div>
            <Label>Time</Label>
            <Select
              value={currentSlot.time}
              onValueChange={(v) => updateSlot(step, { time: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {TIMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <Label>Duration</Label>
            <Select
              value={currentSlot.duration}
              onValueChange={(v) => updateSlot(step, { duration: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event name on last step */}
          {isLastStep && (
            <div>
              <Label>Event Name</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Team Lunch, Game Night"
                className="mt-1.5"
              />
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2 mt-4">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {!isLastStep ? (
            <Button
              className="flex-1 gradient-primary"
              disabled={!canProceed}
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1 gradient-primary"
              disabled={!canCreate || createEvent.isPending}
              onClick={handleCreate}
            >
              {createEvent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Event"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
