import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, Group } from "@/hooks/useGroups";
import { useNearestFinalizedEvent } from "@/hooks/useNearestEvent";
import { useBringItems } from "@/hooks/useItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { ChecklistModal } from "@/components/ChecklistModal";
import { useState } from "react";
import { User, Clock, Sparkles, Calendar, Plus, CheckSquare, Users, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { data: groups } = useGroups();
  const { data: heroEvent } = useNearestFinalizedEvent();
  const { data: heroItems } = useBringItems(heroEvent?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcomingGroups = groups || [];
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User";
  const myClaimedItem = heroItems?.find(
    (item) => item.claims.some(c => c.user_id === user?.id)
  );

  return (
    <div className="min-h-screen bg-black pb-48">
      {/* Top Bar */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-5xl font-black italic cyberpunk-logo tracking-tight">
            MeetFix
          </h1>
          <div className="flex-1 flex justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white text-sm font-bold">
                        {firstName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-white/50 text-xs">▼</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/20 text-white">
                <div className="p-2">
                  <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-white/60">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={signOut} className="text-red-400 cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white/60" />
            </div>
          )}
          </div>
        </div>
        {user && (
          <p className="text-white/70 text-base mt-1">
            Hey, {firstName}! 👋
          </p>
        )}
      </div>

      {/* Hero Card - nearest event */}
      {heroEvent ? (
        <div
          className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in cursor-pointer"
          onClick={() => navigate(`/e/${heroEvent.id}`)}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-white/80" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Next</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 leading-tight">{heroEvent.name}</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {heroEvent.finalized_date
                  ? format(new Date(heroEvent.finalized_date), "MMM d, HH:mm")
                  : "Time not set"}
              </span>
            </div>
            {heroEvent.status === "finalized" && (
              <Badge className="bg-black/30 text-white border-none text-xs">
                Finalized
              </Badge>
            )}
          </div>
          {myClaimedItem && (
            <p className="text-white/90 text-sm mb-4">
              You bring: {myClaimedItem.emoji ? `${myClaimedItem.emoji} ` : "📦 "}{myClaimedItem.name}
            </p>
          )}
          <button className="text-white/90 text-sm font-medium flex items-center gap-1 hover:text-white transition-colors">
            View details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : user ? (
        <div className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in">
          <h2 className="text-2xl font-bold mb-2 leading-tight">No upcoming events</h2>
          <p className="text-white/80 mb-4">Create a group and start planning!</p>
        </div>
      ) : (
        <div className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in">
          <h2 className="text-2xl font-bold mb-2 leading-tight">Plan group meetups effortlessly</h2>
          <p className="text-white/80 mb-6">Sign in to create groups, vote on times, and manage shared checklists.</p>
          <GoogleSignInButton />
        </div>
      )}

      {/* Upcoming Groups Card */}
      {user && upcomingGroups.length > 0 && (
        <div
          className="mx-6 mt-4 bg-gradient-to-br from-teal-600/60 via-teal-700/40 to-emerald-800/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 animate-fade-in cursor-pointer"
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">
              Upcoming ({upcomingGroups.length})
            </span>
          </div>
          <h4 className="text-xl font-bold text-white mb-1">{upcomingGroups[0].name}</h4>
          {upcomingGroups.length > 1 && (
            <p className="text-white/50 text-sm mb-3">
              +{upcomingGroups.length - 1} more plans
            </p>
          )}
          <button
            className="text-emerald-400 text-sm font-medium flex items-center gap-1 hover:text-emerald-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/g/${upcomingGroups[0].id}`);
            }}
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {user && (
        <div className="mx-6 mt-8">
          <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="bg-gradient-to-br from-emerald-500/20 to-teal-600/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Create Group</span>
            </button>
            <button
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              onClick={() => setChecklistOpen(true)}
            >
              <CheckSquare className="w-6 h-6 text-white/60" />
              <span className="text-sm font-semibold text-white/60">Checklist</span>
            </button>
            <button
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              onClick={() => navigate("/get-ready")}
            >
              <Sparkles className="w-6 h-6 text-white/60" />
              <span className="text-sm font-semibold text-white/60">Get ready</span>
            </button>
            <button
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              onClick={() => navigate("/groups")}
            >
              <Users className="w-6 h-6 text-white/60" />
              <span className="text-sm font-semibold text-white/60">My Groups</span>
            </button>
          </div>
        </div>
      )}

      {/* Guest sign-in */}
      {!user && (
        <div className="mx-6 mt-8">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <p className="text-sm text-white/50">
              Guest mode active. Sign in to create groups and participate.
            </p>
          </div>
        </div>
      )}

      <CreateGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ChecklistModal open={checklistOpen} onOpenChange={setChecklistOpen} />
    </div>
  );
};

export default Index;
