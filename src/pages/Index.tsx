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
import { useState } from "react";
import { User } from "lucide-react";
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
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compute upcoming groups with event counts
  const upcomingGroups = groups || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            MeetFix
          </h1>
          {heroEvent && (
            <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-none shadow-lg animate-fade-in">
              next esemény
            </Badge>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full shadow-lg flex items-center justify-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                      {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white/60" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-36">
        {/* Hero Card - nearest finalized event */}
        {heroEvent ? (
          <div
            className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in cursor-pointer"
            onClick={() => navigate(`/e/${heroEvent.id}`)}
          >
            <h2 className="text-2xl font-bold mb-4 leading-tight">{heroEvent.name}</h2>
            {heroEvent.finalized_date && (
              <div className="flex items-start gap-3 mb-6">
                <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">
                    {format(new Date(heroEvent.finalized_date), "MMM d, HH:mm")}
                  </span>
                </div>
                {heroEvent.finalized_activity && (
                  <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">{heroEvent.finalized_activity}</span>
                  </div>
                )}
              </div>
            )}
            {heroItems && heroItems.length > 0 && (
              <div className="space-y-3 mb-6">
                {heroItems.slice(0, 3).map((item) => (
                  <label key={item.id} className="flex items-center gap-3 text-lg">
                    <input
                      type="checkbox"
                      readOnly
                      checked={!!item.claim}
                      className="w-6 h-6 rounded-lg bg-white/20 border-white/50 accent-emerald-400 shadow-md"
                    />
                    <span>{item.emoji ? `${item.emoji} ` : ""}{item.name}</span>
                  </label>
                ))}
                {heroItems.length > 3 && (
                  <p className="text-white/70 text-sm">+{heroItems.length - 3} more items</p>
                )}
              </div>
            )}
            <Button className="w-full h-12 bg-white text-emerald-600 font-bold text-lg shadow-xl hover:scale-105 transition-all border-none">
              Details →
            </Button>
          </div>
        ) : user ? (
          <div className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 leading-tight">No upcoming events</h2>
            <p className="text-white/80 mb-4">Create a group and start planning!</p>
            <Button
              className="w-full h-12 bg-white text-emerald-600 font-bold text-lg shadow-xl hover:scale-105 transition-all border-none"
              onClick={() => setDialogOpen(true)}
            >
              + Create Group
            </Button>
          </div>
        ) : (
          <div className="mx-6 mt-4 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl p-6 text-white animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 leading-tight">Plan group meetups effortlessly</h2>
            <p className="text-white/80 mb-6">Sign in to create groups, vote on times, and manage shared checklists.</p>
            <GoogleSignInButton />
          </div>
        )}

        {/* Upcoming Groups */}
        {user && upcomingGroups.length > 0 && (
          <div className="mx-6 mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-white/90 mb-4 px-1">
              My Groups ({upcomingGroups.length})
            </h3>
            <div className="space-y-3">
              {upcomingGroups.map((group: Group) => (
                <Card
                  key={group.id}
                  className="bg-black/60 backdrop-blur-xl border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/g/${group.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">{group.name}</h4>
                        <p className="text-white/70 text-sm">
                          {group.member_count || 0} {(group.member_count || 0) === 1 ? "member" : "members"}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/10 text-white hover:bg-white/20 border-none"
                      >
                        View all →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Guest sign-in reminder */}
        {!user && (
          <div className="mx-6 mt-8">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-sm text-white/50">
                Guest mode active. Sign in to create groups and participate.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/10 p-3 z-40">
          <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
            <Button
              className="h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl hover:scale-105 transition-all border-none"
              onClick={() => setDialogOpen(true)}
            >
              + Create Group
            </Button>
            <Button
              className="h-14 bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-lg"
              variant="outline"
              onClick={() => {
                // Scroll to groups
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }}
            >
              My Groups
            </Button>
          </div>
        </div>
      )}

      <CreateGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Index;
