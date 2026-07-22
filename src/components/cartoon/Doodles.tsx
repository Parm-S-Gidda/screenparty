"use client";

// Inline SVG doodles: stars, bursts, motion lines, scribbles, spotlight rays.
// All stroke-based so they read as marker drawings, not icons.

import { cn } from "@/lib/utils";

const INK = "#221f30";

export function DoodleStar({
  size = 26,
  color = "#f0b429",
  className,
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} style={style} aria-hidden>
      <path
        d="M20 3 L24 15 L37 16 L27 24 L30 37 L20 29 L10 37 L13 24 L3 16 L16 15 Z"
        fill={color}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleSparkle({
  size = 22,
  color = "#f5ecd4",
  className,
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden>
      <path
        d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  );
}

// comic starburst backdrop for big moments. The star is drawn much larger
// than the text box (its inner "belly" is only ~60% of its bounds, the rest
// is points), stretches with the content, and never captures clicks, so any
// name length sits fully on the paper.
export function Burst({
  color = "#f0b429",
  className,
  children,
}: {
  color?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative inline-flex max-w-[min(88vw,40rem)] items-center justify-center", className)}>
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "180%", height: "230%" }}
        aria-hidden
      >
        <path
          d="M100 4 L114 36 L146 14 L142 52 L182 44 L158 74 L196 88 L158 104 L180 136 L142 128 L148 168 L114 146 L100 184 L86 146 L52 168 L58 128 L20 136 L42 104 L4 88 L42 74 L18 44 L58 52 L54 14 L86 36 Z"
          fill={color}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative min-w-0 break-words px-6 py-4 text-center">{children}</div>
    </div>
  );
}

// comic action lines radiating out, for buzz moments
export function MotionLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("pointer-events-none", className)} aria-hidden>
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" opacity="0.85">
        <path d="M100 12 L100 34" stroke="#f5ecd4" />
        <path d="M158 34 L144 50" stroke="#f5ecd4" />
        <path d="M188 100 L164 100" stroke="#f5ecd4" />
        <path d="M42 34 L56 50" stroke="#f5ecd4" />
        <path d="M12 100 L36 100" stroke="#f5ecd4" />
        <path d="M158 166 L144 150" stroke="#f5ecd4" />
        <path d="M42 166 L56 150" stroke="#f5ecd4" />
      </g>
    </svg>
  );
}

// rough marker underline for emphasis
export function ScribbleUnderline({
  color = "#e2493b",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 220 18" className={cn("block h-3 w-full", className)} preserveAspectRatio="none" aria-hidden>
      <path
        d="M4 10 C40 4 80 14 112 8 C150 2 190 12 216 7"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// soft spotlight rays from a top corner: they stretch to fill whatever box
// they're given and fade out toward the far edge instead of cutting off.
export function SpotRays({ flip = false, className }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      preserveAspectRatio="none"
      className={cn("pointer-events-none opacity-[0.07]", flip && "-scale-x-100", className)}
      style={{
        maskImage: "radial-gradient(140% 140% at 0% 0%, black 35%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(140% 140% at 0% 0%, black 35%, transparent 78%)",
      }}
      aria-hidden
    >
      <g fill="#f5ecd4">
        <path d="M0 0 L120 300 L60 300 L0 60 Z" />
        <path d="M0 0 L220 300 L170 300 L0 30 Z" transform="rotate(8 0 0)" />
        <path d="M0 0 L300 220 L300 170 L40 0 Z" />
      </g>
    </svg>
  );
}

// scattered background stars for the stage
export function StarField() {
  const spots = [
    { top: "8%", left: "6%", size: 22, color: "#f0b429", rotate: -12 },
    { top: "14%", right: "9%", size: 18, color: "#ee7c8e", rotate: 15 },
    { top: "38%", left: "3%", size: 14, color: "#2fa8a0", rotate: 30 },
    { bottom: "24%", right: "4%", size: 20, color: "#f0b429", rotate: -20 },
    { bottom: "10%", left: "10%", size: 15, color: "#6f5aa0", rotate: 8 },
    { top: "60%", right: "12%", size: 12, color: "#f5ecd4", rotate: 0 },
  ] as const;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {spots.map((spot, i) => (
        <DoodleStar
          key={i}
          size={spot.size}
          color={spot.color}
          className="absolute opacity-60"
          style={{
            top: "top" in spot ? spot.top : undefined,
            bottom: "bottom" in spot ? spot.bottom : undefined,
            left: "left" in spot ? spot.left : undefined,
            right: "right" in spot ? spot.right : undefined,
            transform: `rotate(${spot.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
