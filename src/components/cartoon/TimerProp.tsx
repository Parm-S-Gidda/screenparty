"use client";

// Cartoon stopwatch prop for countdowns.

import { cn } from "@/lib/utils";

const INK = "#221f30";

export function TimerProp({
  seconds,
  size = 96,
  className,
}: {
  seconds: number;
  size?: number;
  className?: string;
}) {
  const urgent = seconds <= 5;
  return (
    <div
      className={cn("relative inline-block", urgent && "anim-tick", className)}
      style={{ width: size, height: size * 1.14 }}
      aria-label={`${seconds} seconds left`}
    >
      <svg viewBox="0 0 100 114" className="h-full w-full" aria-hidden>
        {/* top button + side nub */}
        <rect x="42" y="2" width="16" height="12" rx="3" fill="#e2493b" stroke={INK} strokeWidth="4" />
        <rect x="79" y="16" width="14" height="9" rx="3" fill="#e2493b" stroke={INK} strokeWidth="4" transform="rotate(38 86 20)" />
        {/* body */}
        <circle cx="50" cy="64" r="46" fill="#e2493b" stroke={INK} strokeWidth="5" />
        <circle cx="50" cy="64" r="33" fill="#f5ecd4" stroke={INK} strokeWidth="4" />
        {/* tick marks */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 50 + Math.sin(angle) * 28;
          const y1 = 64 - Math.cos(angle) * 28;
          const x2 = 50 + Math.sin(angle) * 32;
          const y2 = 64 - Math.cos(angle) * 32;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth="3" strokeLinecap="round" />;
        })}
      </svg>
      {/* face centre sits at 64/114 of the prop's height */}
      <span
        className="font-score absolute inset-x-0 text-center text-3xl leading-none tabular-nums"
        style={{ top: "56%", transform: "translateY(-50%)", color: urgent ? "#c93a2c" : INK }}
      >
        {seconds}
      </span>
    </div>
  );
}
