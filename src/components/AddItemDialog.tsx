import { useState, useRef, useEffect } from "react";
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
import { suggestEmojis, type EmojiSuggestion } from "@/lib/emojiSuggest";

const EMOJI_OPTIONS = ["📦", "🍕", "🥤", "🎂", "🍿", "🧊", "🍺", "🎵", "🎮", "🪑", "🍽️", "🔥"];

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function AddItemDialog({ open, onOpenChange, eventId }: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [maxQuantity, setMaxQuantity] = useState(6);
  const [suggestions, setSuggestions] = useState<EmojiSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [emojiManuallySet, setEmojiManuallySet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const addItem = useAddItem();

  useEffect(() => {
    if (!name.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const results = suggestEmojis(name, 5);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);

    // Auto-preview first suggestion emoji (unless user manually picked one)
    if (results.length > 0 && !emojiManuallySet) {
      setEmoji(results[0].emoji);
    } else if (results.length === 0 && !emojiManuallySet) {
      setEmoji("📦");
    }
  }, [name, emojiManuallySet]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addItem.mutateAsync({
        eventId,
        name: name.trim(),
        emoji,
        maxQuantity: Math.max(1, Math.min(50, maxQuantity)),
      });
      toast({ title: "Item added!", description: `${emoji} ${name.trim()} (max ${maxQuantity})` });
      onOpenChange(false);
      setName("");
      setEmoji("📦");
      setMaxQuantity(6);
      setEmojiManuallySet(false);
      setSuggestions([]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSuggestionClick = (s: EmojiSuggestion) => {
    setName(s.keyword.charAt(0).toUpperCase() + s.keyword.slice(1));
    setEmoji(s.emoji);
    setEmojiManuallySet(true);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
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
            {/* Name input with emoji autocomplete */}
            <div className="relative">
              <Label htmlFor="item-name">Item name</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                  {emoji}
                </span>
                <Input
                  ref={inputRef}
                  id="item-name"
                  placeholder="e.g. Chips, Drinks, Speakers"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!emojiManuallySet) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.keyword}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-foreground capitalize">{s.keyword}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Existing emoji picker (override) */}
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEmoji(e);
                      setEmojiManuallySet(true);
                    }}
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

            {/* Limit input */}
            <div>
              <Label htmlFor="item-limit">Max quantity</Label>
              <Input
                id="item-limit"
                type="number"
                min={1}
                max={50}
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(Number(e.target.value) || 1)}
                className="mt-2 w-24"
              />
              <p className="text-xs text-muted-foreground mt-1">How many should be brought (1–50)</p>
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
