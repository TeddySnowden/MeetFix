import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Vote,
  UserPlus,
  Trash2,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  Settings,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useGroups, useDeleteGroup, useUpdateGroup } from "@/hooks/useGroups";
import { useGroupEventsWithSlots, EventWithSlotInfo, useDeleteEvent } from "@/hooks/useEvents";
import { AddEventDialog } from "@/components/AddEventDialog";
import { GlitchText } from "@/components/GlitchText";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups } = useGroups();
  const { data: events, isLoading } = useGroupEventsWithSlots(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [maxMembersOpen, setMaxMembersOpen] = useState(false);
  const [maxMembersValue, setMaxMembersValue] = useState("");
  const deleteGroup = useDeleteGroup();
  const deleteEvent = useDeleteEvent();
  const updateGroup = useUpdateGroup();

  const group = groups?.find((g) => g.id === groupId);

  // Auto-open wizard after group creation
  useEffect(() => {
    if (searchParams.get("onboarding") === "1") {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const memberCount = group?.member_count ?? 0;
  const isOwner = user?.id === group?.created_by;

  return (
    <Layout>
      <Header />

      {/* Back + group name */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-purple-400/30 hover:border-purple-400/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-purple-300" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-purple-100 truncate drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{group?.name || "Group"}</h2>
          {group?.member_count != null && (
            <p className="text-xs text-purple-300/60 flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400/70" />
              {group.member_count} {group.member_count === 1 ? "member" : "members"}
            </p>
          )}
        </div>
        {user && groupId && (
          <button
            onClick={() => setDialogOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_16px_rgba(168,85,247,0.4)] hover:shadow-[0_0_24px_rgba(168,85,247,0.6)] active:scale-95 transition-all"
            aria-label="Create Event"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={() => setDeleteGroupOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Invite row */}
      {group && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {memberCount}/{group.max_members ?? 999}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-muted-foreground">/join/{group.invite_code}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Copy
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    const link = `${window.location.origin}/join/${group.invite_code}`;
                    await navigator.clipboard.writeText(link);
                    toast({ title: "Copied!", description: link });
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setMaxMembersValue(String(group.max_members ?? 999));
                        setMaxMembersOpen(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Set Max Members…
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (!groupId) return;
                        const newCode = generateInviteCode();
                        updateGroup.mutate(
                          { groupId, updates: { invite_code: newCode } },
                          {
                            onSuccess: () =>
                              toast({ title: "New invite code generated", description: `/join/${newCode}` }),
                            onError: (err) =>
                              toast({ title: "Error", description: err.message, variant: "destructive" }),
                          },
                        );
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate New Code
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Events</h3>
          {(() => {
            const now = Date.now();
            // Calculate density for each event based on days until event
            const eventsWithDensity = events.map((ev: EventWithSlotInfo) => {
              const eventDate = ev.first_slot_at ? new Date(ev.first_slot_at).getTime() : null;
              const daysToEvent = eventDate ? Math.max(0, Math.floor((eventDate - now) / 86400000)) : 999;
              const stepIndex = Math.max(0, Math.min(10, 10 - daysToEvent));
              const densityRatio = stepIndex / 10;
              return { ev, densityRatio };
            });
            const maxRatio = Math.max(...eventsWithDensity.map((e) => e.densityRatio));

            return eventsWithDensity.map(({ ev, densityRatio }) => {
              const STEP_COLORS = ["#f00", "#f80", "#fa0", "#fd0", "#af0", "#7f7", "#5f5", "#0f8", "#08f", "#f0f"];
              const colorIdx = Math.min(Math.floor(densityRatio * 10), 9);
              const color = STEP_COLORS[colorIdx];
              const pct = Math.round(densityRatio * 100);
              const isClosest = densityRatio > 0 && densityRatio === maxRatio;

              const slotLabel = ev.first_slot_at
                ? `${format(new Date(ev.first_slot_at), "MMM d")} ${format(new Date(ev.first_slot_at), "HH:mm")}`
                : "No slots";
              const voteLabel = `${ev.total_votes}/${memberCount} votes`;

              return (
                <div
                  key={ev.id}
                  className={`relative w-full rounded-xl p-4 shadow-soft hover:shadow-card transition-all ${isClosest ? "cyberpunk-glitch" : ""}`}
                  style={{
                    background:
                      densityRatio > 0
                        ? `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #1f2937 ${pct}%)`
                        : undefined,
                  }}
                >
                  <button
                    onClick={() => navigate(`/e/${ev.id}`)}
                    className="w-full text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {isClosest ? <GlitchText text={ev.name} /> : ev.name}
                      </h3>
                      <p className="text-sm text-white/70 truncate flex items-center gap-1.5">
                        <span>{slotLabel}</span>
                        <span className="text-white/30">·</span>
                        <Vote className="w-3 h-3 inline" />
                        <span>{voteLabel}</span>
                      </p>
                    </div>
                    </button>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {(isOwner || ev.created_by === user?.id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4 text-white/60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEventId(ev.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-coral flex items-center justify-center shadow-soft">
            <Calendar className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Tap the + button to create your first event.</p>
        </div>
      )}

      {/* FAB removed – create button is now in header */}

      {groupId && <AddEventDialog open={dialogOpen} onOpenChange={setDialogOpen} groupId={groupId} />}

      {/* Delete Group AlertDialog */}
      <AlertDialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group, all events, votes, and items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!groupId) return;
                deleteGroup.mutate(groupId, {
                  onSuccess: () => {
                    toast({ title: "Group deleted" });
                    navigate("/");
                  },
                  onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Event AlertDialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event, its time slots, activities, votes, and items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteEventId || !groupId) return;
                deleteEvent.mutate(
                  { eventId: deleteEventId, groupId },
                  {
                    onSuccess: () => {
                      toast({ title: "Event deleted" });
                      setDeleteEventId(null);
                    },
                    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                  },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Max Members Dialog */}
      <Dialog open={maxMembersOpen} onOpenChange={setMaxMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Max Members</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="maxMembers">Maximum members (1–999)</Label>
            <Input
              id="maxMembers"
              type="number"
              min={1}
              max={999}
              value={maxMembersValue}
              onChange={(e) => setMaxMembersValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaxMembersOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const val = parseInt(maxMembersValue, 10);
                if (!groupId || isNaN(val) || val < 1 || val > 999) {
                  toast({ title: "Enter a number between 1 and 999", variant: "destructive" });
                  return;
                }
                updateGroup.mutate(
                  { groupId, updates: { max_members: val } },
                  {
                    onSuccess: () => {
                      toast({ title: "Max members updated" });
                      setMaxMembersOpen(false);
                    },
                    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                  },
                );
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
