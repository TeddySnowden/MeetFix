import { useState, useEffect, useCallback, useRef } from "react";

const GLITCH_CHARS = "░▒▓█▄▀■□▪▫";

interface GlitchTextProps {
  text: string;
  className?: string;
  intervalRange?: [number, number]; // min/max seconds between glitches
}

export function GlitchText({ text, className = "", intervalRange = [1, 10] }: GlitchTextProps) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const originalRef = useRef(text);

  useEffect(() => {
    originalRef.current = text;
    setDisplay(text);
  }, [text]);

  const glitchBurst = useCallback(() => {
    setIsGlitching(true);
    const orig = originalRef.current;
    const steps = 4;
    let step = 0;

    const tick = () => {
      if (step < steps) {
        // Replace random chars with glitch characters
        const chars = orig.split("").map((ch) => {
          if (ch === " ") return ch;
          return Math.random() < 0.4
            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            : ch;
        });
        setDisplay(chars.join(""));
        step++;
        timeoutRef.current = setTimeout(tick, 50);
      } else {
        setDisplay(orig);
        setIsGlitching(false);
      }
    };
    tick();
  }, []);

  useEffect(() => {
    const scheduleNext = () => {
      const [min, max] = intervalRange;
      const delay = (min + Math.random() * (max - min)) * 1000;
      timeoutRef.current = setTimeout(() => {
        glitchBurst();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [glitchBurst, intervalRange]);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={isGlitching ? "glitch-text-active" : ""}>{display}</span>
      {isGlitching && <span className="glitch-scanline" aria-hidden="true" />}
    </span>
  );
}
