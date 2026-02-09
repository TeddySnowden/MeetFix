import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { FinalizeDialog } from "@/components/FinalizeDialog";
import { BringItemsList } from "@/components/BringItemsList";
import { useAuth } from "@/hooks/useAuth";
import { useEventDetail, useTimeSlots, useToggleVote, TimeSlot } from "@/hooks/useEvents";
import { toast } from "@/hooks/use-toast";

function formatSlot(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: event, isLoading: eventLoading } = useEventDetail(eventId);
  const { data: slots, isLoading: slotsLoading } = useTimeSlots(eventId);
  const toggleVote = useToggleVote();
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const isFinalized = event?.status === "finalized";
  const isOwner = user && event && user.id === event.created_by;

  const handleVote = (slot: TimeSlot) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in with Google to vote." });
      return;
    }
    if (isFinalized) return;
    toggleVote.mutate({
      eventId: slot.event_id,
      timeSlotId: slot.id,
      currentlyVoted: slot.voted_by_me,
    });
  };

  const isLoading = eventLoading || slotsLoading;
  const finalizedSlot = isFinalized && event?.finalized_date
    ? formatSlot(event.finalized_date)
    : null;

  return (
    <Layout>
      <Header />

      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">
            {event?.name || "Event"}
          </h2>
          {event && (
            <p className={`text-xs capitalize ${isFinalized ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {isFinalized ? "✅ Finalized" : "🗳️ Voting"}
            </p>
          )}
        </div>
        {isOwner && !isFinalized && slots && slots.length > 0 && (
          <Button
            size="sm"
            className="gradient-primary"
            onClick={() => setFinalizeOpen(true)}
          >
            <Trophy className="w-4 h-4 mr-1" />
            Finalize
          </Button>
        )}
      </div>

      {/* Finalized banner */}
      {isFinalized && finalizedSlot && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">{finalizedSlot.day}</p>
            <p className="text-sm text-muted-foreground">{finalizedSlot.time}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Time Slots
          </h3>

          {slots && slots.length > 0 ? (
            slots.map((slot) => {
              const { day, time } = formatSlot(slot.slot_at);
              const isWinner = isFinalized && event?.finalized_slot_id === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => handleVote(slot)}
                  disabled={toggleVote.isPending || isFinalized}
                  className={`w-full rounded-xl p-4 shadow-soft transition-all text-left flex items-center gap-4 ${
                    isFinalized ? "opacity-70 cursor-default" : "active:scale-[0.98]"
                  } ${
                    isWinner
                      ? "bg-primary/10 border-2 border-primary"
                      : slot.voted_by_me
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border-2 border-transparent hover:shadow-card"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isWinner
                        ? "gradient-primary"
                        : slot.voted_by_me
                          ? "gradient-primary"
                          : "bg-secondary"
                    }`}
                  >
                    {isWinner ? (
                      <Trophy className="w-6 h-6 text-primary-foreground" />
                    ) : slot.voted_by_me ? (
                      <Check className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{day}</h4>
                    <p className="text-sm text-muted-foreground">{time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-foreground">{slot.vote_count}</span>
                    <p className="text-xs text-muted-foreground">
                      {slot.vote_count === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="bg-card rounded-2xl shadow-card p-6 text-center">
              <p className="text-muted-foreground">No time slots yet.</p>
            </div>
          )}

          {!user && !isFinalized && (
            <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in to vote on time slots.
              </p>
              <GoogleSignInButton />
            </div>
          )}
        </div>
      )}

      {/* Bring Items - shown after finalization */}
      {isFinalized && eventId && (
        <div className="mt-6">
          <BringItemsList eventId={eventId} isOwner={!!isOwner} />
        </div>
      )}

      {eventId && slots && (
        <FinalizeDialog
          open={finalizeOpen}
          onOpenChange={setFinalizeOpen}
          eventId={eventId}
          slots={slots}
        />
      )}
    </Layout>
  );
}
