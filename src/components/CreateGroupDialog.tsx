import { useState } from "react";
import { Plus, Copy, Check, Link } from "lucide-react";
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
import { useCreateGroup } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [createdGroup, setCreatedGroup] = useState<{ invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const createGroup = useCreateGroup();
  const { user } = useAuth();

  const inviteLink = createdGroup
    ? `${window.location.origin}/join/${createdGroup.invite_code}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const group = await createGroup.mutateAsync(name.trim());
      setCreatedGroup(group);
      toast({
        title: "Group created!",
        description: "Share the invite link with your friends.",
      });
    } catch (err: any) {
      toast({
        title: "Error creating group",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share it with your group." });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setName("");
      setCreatedGroup(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!createdGroup ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create a Group</DialogTitle>
              <DialogDescription>
                Name your group and invite friends to join.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="e.g. Weekend Crew, Book Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!name.trim() || createGroup.isPending}
                className="w-full gradient-primary"
              >
                {createGroup.isPending ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                Group Created!
              </DialogTitle>
              <DialogDescription>
                Share this invite link so others can join your group.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{inviteLink}</span>
              </div>
              <Button onClick={handleCopy} className="w-full" variant="outline">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)} className="w-full gradient-primary">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
