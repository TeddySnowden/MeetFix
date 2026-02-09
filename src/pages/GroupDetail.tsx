import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, Users, Vote } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useGroupEventsWithSlots, EventWithSlotInfo } from "@/hooks/useEvents";
import { AddEventDialog } from "@/components/AddEventDialog";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups } = useGroups();
  const { data: events, isLoading } = useGroupEventsWithSlots(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const group = groups?.find((g) => g.id === groupId);
  const memberCount = group?.member_count ?? 0;

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
      </div>

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
              <button
                key={ev.id}
                onClick={() => navigate(`/e/${ev.id}`)}
                className="w-full bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-all text-left flex items-center gap-4 active:scale-[0.98]"
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
    </Layout>
  );
}
