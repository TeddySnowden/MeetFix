import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useGroupByInviteCode, useJoinGroup } from "@/hooks/useGroups";
import { Calendar, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: group, isLoading: groupLoading, error: groupError } = useGroupByInviteCode(inviteCode);
  const joinGroup = useJoinGroup();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (user && group && !joined && !joinGroup.isPending) {
      setJoined(true);
      joinGroup.mutate(inviteCode!, {
        onSuccess: () => {
          toast({ title: `Joined "${group.name}"!` });
          navigate("/");
        },
        onError: (err: any) => {
          toast({ title: "Couldn't join group", description: err.message, variant: "destructive" });
          navigate("/");
        },
      });
    }
  }, [user, group, joined]);

  const loading = authLoading || groupLoading;

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-soft mb-6">
          <Calendar className="w-8 h-8 text-primary-foreground" />
        </div>

        {loading || (user && group && !groupError) ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {authLoading ? "Loading..." : "Joining group..."}
            </p>
          </>
        ) : groupError || (!groupLoading && !group) ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">
              This invite link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-primary font-medium hover:underline"
            >
              Go to Home
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You're invited!
            </h2>
            <div className="bg-card rounded-xl p-4 shadow-soft mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{group?.name}</p>
                <p className="text-sm text-muted-foreground">Sign in to join this group</p>
              </div>
            </div>
            <GoogleSignInButton />
          </>
        )}
      </div>
    </Layout>
  );
}
