import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNearestFinalizedEvent } from "@/hooks/useNearestEvent";
import { useBringItems } from "@/hooks/useItems";
import { useTimeline, useUpsertTimeline } from "@/hooks/useTimeline";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Sparkles, ShoppingCart, Shirt, Car, CheckCircle2, Circle } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

const GetReady = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: heroEvent, isLoading: eventLoading } = useNearestFinalizedEvent();
  const { data: items } = useBringItems(heroEvent?.id);
  const { data: myTimeline } = useTimeline(heroEvent?.id);
  const upsertTimeline = useUpsertTimeline();

  const [countdown, setCountdown] = useState("");
  const [timePickerOpen, setTimePickerOpen] = useState<"dress" | "travel" | null>(null);
  const [timeValue, setTimeValue] = useState("");

  // Countdown timer
  useEffect(() => {
    if (!heroEvent?.finalized_date) return;

    const tick = () => {
      const now = new Date();
      const target = new Date(heroEvent.finalized_date!);
      const diff = differenceInSeconds(target, now);

      if (diff <= 0) {
        setCountdown("Now!");
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${mins}m`);
      setCountdown(parts.join(" "));
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [heroEvent?.finalized_date]);

  // Shopping progress: claimed items / total items
  const shopProgress = useMemo(() => {
    if (!items?.length) return 0;
    const claimed = items.filter((i) => i.claims.length >= i.max_quantity).length;
    return Math.round((claimed / items.length) * 100);
  }, [items]);

  // Dress/Travel progress: how close the set time is to event time
  const calcTimeProgress = (setTime: string | null | undefined, hoursBeforeLabel: number) => {
    if (!setTime || !heroEvent?.finalized_date) return 0;
    const eventDate = new Date(heroEvent.finalized_date);
    const userTime = new Date(setTime);
    const now = new Date();

    if (now >= userTime) return 100;

    const totalWindow = differenceInSeconds(eventDate, new Date(eventDate.getTime() - hoursBeforeLabel * 3600000));
    const elapsed = differenceInSeconds(now, new Date(eventDate.getTime() - hoursBeforeLabel * 3600000));

    if (totalWindow <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((elapsed / totalWindow) * 100)));
  };

  const dressProgress = calcTimeProgress(myTimeline?.dress_up_time, 1);
  const travelProgress = calcTimeProgress(myTimeline?.travel_time, 0.5);

  const DRESS_PRESETS = [15, 30, 45, 60, 120];
  const TRAVEL_PRESETS = [30, 60, 90, 120];

  // Recalculate both times from minutes: dress_start = event - (dress + travel), travel_start = event - travel
  const recalcTimes = (dressMin: number | null, travelMin: number | null, eventDate: Date) => {
    const travelMs = (travelMin || 0) * 60000;
    const dressMs = (dressMin || 0) * 60000;
    const travelTime = travelMin != null ? new Date(eventDate.getTime() - travelMs).toISOString() : null;
    const dressUpTime = dressMin != null ? new Date(eventDate.getTime() - dressMs - travelMs).toISOString() : null;
    return { dressUpTime, travelTime };
  };

  const handlePreset = async (minutes: number) => {
    if (!heroEvent?.id || !heroEvent.finalized_date) return;
    const eventDate = new Date(heroEvent.finalized_date);

    const currentDressMin = myTimeline?.dress_minutes ?? null;
    const currentTravelMin = myTimeline?.travel_minutes ?? null;

    const newDressMin = timePickerOpen === "dress" ? minutes : currentDressMin;
    const newTravelMin = timePickerOpen === "travel" ? minutes : currentTravelMin;

    const { dressUpTime, travelTime } = recalcTimes(newDressMin, newTravelMin, eventDate);

    await upsertTimeline.mutateAsync({
      eventId: heroEvent.id,
      dressUpTime,
      travelTime,
      dressMinutes: newDressMin,
      travelMinutes: newTravelMin,
    });

    setTimePickerOpen(null);
    setTimeValue("");
  };

  const handleSetTime = async () => {
    if (!heroEvent?.id || !timeValue || !heroEvent.finalized_date) return;

    const eventDate = new Date(heroEvent.finalized_date);
    const [h, m] = timeValue.split(":").map(Number);
    const targetTime = new Date(eventDate);
    targetTime.setHours(h, m, 0, 0);

    // Derive minutes from the exact time input
    const diffMinutes = Math.round((eventDate.getTime() - targetTime.getTime()) / 60000);
    if (diffMinutes < 0) return;

    const currentDressMin = myTimeline?.dress_minutes ?? null;
    const currentTravelMin = myTimeline?.travel_minutes ?? null;

    const newDressMin = timePickerOpen === "dress" ? diffMinutes : currentDressMin;
    const newTravelMin = timePickerOpen === "travel" ? diffMinutes : currentTravelMin;

    const { dressUpTime, travelTime } = recalcTimes(newDressMin, newTravelMin, eventDate);

    await upsertTimeline.mutateAsync({
      eventId: heroEvent.id,
      dressUpTime,
      travelTime,
      dressMinutes: newDressMin,
      travelMinutes: newTravelMin,
    });

    setTimePickerOpen(null);
    setTimeValue("");
  };

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <p className="text-white/60">Sign in to use Get Ready.</p>
      </div>
    );
  }

  if (!heroEvent) {
    return (
      <div className="min-h-screen bg-black px-6 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No upcoming events</h2>
          <p className="text-white/50">Finalize an event to start getting ready!</p>
        </div>
      </div>
    );
  }

  const formattedDate = heroEvent.finalized_date
    ? format(new Date(heroEvent.finalized_date), "MMM d, HH:mm")
    : "TBD";

  const formatTimeOnly = (iso: string | null | undefined) => {
    if (!iso) return null;
    return format(new Date(iso), "HH:mm");
  };

  const timelineSteps = [
    {
      label: "Prepare",
      icon: Sparkles,
      offset: "T-24h",
      progress: 20,
      color: "from-purple-500 to-purple-700",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-400",
      action: null,
    },
    {
      label: "Shop",
      icon: ShoppingCart,
      offset: "T-4h",
      progress: shopProgress,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/20",
      textColor: "text-amber-400",
      detail: items ? `${items.filter((i) => i.claims.length >= i.max_quantity).length}/${items.length} items` : null,
      action: null,
    },
    {
      label: "Dress Up",
      icon: Shirt,
      offset: "T-1h",
      progress: dressProgress,
      color: "from-cyan-400 to-teal-500",
      bgColor: "bg-cyan-500/20",
      textColor: "text-cyan-400",
      detail: myTimeline?.dress_up_time
        ? `${formatTimeOnly(myTimeline.dress_up_time)}${myTimeline.dress_minutes ? ` (${myTimeline.dress_minutes}m prep${myTimeline.travel_minutes ? ` + ${myTimeline.travel_minutes}m travel` : ""})` : ""}`
        : null,
      action: "dress" as const,
    },
    {
      label: "Travel",
      icon: Car,
      offset: "T-0h",
      progress: travelProgress,
      color: "from-emerald-400 to-green-500",
      bgColor: "bg-emerald-500/20",
      textColor: "text-emerald-400",
      detail: myTimeline?.travel_time
        ? `${formatTimeOnly(myTimeline.travel_time)}${myTimeline.travel_minutes ? ` (${myTimeline.travel_minutes}m)` : ""}`
        : null,
      action: "travel" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 mb-4">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      {/* Hero */}
      <div className="mx-6 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold tracking-widest uppercase text-white/80">Get Ready</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{heroEvent.name}</h1>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-2xl px-4 py-3 text-center">
          <span className="text-xs text-white/60 uppercase tracking-widest font-bold">Countdown</span>
          <p className="text-3xl font-black mt-1">{countdown || "..."}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-6 mt-8">
        <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-6 px-1">
          Timeline
        </h3>
        <div className="space-y-4">
          {timelineSteps.map((step) => (
            <div
              key={step.label}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.textColor}`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{step.label}</p>
                    <p className="text-white/40 text-xs">{step.offset}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.detail && (
                    <span className={`text-xs font-medium ${step.textColor}`}>{step.detail}</span>
                  )}
                  {step.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-transparent"
                      onClick={() => {
                        const currentTime =
                          step.action === "dress"
                            ? formatTimeOnly(myTimeline?.dress_up_time)
                            : formatTimeOnly(myTimeline?.travel_time);
                        setTimeValue(currentTime || "");
                        setTimePickerOpen(step.action);
                      }}
                    >
                      {(step.action === "dress" ? myTimeline?.dress_up_time : myTimeline?.travel_time)
                        ? "Change"
                        : "Set Time"}
                    </Button>
                  )}
                  <span className="text-white/50 text-xs font-medium min-w-[32px] text-right">
                    {step.progress}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-700`}
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who's Bringing */}
      {items && items.length > 0 && (
        <div className="mx-6 mt-8">
          <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4 px-1">
            Who's Bringing
          </h3>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl divide-y divide-white/5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg flex-shrink-0">{item.emoji || "📦"}</span>
                <span className="text-white/80 text-sm flex-1">{item.name}</span>
                {item.claims.length >= item.max_quantity ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Picker Dialog */}
      <Dialog open={!!timePickerOpen} onOpenChange={(open) => !open && setTimePickerOpen(null)}>
        <DialogContent className="bg-black/95 border-white/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {timePickerOpen === "dress" ? "Set Dress Up Time" : "Set Travel Time"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-white/60 text-sm">
              How long before the event ({formattedDate}) will you{" "}
              {timePickerOpen === "dress" ? "start getting dressed" : "start traveling"}?
            </p>
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {(timePickerOpen === "dress" ? DRESS_PRESETS : TRAVEL_PRESETS).map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant="outline"
                  disabled={upsertTimeline.isPending}
                  className="border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 hover:border-emerald-400/60 bg-transparent font-bold"
                  onClick={() => handlePreset(mins)}
                >
                  {mins}m
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <div className="flex-1 h-px bg-white/10" />
              or set exact time
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div>
              <Label className="text-white/70">Time</Label>
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTimePickerOpen(null)}
              className="border-white/20 text-white/70 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetTime}
              disabled={!timeValue || upsertTimeline.isPending}
              className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-none"
            >
              {upsertTimeline.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GetReady;
