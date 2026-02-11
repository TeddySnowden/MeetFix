const STEP_COLORS = [
  "#f00", "#f80", "#fa0", "#fd0", "#af0",
  "#7f7", "#5f5", "#0f8", "#08f", "#f0f",
];

export function getStepColor(ratio: number): string {
  const idx = Math.min(Math.floor(ratio * 10), 9);
  return STEP_COLORS[idx];
}

export function getVoteRatio(voteCount: number, totalVotes: number): number {
  return totalVotes > 0 ? voteCount / totalVotes : 0;
}

export function getVotePct(voteCount: number, totalVotes: number): number {
  return Math.round(getVoteRatio(voteCount, totalVotes) * 100);
}
