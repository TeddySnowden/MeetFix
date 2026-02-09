import { Users, ChevronRight } from "lucide-react";
import { Group } from "@/hooks/useGroups";

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-all text-left flex items-center gap-4 active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
        <Users className="w-6 h-6 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
        <p className="text-sm text-muted-foreground">
          {group.member_count} {group.member_count === 1 ? "member" : "members"}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
