"use client";

// The countdown line every game shares: an ink-outlined track that drains
// left as time runs out, turning tomato and pulsing in the last stretch.

import { useEffect, useState } from "react";
import { phaseTimer } from "@/lib/game/phaseTimer";
import type { RoomStateResponse } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function TimerBar({
  openedAt,
  seconds,
  className,
}: {
  openedAt: string;
  seconds: number;
  className?: string;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [openedAt, seconds]);

  const msLeft = Math.max(0, seconds * 1000 - (now - new Date(openedAt).getTime()));
  const left = Math.ceil(msLeft / 1000);
  const frac = Math.min(1, msLeft / (seconds * 1000));
  const urgent = left <= Math.max(5, Math.round(seconds * 0.2));

  return (
    <div
      role="timer"
      aria-label={`${left} seconds left`}
      className={cn("flex w-full max-w-3xl items-center gap-3", urgent && left > 0 && "anim-tick", className)}
    >
      <div
        className="relative h-5 flex-1 overflow-hidden rounded-full"
        style={{ background: "var(--ink-soft)", border: "3px solid var(--ink)", boxShadow: "0 3px 0 var(--ink)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${frac * 100}%`,
            background: urgent ? "var(--tomato)" : "var(--mustard)",
            transition: "width 250ms linear, background-color 180ms ease",
          }}
        />
      </div>
      <span
        className="font-score w-10 text-right text-2xl leading-none tabular-nums"
        style={{ color: urgent ? "var(--tomato)" : "var(--cream)" }}
      >
        {left}
      </span>
    </div>
  );
}

// Drop-in for any game view: shows the current phase's timer, or nothing.
export function PhaseTimerBar({ state, className }: { state: RoomStateResponse; className?: string }) {
  const timer = state.session ? phaseTimer(state.session) : null;
  if (!timer) return null;
  return <TimerBar key={timer.openedAt} openedAt={timer.openedAt} seconds={timer.seconds} className={className} />;
}
