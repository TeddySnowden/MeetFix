import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useGroupEvents, Event } from "@/hooks/useEvents";
import { CreateEventDialog } from "@/components/CreateEventDialog";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups } = useGroups();
  const { data: events, isLoading } = useGroupEvents(groupId);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const group = groups?.find((g) => g.id === groupId);

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
              {group.member_count} {group.member_count === 1 ? "member" : "members"}
            </p>
          )}
        </div>
        {user && (
          <Button
            size="sm"
            className="gradient-primary"
            onClick={() => setEventDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Event
          </Button>
        )}
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
          {events.map((event: Event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/e/${event.id}`)}
              className="w-full bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-all text-left flex items-center gap-4 active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{event.status}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-coral flex items-center justify-center shadow-soft">
            <Calendar className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create an event to start scheduling with your group.
          </p>
          {user && (
            <Button
              className="gradient-primary"
              onClick={() => setEventDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      )}

      {groupId && (
        <CreateEventDialog
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          groupId={groupId}
        />
      )}
    </Layout>
  );
}
