import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateEvent, SlotInput } from "@/hooks/useEvents";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function CreateEventDialog({ open, onOpenChange, groupId }: CreateEventDialogProps) {
  const [name, setName] = useState("Meeting");
  const createEvent = useCreateEvent();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate 3 default slots (next 3 days at 18:00)
    const defaultSlots: SlotInput[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      defaultSlots.push({ date: d, time: "18:00", duration: "2h" });
    }

    try {
      const event = await createEvent.mutateAsync({
        groupId,
        name: name.trim(),
        slots: defaultSlots,
      });
      toast({ title: "Event created!", description: "3 default time slots added." });
      onOpenChange(false);
      setName("Meeting");
      navigate(`/e/${event.id}`);
    } catch (err: any) {
      toast({
        title: "Error creating event",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Set a name and we'll add default time slots for the next 3 days.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="event-name">Event name</Label>
            <Input
              id="event-name"
              placeholder="e.g. Team Lunch, Game Night"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || createEvent.isPending}
              className="w-full gradient-primary"
            >
              {createEvent.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
