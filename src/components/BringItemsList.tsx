import { useState } from "react";
import { Plus, Trash2, Hand } from "lucide-react";

const STEP_COLORS = ["#f00", "#f80", "#fa0", "#fd0", "#af0", "#7f7", "#5f5", "#0f8", "#08f", "#f0f"];
function getStepColor(ratio: number): string {
  const idx = Math.min(Math.floor(ratio * 10), 9);
  return STEP_COLORS[idx];
}
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBringItems, useClaimItem, useUnclaimItem, useDeleteItem, BringItem } from "@/hooks/useItems";
import { AddItemDialog } from "@/components/AddItemDialog";
import { toast } from "@/hooks/use-toast";

interface BringItemsListProps {
  eventId: string;
  isOwner: boolean;
  packedUp?: boolean;
}

export function BringItemsList({ eventId, isOwner, packedUp = false }: BringItemsListProps) {
  const { user } = useAuth();
  const { data: items, isLoading } = useBringItems(eventId);
  const claimItem = useClaimItem();
  const unclaimItem = useUnclaimItem();
  const deleteItem = useDeleteItem();
  const [addOpen, setAddOpen] = useState(false);

  const myClaimCount = items?.filter((item) => item.claims.some(c => c.user_id === user?.id)).length ?? 0;

  const handleClaim = async (item: BringItem) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to claim items." });
      return;
    }
    try {
      await claimItem.mutateAsync({ itemId: item.id, eventId });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUnclaim = async (item: BringItem) => {
    try {
      await unclaimItem.mutateAsync({ itemId: item.id, eventId });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (item: BringItem) => {
    try {
      await deleteItem.mutateAsync({ itemId: item.id, eventId });
      toast({ title: "Item removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          🎒 Bring Items
        </h3>
        {isOwner && !packedUp && (
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const claimCount = item.claims.length;
            const isFull = claimCount >= item.max_quantity;
            const isMyItem = item.claims.some(c => c.user_id === user?.id);
            const densityRatio = item.max_quantity > 0 ? claimCount / item.max_quantity : 0;
            const densityColor = getStepColor(densityRatio);
            const densityPct = Math.round(densityRatio * 100);
            return (
              <div
                key={item.id}
                className="rounded-xl p-4 flex items-center gap-3 transition-all border-2 border-transparent"
                style={{
                  background: `linear-gradient(to right, ${densityColor} 0%, ${densityColor} ${densityPct}%, #1f2937 ${densityPct}%)`,
                }}
              >
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${isFull ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {claimCount}/{item.max_quantity} claimed
                    {isMyItem && <span className="text-primary ml-1">· You claimed</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isFull && !isMyItem && user && !packedUp && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClaim(item)}
                      disabled={claimItem.isPending}
                      className="text-xs"
                    >
                      <Hand className="w-3 h-3 mr-1" />
                      Claim
                    </Button>
                  )}
                  {isMyItem && !packedUp && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnclaim(item)}
                      disabled={unclaimItem.isPending}
                      className="text-xs text-muted-foreground"
                    >
                      Unclaim
                    </Button>
                  )}
                  {isOwner && !packedUp && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item)}
                      disabled={deleteItem.isPending}
                      className="w-8 h-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card p-6 text-center">
          <p className="text-muted-foreground text-sm">
            {packedUp ? "📦 Packed up!" : isOwner ? "Add items for members to claim." : "No items to bring yet."}
          </p>
          {isOwner && !packedUp && (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          )}
        </div>
      )}

      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} eventId={eventId} />
    </div>
  );
}
