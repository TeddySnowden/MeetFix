import { useMemo } from "react";

const STEP_COLORS = [
  "#f00", "#f80", "#fa0", "#fd0", "#af0",
  "#7f7", "#5f5", "#0f8", "#08f", "#f0f",
];

function getStepColor(ratio: number): string {
  const idx = Math.min(Math.floor(ratio * 10), 9);
  return STEP_COLORS[idx];
}

interface VoteDensityBarProps {
  voteCount: number;
  totalVotes: number;
  isHighest: boolean;
}

export function VoteDensityBar({ voteCount, totalVotes, isHighest }: VoteDensityBarProps) {
  const ratio = totalVotes > 0 ? voteCount / totalVotes : 0;
  const pct = Math.round(ratio * 100);
  const color = getStepColor(ratio);

  return (
    <div className="w-full mt-2">
      <div
        className={`relative h-5 rounded-full overflow-hidden bg-muted ${
          isHighest ? "gold-winner-border" : ""
        }`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1.5"
          style={{
            width: `${Math.max(pct, 8)}%`,
            backgroundColor: color,
          }}
        >
          <span className="text-[10px] font-bold text-black/80 leading-none whitespace-nowrap">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
