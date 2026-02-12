import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [createdGroup, setCreatedGroup] = useState<{ id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const createGroup = useCreateGroup();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      <DialogContent className="sm:max-w-md border border-purple-400/40 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.25)]">
        {!createdGroup ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-purple-200 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">Create a Group</DialogTitle>
              <DialogDescription className="text-purple-300/60">
                Name your group and invite friends to join.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="group-name" className="text-purple-200/80">Group name</Label>
              <Input
                id="group-name"
                placeholder="e.g. Weekend Crew, Book Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 bg-white/5 border-purple-500/30 text-purple-100 placeholder:text-purple-300/30 focus:border-purple-400/60 focus:shadow-[0_0_12px_rgba(168,85,247,0.3)] focus-visible:ring-purple-500/40"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!name.trim() || createGroup.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
              >
                {createGroup.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <DialogTitle className="flex items-center gap-2 text-purple-200 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                Group Created!
              </DialogTitle>
              <DialogDescription className="text-purple-300/60">
                Share this invite link so others can join your group.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 p-3 bg-white/5 border border-purple-500/20 rounded-lg">
                <Link className="w-4 h-4 text-cyan-400/70 flex-shrink-0" />
                <span className="text-sm text-purple-200 truncate flex-1">{inviteLink}</span>
              </div>
              <Button onClick={handleCopy} className="w-full bg-white/5 border-purple-500/30 text-purple-200 hover:bg-white/10 hover:border-purple-400/50 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]" variant="outline">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-cyan-400" />
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
              <Button onClick={() => {
                const gId = createdGroup?.id;
                handleClose(false);
                if (gId) navigate(`/g/${gId}?onboarding=1`);
              }} className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
