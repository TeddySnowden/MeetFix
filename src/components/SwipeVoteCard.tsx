import { useRef, useState, useCallback, ReactNode } from "react";

const SWIPE_THRESHOLD = 80;

const STEP_COLORS = [
  "#f00", "#f80", "#fa0", "#fd0", "#af0",
  "#7f7", "#5f5", "#0f8", "#08f", "#f0f",
];

interface SwipeVoteCardProps {
  children: ReactNode;
  voted: boolean;
  disabled: boolean;
  onVoteYes: () => void;
  onVoteNo: () => void;
}

export function SwipeVoteCard({ children, voted, disabled, onVoteYes, onVoteNo }: SwipeVoteCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const [swipeProgress, setSwipeProgress] = useState(0); // -1 to 1
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;
    const dx = e.touches[0].clientX - startX.current;
    const width = ref.current?.offsetWidth || 300;
    const progress = Math.max(-1, Math.min(1, dx / width));
    setSwipeProgress(progress);
  }, [isSwiping, disabled]);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping || disabled) return;
    const width = ref.current?.offsetWidth || 300;
    const dx = swipeProgress * width;

    if (dx > SWIPE_THRESHOLD && !voted) {
      onVoteYes();
    } else if (dx < -SWIPE_THRESHOLD && voted) {
      onVoteNo();
    }

    setSwipeProgress(0);
    setIsSwiping(false);
  }, [isSwiping, disabled, swipeProgress, voted, onVoteYes, onVoteNo]);

  // Sweep color based on swipe progress
  const sweepPct = Math.abs(swipeProgress) * 100;
  const isRight = swipeProgress > 0;
  const colorIdx = Math.min(Math.floor(sweepPct / 10), 9);
  const sweepColor = isRight ? STEP_COLORS[colorIdx] : "#222";

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe overlay */}
      {isSwiping && sweepPct > 2 && (
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-xl transition-none"
          style={{
            background: `linear-gradient(90deg, ${sweepColor}44 0%, ${sweepColor}22 ${sweepPct}%, transparent ${sweepPct}%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
