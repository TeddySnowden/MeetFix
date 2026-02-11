import { useRef, useState, useCallback, ReactNode } from "react";

const STEP_COLORS = ["#f00", "#f80", "#fa0", "#fd0", "#af0", "#7f7", "#5f5", "#0f8", "#08f", "#f0f"];

function getStepColor(ratio: number): string {
  const idx = Math.min(Math.floor(ratio * 10), 9);
  return STEP_COLORS[idx];
}

interface VoteButtonProps {
  voted: boolean;
  disabled: boolean;
  isWinner: boolean;
  voteRatio: number;
  onVoteYes: () => void;
  onVoteNo: () => void;
  children: ReactNode;
  className?: string;
}

const LONG_PRESS_MS = 2000;
const DOUBLE_TAP_MS = 2000;

export function VoteButton({
  voted,
  disabled,
  isWinner,
  voteRatio,
  onVoteYes,
  onVoteNo,
  children,
  className = "",
}: VoteButtonProps) {
  const [sweepProgress, setSweepProgress] = useState<number | null>(null);
  const [reverseSweep, setReverseSweep] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number | null>(null);
  const pressStart = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const isPressing = useRef(false);

  const startSweep = useCallback(() => {
    pressStart.current = performance.now();
    isPressing.current = true;

    const animate = () => {
      if (!isPressing.current) return;
      const elapsed = performance.now() - pressStart.current;
      const progress = Math.min(elapsed / LONG_PRESS_MS, 1);
      setSweepProgress(progress);
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };
    animFrame.current = requestAnimationFrame(animate);
  }, []);

  const cancelSweep = useCallback(() => {
    isPressing.current = false;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (animFrame.current) {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = null;
    }
  }, []);

  const handlePressStart = useCallback(() => {
    if (disabled) return;

    // Double-tap detection for unvote
    const now = Date.now();
    if (voted && now - lastTapTime.current < DOUBLE_TAP_MS) {
      lastTapTime.current = 0;
      // Reverse sweep animation
      setReverseSweep(true);
      setSweepProgress(1);
      const start = performance.now();
      const animateReverse = () => {
        const elapsed = performance.now() - start;
        const progress = 1 - Math.min(elapsed / 300, 1);
        setSweepProgress(progress);
        if (progress > 0) {
          requestAnimationFrame(animateReverse);
        } else {
          setSweepProgress(null);
          setReverseSweep(false);
          onVoteNo();
        }
      };
      requestAnimationFrame(animateReverse);
      return;
    }
    lastTapTime.current = now;

    if (voted) return; // Already voted, wait for double-tap

    startSweep();
    pressTimer.current = setTimeout(() => {
      isPressing.current = false;
      setSweepProgress(null);
      onVoteYes();
    }, LONG_PRESS_MS);
  }, [disabled, voted, startSweep, onVoteYes, onVoteNo]);

  const handlePressEnd = useCallback(() => {
    if (isPressing.current) {
      // Released too early – cancel
      cancelSweep();
      setSweepProgress(null);
    }
  }, [cancelSweep]);

  const sweepColor =
    sweepProgress !== null ? getStepColor(reverseSweep ? sweepProgress * voteRatio : sweepProgress) : null;

  const sweepPct = sweepProgress !== null ? Math.round(sweepProgress * 100) : null;

  return (
    <button
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative overflow-hidden select-none touch-none ${className}`}
      style={{ WebkitUserSelect: "none" }}
    >
      {/* Sweep overlay */}
      {sweepPct !== null && (
        <div
          className="absolute inset-0 rounded-xl transition-none pointer-events-none z-0"
          style={{
            width: `${sweepPct}%`,
            backgroundColor: sweepColor || "transparent",
            opacity: 1,
          }}
        />
      )}
      <div className="relative z-10 flex items-center gap-4 w-full">{children}</div>
    </button>
  );
}
