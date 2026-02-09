import { useState } from "react";
import { Users, Calendar, ListChecks, Vote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupCard } from "./GroupCard";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, Group } from "@/hooks/useGroups";

const features = [
  {
    icon: Users,
    title: "Create Groups",
    description: "Invite friends, family, or colleagues",
  },
  {
    icon: Calendar,
    title: "Schedule Events",
    description: "Propose dates and let everyone vote",
  },
  {
    icon: Vote,
    title: "Run Polls",
    description: "Choose time slots and activities together",
  },
  {
    icon: ListChecks,
    title: "Manage Items",
    description: "Shared bring-list with item claiming",
  },
];

export function EmptyState() {
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasGroups = groups && groups.length > 0;

  return (
    <div className="space-y-6">
      {/* Groups list for signed-in users */}
      {user && hasGroups && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Your Groups
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          {groups.map((group: Group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => {/* placeholder: navigate to group detail */}}
            />
          ))}
        </div>
      )}

      {/* Hero Card - show when no groups or guest */}
      {(!user || !hasGroups) && (
        <div className="bg-card rounded-2xl shadow-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-coral flex items-center justify-center shadow-soft">
            <Calendar className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">
            {user ? "Create your first group" : "Plan group meetups effortlessly"}
          </h2>
          <p className="text-muted-foreground mb-6 text-balance">
            {user
              ? "Start coordinating events with friends."
              : "Sign in to create groups, vote on times, and manage shared checklists."}
          </p>

          {user ? (
            <Button
              className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Group
            </Button>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      )}

      {/* Features Grid - only for guests or empty state */}
      {(!user || !hasGroups) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
            How it works
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign in reminder for guests */}
      {!user && (
        <div className="bg-secondary/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Guest mode active. Sign in to create groups and participate.
          </p>
        </div>
      )}

      <CreateGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
