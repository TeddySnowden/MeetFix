import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, Users, Vote, UserPlus, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useGroups, useDeleteGroup } from "@/hooks/useGroups";
import { useGroupEventsWithSlots, EventWithSlotInfo, useDeleteEvent } from "@/hooks/useEvents";
import { AddEventDialog } from "@/components/AddEventDialog";

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
  const deleteGroup = useDeleteGroup();
  const deleteEvent = useDeleteEvent();

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
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">
            {group?.name || "Group"}
          </h2>
          {group?.member_count != null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.member_count}{" "}
              {group.member_count === 1 ? "member" : "members"}
            </p>
          )}
        </div>
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
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-muted-foreground">/join/{group.invite_code}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const link = `${window.location.origin}/join/${group.invite_code}`;
                await navigator.clipboard.writeText(link);
                toast({ title: "Copied!", description: link });
              }}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Copy
            </Button>
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
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Events
          </h3>
          {events.map((ev: EventWithSlotInfo) => {
            const slotLabel = ev.first_slot_at
              ? `${format(new Date(ev.first_slot_at), "MMM d")} ${format(
                  new Date(ev.first_slot_at),
                  "HH:mm"
                )}`
              : "No slots";
            const voteLabel = `${ev.total_votes}/${memberCount} votes`;

            return (
              <div
                key={ev.id}
                className="relative w-full bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-all"
              >
                <button
                  onClick={() => navigate(`/e/${ev.id}`)}
                  className="w-full text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {ev.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                      <span>{slotLabel}</span>
                      <span className="text-border">·</span>
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
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-coral flex items-center justify-center shadow-soft">
            <Calendar className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            No events yet
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Tap the + button to create your first event.
          </p>
        </div>
      )}

      {/* FAB */}
      {user && groupId && (
        <button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary shadow-elevated flex items-center justify-center text-primary-foreground active:scale-95 transition-transform z-40"
          aria-label="Add Event Slot"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {groupId && (
        <AddEventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          groupId={groupId}
        />
      )}

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
                deleteEvent.mutate({ eventId: deleteEventId, groupId }, {
                  onSuccess: () => {
                    toast({ title: "Event deleted" });
                    setDeleteEventId(null);
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
    </Layout>
  );
}
