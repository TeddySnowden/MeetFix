import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Clock, Trophy, Calendar, Sparkles, PackageCheck, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { FinalizeDialog } from "@/components/FinalizeDialog";
import { BringItemsList } from "@/components/BringItemsList";
import { VoteDensityBar } from "@/components/VoteDensityBar";
import { VoteButton } from "@/components/VoteButton";
import { AutoFixVoteButton } from "@/components/AutoFixVoteButton";
import { useAuth } from "@/hooks/useAuth";
import {
  useEventDetail,
  useTimeSlots,
  useToggleVote,
  useActivities,
  useToggleActivityVote,
  usePackUpEvent,
  useReopenEvent,
  TimeSlot,
  Activity,
} from "@/hooks/useEvents";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { downloadIcsFile } from "@/lib/generateIcs";
import { useScheduleNotifications } from "@/hooks/useNotifications";
import { useBringItems } from "@/hooks/useItems";

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
  const { data: activities, isLoading: activitiesLoading } = useActivities(eventId);
  const toggleVote = useToggleVote();
  const toggleActivityVote = useToggleActivityVote();
  const packUpEvent = usePackUpEvent();
  const reopenEvent = useReopenEvent();
  const scheduleNotifications = useScheduleNotifications();
  const { data: bringItems } = useBringItems(eventId);
  const queryClient = useQueryClient();
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(1);

  // Fetch group member count for density ratio
  useEffect(() => {
    if (!event?.group_id) return;
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", event.group_id)
      .then(({ count }) => {
        if (count && count > 0) setMemberCount(count);
      });
  }, [event?.group_id]);

  // Realtime subscription for packed_up changes
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event-packup-${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${eventId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["event", eventId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, queryClient]);

  const isFinalized = event?.status === "finalized";
  const isOwner = user && event && user.id === event.created_by;
  const isPackedUp = event?.packed_up ?? false;

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

  const handleActivityVote = (act: Activity) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in with Google to vote." });
      return;
    }
    if (isFinalized) return;
    toggleActivityVote.mutate({
      eventId: act.event_id,
      activityId: act.id,
      currentlyVoted: act.voted_by_me,
    });
  };

  const isLoading = eventLoading || slotsLoading || activitiesLoading;
  const finalizedSlot = isFinalized && event?.finalized_date
    ? formatSlot(event.finalized_date)
    : null;

  const totalSlotVotes = useMemo(() => (slots || []).reduce((s, sl) => s + sl.vote_count, 0), [slots]);
  const maxSlotVotes = useMemo(() => Math.max(0, ...(slots || []).map(s => s.vote_count)), [slots]);
  const totalActivityVotes = useMemo(() => (activities || []).reduce((s, a) => s + a.vote_count, 0), [activities]);
  const maxActivityVotes = useMemo(() => Math.max(0, ...(activities || []).map(a => a.vote_count)), [activities]);

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
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50); // Heavy haptic for finalize
              setFinalizeOpen(true);
            }}
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
            {event?.finalized_activity && (
              <p className="text-sm text-primary font-medium mt-0.5">🎯 {event.finalized_activity}</p>
            )}
          </div>
        </div>
      )}

      {/* ICS Calendar Download - finalized events */}
      {isFinalized && event?.finalized_date && (
        <div className="mb-4">
          <Button
            className="w-full font-bold text-base tracking-wide rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #0ff, #0f8)',
              color: '#000',
              border: '2px solid #0ff',
              boxShadow: '0 0 12px #0ff4, 0 0 24px #0f84',
            }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              const myItems = (bringItems || [])
                .filter((item: any) => (item.claims || []).some((c: any) => c.user_id === user?.id))
                .map((item: any) => {
                  const myClaimCount = (item.claims || []).filter((c: any) => c.user_id === user?.id).length;
                  return `${item.emoji || "📦"} ${item.name} x${myClaimCount}`;
                });
              const desc = [
                event.finalized_activity ? `Activity: ${event.finalized_activity}` : "",
                myItems.length ? `\nYour Items:\n${myItems.join("\n")}` : "",
              ].filter(Boolean).join("\n");

              downloadIcsFile({
                title: `${event.name} - Items Packed ☑️`,
                description: desc,
                startDate: event.finalized_date!,
              });
              toast({ title: "Calendar file downloaded! 📅" });
            }}
          >
            <Download className="w-5 h-5 mr-2" />
            Sync Calendar 📅
          </Button>
        </div>
      )}

      {/* Pack Up / Reopen buttons - owner only, finalized events */}
      {isFinalized && isOwner && (
        <div className="flex gap-2 mb-4">
          <Button
            className="flex-1 font-bold text-base tracking-wide rounded-xl transition-all"
            style={{
              background: isPackedUp ? '#374151' : '#0f8',
              color: isPackedUp ? '#9ca3af' : '#000',
              border: `2px solid ${isPackedUp ? '#4b5563' : '#0f8'}`,
              boxShadow: isPackedUp ? 'none' : '0 0 12px #0f8, 0 0 24px #0f844',
              cursor: isPackedUp ? 'default' : 'pointer',
            }}
            disabled={isPackedUp || packUpEvent.isPending}
            onClick={async () => {
              if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
              await packUpEvent.mutateAsync({ eventId: eventId! });
              if (event?.finalized_date && event?.group_id) {
                scheduleNotifications.mutate({
                  eventId: eventId!,
                  eventName: event.name,
                  finalizedDate: event.finalized_date,
                  groupId: event.group_id,
                });
              }
              toast({ title: "Packed up! Notifications scheduled 🔔" });
            }}
          >
            <PackageCheck className="w-5 h-5 mr-2" />
            {isPackedUp ? "Packed ✅" : "Pack Up ☑️"}
          </Button>
          <Button
            className="flex-1 font-bold text-base tracking-wide rounded-xl transition-all"
            style={{
              background: '#dc2626',
              color: '#fff',
              border: '2px solid #ef4444',
              boxShadow: '0 0 12px #dc262688, 0 0 24px #dc262644',
            }}
            disabled={reopenEvent.isPending}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
              reopenEvent.mutate({ eventId: eventId! });
            }}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reopen ☒️
          </Button>
        </div>
      )}

      {/* Reopen for non-finalized packed events (edge case) */}
      {!isFinalized && isOwner && isPackedUp && (
        <Button
          className="w-full mb-4 font-bold text-base tracking-wide rounded-xl transition-all"
          style={{
            background: '#dc2626',
            color: '#fff',
            border: '2px solid #ef4444',
            boxShadow: '0 0 12px #dc262688, 0 0 24px #dc262644',
          }}
          disabled={reopenEvent.isPending}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            reopenEvent.mutate({ eventId: eventId! });
          }}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reopen ☒️
        </Button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Auto-Fix Vote */}
          {!isFinalized && eventId && (
            <div className="mb-4">
              <AutoFixVoteButton eventId={eventId} />
            </div>
          )}

          {/* Time Slots */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Time Slots
            </h3>
            {slots && slots.length > 0 ? (
              slots.map((slot) => {
                const { day, time } = formatSlot(slot.slot_at);
                const isWinner = isFinalized && event?.finalized_slot_id === slot.id;
                return (
                  <div key={slot.id}>
                    <VoteButton
                      voted={slot.voted_by_me}
                      disabled={toggleVote.isPending || isFinalized}
                      isWinner={isWinner}
                      voteRatio={totalSlotVotes > 0 ? slot.vote_count / totalSlotVotes : 0}
                      voteCount={slot.vote_count}
                      memberCount={memberCount}
                      onVoteYes={() => handleVote(slot)}
                      onVoteNo={() => handleVote(slot)}
                      className={`w-full rounded-xl p-4 shadow-soft transition-all text-left ${
                        isFinalized ? "opacity-70 cursor-default" : "active:scale-[0.98]"
                      } ${
                        isWinner
                          ? "bg-primary/10 border-2 border-primary"
                          : slot.voted_by_me
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border-2 border-transparent hover:shadow-card"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isWinner || slot.voted_by_me ? "gradient-primary" : "bg-secondary"
                      }`}>
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
                    </VoteButton>
                    <VoteDensityBar
                      voteCount={slot.vote_count}
                      totalVotes={totalSlotVotes}
                      isHighest={slot.vote_count === maxSlotVotes && maxSlotVotes > 0}
                    />
                  </div>
                );
              })
            ) : (
              <div className="bg-card rounded-2xl shadow-card p-6 text-center">
                <p className="text-muted-foreground">No time slots yet.</p>
              </div>
            )}
          </div>

          {/* Activities */}
          {activities && activities.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Activities
              </h3>
              {activities.map((act) => {
                const isWinner = isFinalized && event?.finalized_activity === act.name;
                return (
                  <div key={act.id}>
                    <VoteButton
                      voted={act.voted_by_me}
                      disabled={toggleActivityVote.isPending || isFinalized}
                      isWinner={isWinner}
                      voteRatio={totalActivityVotes > 0 ? act.vote_count / totalActivityVotes : 0}
                      voteCount={act.vote_count}
                      memberCount={memberCount}
                      onVoteYes={() => handleActivityVote(act)}
                      onVoteNo={() => handleActivityVote(act)}
                      className={`w-full rounded-xl p-4 shadow-soft transition-all text-left ${
                        isFinalized ? "opacity-70 cursor-default" : "active:scale-[0.98]"
                      } ${
                        isWinner
                          ? "bg-primary/10 border-2 border-primary"
                          : act.voted_by_me
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border-2 border-transparent hover:shadow-card"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isWinner || act.voted_by_me ? "gradient-primary" : "bg-secondary"
                      }`}>
                        {isWinner ? (
                          <Trophy className="w-6 h-6 text-primary-foreground" />
                        ) : act.voted_by_me ? (
                          <Check className="w-6 h-6 text-primary-foreground" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{act.name}</h4>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-foreground">{act.vote_count}</span>
                        <p className="text-xs text-muted-foreground">
                          {act.vote_count === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                    </VoteButton>
                    <VoteDensityBar
                      voteCount={act.vote_count}
                      totalVotes={totalActivityVotes}
                      isHighest={act.vote_count === maxActivityVotes && maxActivityVotes > 0}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!user && !isFinalized && (
            <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Sign in to vote on time slots and activities.
              </p>
              <GoogleSignInButton />
            </div>
          )}
        </>
      )}

      {/* Bring Items - shown after finalization */}
      {isFinalized && eventId && (
        <div className="mt-6">
          <BringItemsList eventId={eventId} isOwner={!!isOwner} packedUp={isPackedUp} />
        </div>
      )}

      {eventId && slots && activities && (
        <FinalizeDialog
          open={finalizeOpen}
          onOpenChange={setFinalizeOpen}
          eventId={eventId}
          slots={slots}
          activities={activities}
        />
      )}
    </Layout>
  );
}
