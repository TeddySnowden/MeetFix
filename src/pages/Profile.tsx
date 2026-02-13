import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Flame,
  Trophy,
  Star,
  Crown,
  Medal,
  Users,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { data: groups } = useGroups();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)" }}
      >
        <div className="w-8 h-8 border-4 border-[#00ffff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)" }}
      >
        <header className="flex items-center gap-3 p-4 border-b border-[#00ff41]/20">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#00ffff]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold" style={{ color: "#00ffff", textShadow: "0 0 10px #00ffff" }}>
            Profile
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-[#00ffff]" />
            <h2 className="text-xl font-bold mb-2 text-white">Sign In Required</h2>
            <p className="text-white/60 mb-6">Sign in with Google to view your profile</p>
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const displayEmail = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const groupCount = groups?.length || 0;

  const badges = [
    { id: "reliable", icon: <Star className="w-5 h-5" />, name: "Reliable Player", color: "text-yellow-400" },
    { id: "party-starter", icon: <Crown className="w-5 h-5" />, name: "Party Starter", color: "text-purple-400" },
    { id: "streak-master", icon: <Flame className="w-5 h-5" />, name: "Streak Master", color: "text-orange-400" },
    { id: "perfect-month", icon: <Medal className="w-5 h-5" />, name: "Perfect Month", color: "text-[#00ffff]" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col pb-12"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-[#00ff41]/20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#00ffff]">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold" style={{ color: "#00ffff", textShadow: "0 0 10px #00ffff" }}>
          Profile
        </h1>
      </header>

      <div className="flex-1 p-4 overflow-auto space-y-4">
        {/* User Card */}
        <div className="bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.4)]">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
          <p className="text-sm text-white/50 mb-4">{displayEmail}</p>

          {/* Streak (placeholder) */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-6 h-6" style={{ color: "#ffaa00", filter: "drop-shadow(0 0 6px #ffaa00)" }} />
            <span className="text-xl font-bold" style={{ color: "#ffaa00", textShadow: "0 0 10px #ffaa00" }}>
              0 day streak
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00ffff]">—</div>
              <div className="text-xs text-white/40">Show-up Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">—</div>
              <div className="text-xs text-white/40">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{groupCount}</div>
              <div className="text-xs text-white/40">Groups</div>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <div className="bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#00ffff]" />
            <h3 className="font-bold text-white">Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#00ff41]/20">
              <div>
                <p className="font-medium text-sm text-white">Google Account</p>
                <p className="text-xs text-white/50">{user.email}</p>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.3)]">
                Linked
              </span>
            </div>
            <Button
              variant="ghost"
              className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Badges Card (all locked / coming soon) */}
        <div className="bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#00ffff]" />
            <h3 className="font-bold text-white">Badges</h3>
            <span className="ml-auto text-xs text-white/30 italic">Coming soon</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-[#00ff41]/10 opacity-40"
              >
                <div className="p-2 rounded-lg bg-white/5 text-white/40">
                  {badge.icon}
                </div>
                <span className="text-sm font-medium text-white/40">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Groups Card */}
        <div className="bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#00ffff]" />
            <h3 className="font-bold text-white">Your Groups</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-lg bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41]">
              {groupCount}
            </span>
          </div>
          {!groups || groups.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">No groups yet</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#00ff41]/10 hover:border-[#00ff41]/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/g/${group.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{group.name}</div>
                      <div className="text-xs text-white/40">
                        {group.member_count} {group.member_count === 1 ? "member" : "members"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP Progress (placeholder) */}
        <div className="bg-black/40 border border-[#00ff41] rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.15)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Level 1</span>
            <span className="text-xs text-white/40">0 / 100 XP</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, #00ff41, #00ffff)",
                boxShadow: "0 0 10px rgba(0,255,65,0.5)",
              }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2 text-center italic">XP system coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
