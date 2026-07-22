"use client";

// Paper-and-ink primitives: panels, tape strips, taped labels, round banners.

import { cn } from "@/lib/utils";

export function Tape({
  color = "rgba(240, 180, 41, 0.85)",
  className,
  style,
}: {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute block", className)}
      style={{
        width: 84,
        height: 24,
        background: color,
        border: "2px solid rgba(34,31,48,0.35)",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.25)",
        clipPath:
          "polygon(3% 12%, 97% 0%, 100% 30%, 96% 55%, 100% 88%, 4% 100%, 0% 68%, 3% 40%)",
        ...style,
      }}
    />
  );
}

// Panel: the cream game board look
export function Panel({
  className,
  tilt = 0,
  tape = false,
  children,
}: {
  className?: string;
  tilt?: number;
  tape?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("panel panel-grain", className)} style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      {tape && (
        <>
          <Tape className="-top-3 left-6" style={{ transform: "rotate(-8deg)" }} />
          <Tape
            className="-top-3 right-6"
            color="rgba(47, 168, 160, 0.8)"
            style={{ transform: "rotate(6deg)" }}
          />
        </>
      )}
      {children}
    </div>
  );
}

// small paper scrap with a taped corner, for labels and side notes
export function TapedLabel({
  className,
  tilt = -2,
  color = "var(--paper)",
  children,
}: {
  className?: string;
  tilt?: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("panel-paper panel-grain inline-block px-4 py-2", className)}
      style={{ transform: `rotate(${tilt}deg)`, background: color }}
    >
      <Tape className="-top-2.5 left-1/2 -translate-x-1/2" style={{ width: 56, height: 16, transform: "translateX(-50%) rotate(-3deg)" }} />
      {children}
    </div>
  );
}

// hanging round banner: "BUZZ-IN TRIVIA, ROUND 3"
export function RoundBanner({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div
        className="panel-paper font-display px-5 py-1.5 text-xl uppercase tracking-wider md:text-2xl"
        style={{ background: "var(--tomato)", color: "var(--cream)", transform: "rotate(-1.5deg)" }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className="panel-paper font-score -mt-1.5 px-3 py-0.5 text-xs uppercase tracking-[0.2em] md:text-sm"
          style={{ background: "var(--teal)", color: "var(--cream)", transform: "rotate(1deg)" }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
