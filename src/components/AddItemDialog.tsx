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
import { useAddItem } from "@/hooks/useItems";
import { toast } from "@/hooks/use-toast";

const EMOJI_OPTIONS = ["📦", "🍕", "🥤", "🎂", "🍿", "🧊", "🍺", "🎵", "🎮", "🪑", "🍽️", "🔥"];

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function AddItemDialog({ open, onOpenChange, eventId }: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const addItem = useAddItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addItem.mutateAsync({ eventId, name: name.trim(), emoji });
      toast({ title: "Item added!", description: `${emoji} ${name.trim()}` });
      onOpenChange(false);
      setName("");
      setEmoji("📦");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Item to Bring</DialogTitle>
            <DialogDescription>What should someone bring to the event?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="item-name">Item name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Chips, Drinks, Speakers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                      emoji === e
                        ? "bg-primary/10 border-2 border-primary scale-110"
                        : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || addItem.isPending}
              className="w-full gradient-primary"
            >
              {addItem.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
