// Box art for a store pack, drawn like the game cards: a show-colour field
// with halftone dots, a burst of rays, and one chunky ink-outlined motif.
// Decorative: callers give the pack's title in text next to it.

import { cn } from "@/lib/utils";

const INK = "#221f30";
const CREAM = "#f5ecd4";
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Motif({ art, accent }: { art: string; accent: string }) {
  switch (art) {
    case "pumpkin":
      return (
        <g>
          <path d="M50 22c2-8 8-12 14-12" fill="none" {...S} />
          <rect x="45" y="18" width="10" height="12" rx="3" fill="#4f9d4f" {...S} />
          <ellipse cx="34" cy="58" rx="20" ry="28" fill="#f7a23b" {...S} />
          <ellipse cx="66" cy="58" rx="20" ry="28" fill="#f7a23b" {...S} />
          <ellipse cx="50" cy="58" rx="20" ry="30" fill="#f28c28" {...S} />
          <path d="M34 50l7-8 7 8zM52 50l7-8 7 8z" fill={INK} />
          <path d="M30 64q20 18 40 0l-6 6-5-5-5 6-5-6-5 5-5-5z" fill={INK} />
        </g>
      );
    case "gift":
      return (
        <g>
          <path d="M50 30c-8-14-26-12-20-2 3 5 14 3 20 2zM50 30c8-14 26-12 20-2-3 5-14 3-20 2z" fill={accent} {...S} />
          <rect x="22" y="44" width="56" height="42" rx="3" fill="#e2493b" {...S} />
          <rect x="17" y="30" width="66" height="16" rx="3" fill="#e2493b" {...S} />
          <rect x="45" y="30" width="10" height="56" fill="#f0b429" {...S} />
        </g>
      );
    case "cassette":
      return (
        <g transform="rotate(-8 50 50)">
          <rect x="12" y="24" width="76" height="52" rx="7" fill={CREAM} {...S} />
          <rect x="20" y="31" width="60" height="16" rx="3" fill={accent} {...S} />
          <circle cx="36" cy="58" r="8" fill={INK} />
          <circle cx="64" cy="58" r="8" fill={INK} />
          <circle cx="36" cy="58" r="3" fill={CREAM} />
          <circle cx="64" cy="58" r="3" fill={CREAM} />
          <path d="M28 76l5-9h34l5 9" fill="#c9bfa4" {...S} />
        </g>
      );
    case "sun":
      return (
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M50 6v12" {...S} strokeWidth={6} transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="24" fill="#f0b429" {...S} />
          <circle cx="42" cy="46" r="3" fill={INK} />
          <circle cx="58" cy="46" r="3" fill={INK} />
          <path d="M40 56q10 9 20 0" fill="none" {...S} />
        </g>
      );
    case "ball":
      return (
        <g>
          <ellipse cx="50" cy="50" rx="36" ry="24" fill="#a0522d" {...S} transform="rotate(-30 50 50)" />
          <path d="M34 62l32-24" {...S} stroke={CREAM} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${40 + i * 6} ${48 - i * 4.5}l5 6`} {...S} stroke={CREAM} strokeWidth={3} />
          ))}
        </g>
      );
    case "heart":
      return (
        <g>
          <path d="M50 84C18 62 12 44 20 32c8-12 24-10 30 4 6-14 22-16 30-4 8 12 2 30-30 52z" fill="#e2493b" {...S} />
          <path d="M28 38q4-8 12-6" fill="none" stroke={CREAM} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "rocket":
      return (
        <g transform="rotate(30 50 50)">
          <path d="M42 72q8 18 8 22 0-4 8-22z" fill="#f0b429" {...S} />
          <path d="M38 64l-12 14 14-2zM62 64l12 14-14-2z" fill="#e2493b" {...S} />
          <path d="M50 8c16 14 18 40 12 62H38c-6-22-4-48 12-62z" fill={CREAM} {...S} />
          <circle cx="50" cy="38" r="8" fill="#5aa9e6" {...S} />
        </g>
      );
    case "film":
      return (
        <g>
          <rect x="18" y="40" width="64" height="42" rx="4" fill={INK} {...S} />
          <g transform="rotate(-14 18 40)">
            <rect x="18" y="26" width="64" height="14" rx="3" fill={CREAM} {...S} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${28 + i * 18} 26l8 14`} {...S} strokeWidth={5} />
            ))}
          </g>
          <path d="M28 54h44M28 66h30" stroke={CREAM} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "pizza":
      return (
        <g>
          <path d="M14 26q36-14 72 0L50 90z" fill="#f7c948" {...S} />
          <path d="M14 26q36-14 72 0l-3 8q-33-12-66 0z" fill="#d9893b" {...S} />
          <circle cx="40" cy="44" r="6" fill="#e2493b" {...S} strokeWidth={3} />
          <circle cx="60" cy="46" r="6" fill="#e2493b" {...S} strokeWidth={3} />
          <circle cx="50" cy="64" r="5" fill="#e2493b" {...S} strokeWidth={3} />
        </g>
      );
    case "music":
      return (
        <g>
          <path d="M40 70V24l36-8v46" fill="none" {...S} strokeWidth={6} />
          <path d="M40 30l36-8" {...S} strokeWidth={8} />
          <ellipse cx="32" cy="72" rx="11" ry="8" fill={INK} transform="rotate(-20 32 72)" />
          <ellipse cx="68" cy="64" rx="11" ry="8" fill={INK} transform="rotate(-20 68 64)" />
        </g>
      );
    case "paw":
      return (
        <g>
          <path d="M28 70c0-14 10-22 22-22s22 8 22 22c0 10-10 12-22 10s-22 0-22-10z" fill={INK} />
          {[[24, 46], [38, 30], [62, 30], [76, 46]].map(([x, y]) => (
            <ellipse key={x} cx={x} cy={y} rx="8" ry="10" fill={INK} />
          ))}
        </g>
      );
    case "mug":
      return (
        <g>
          <path d="M38 10q-6 6 0 12t0 12M52 10q-6 6 0 12t0 12" fill="none" {...S} strokeWidth={3} opacity={0.7} />
          <path d="M70 48h6a10 10 0 0 1 0 20h-6" fill="none" {...S} strokeWidth={6} />
          <path d="M24 40h48v34a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10z" fill={CREAM} {...S} />
          <rect x="30" y="52" width="36" height="14" rx="3" fill={accent} {...S} strokeWidth={3} />
        </g>
      );
    case "car":
      return (
        <g>
          <path d="M14 66V52l10-4 10-14h30l10 14 12 4v14z" fill="#e2493b" {...S} />
          <path d="M38 38h10v10H32zM54 38h8l6 10H54z" fill="#5aa9e6" {...S} strokeWidth={3} />
          <circle cx="32" cy="68" r="9" fill={INK} />
          <circle cx="70" cy="68" r="9" fill={INK} />
          <circle cx="32" cy="68" r="3" fill={CREAM} />
          <circle cx="70" cy="68" r="3" fill={CREAM} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M16 70L12 30l20 18 18-28 18 28 20-18-4 40z" fill="#f0b429" {...S} />
          <rect x="16" y="68" width="68" height="12" rx="2" fill="#f0b429" {...S} />
          <circle cx="32" cy="60" r="5" fill="#e2493b" {...S} strokeWidth={3} />
          <circle cx="50" cy="56" r="6" fill="#5aa9e6" {...S} strokeWidth={3} />
          <circle cx="68" cy="60" r="5" fill="#76b041" {...S} strokeWidth={3} />
        </g>
      );
    case "bulb":
      return (
        <g>
          <path d="M50 12a24 24 0 0 0-14 44c4 4 4 8 4 12h20c0-4 0-8 4-12a24 24 0 0 0-14-44z" fill="#f7c948" {...S} />
          <rect x="40" y="68" width="20" height="8" fill="#c9bfa4" {...S} strokeWidth={3} />
          <rect x="42" y="76" width="16" height="8" rx="3" fill="#c9bfa4" {...S} strokeWidth={3} />
          <path d="M44 50l6-10 6 10" fill="none" {...S} strokeWidth={3} />
          <path d="M10 30l8 4M90 30l-8 4M50 2v4" {...S} />
        </g>
      );
    case "fish":
      return (
        <g>
          <path d="M70 50l20-16v32z" fill={accent} {...S} />
          <ellipse cx="44" cy="50" rx="32" ry="22" fill="#f28c28" {...S} />
          <path d="M48 30q8 20 0 40" fill="none" {...S} strokeWidth={3} />
          <circle cx="26" cy="46" r="5" fill={CREAM} {...S} strokeWidth={3} />
          <circle cx="26" cy="46" r="2" fill={INK} />
        </g>
      );
    case "flower":
      return (
        <g>
          <path d="M50 64v30" {...S} stroke="#4f9d4f" strokeWidth={6} />
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx="50" cy="26" rx="10" ry="16" fill={accent} {...S} transform={`rotate(${i * 60} 50 44)`} />
          ))}
          <circle cx="50" cy="44" r="11" fill="#f0b429" {...S} />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M50 8l11 26 28 2-21 18 7 28-25-15-25 15 7-28-21-18 28-2z" fill="#f0b429" {...S} />
          <circle cx="42" cy="44" r="3" fill={INK} />
          <circle cx="58" cy="44" r="3" fill={INK} />
          <path d="M44 54q6 5 12 0" fill="none" {...S} strokeWidth={3} />
        </g>
      );
    case "fire":
      return (
        <g>
          <path d="M20 84l60-12M20 72l60 12" {...S} stroke="#8a5a2b" strokeWidth={9} />
          <path d="M50 76c-20 0-26-16-18-32 4 8 8 8 8 8-2-16 8-30 18-36-2 12 14 20 14 38 0 14-8 22-22 22z" fill="#e2493b" {...S} />
          <path d="M50 76c-8 0-12-8-6-18 2 4 6 4 6 4 0-8 4-12 8-14 0 8 6 12 4 20-1 5-6 8-12 8z" fill="#f0b429" />
        </g>
      );
    default:
      return <circle cx="50" cy="50" r="30" fill={accent} {...S} />;
  }
}

export function PackArt({
  art,
  color,
  accent,
  className,
  motifClassName,
}: {
  art: string;
  color: string;
  accent: string;
  className?: string;
  motifClassName?: string;
}) {
  return (
    <div aria-hidden className={cn("relative flex items-center justify-center overflow-hidden", className)} style={{ background: color }}>
      {/* burst of rays behind the motif */}
      <svg viewBox="0 0 200 200" className="absolute h-[160%] w-[160%] opacity-30" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M100 100L92 -40H108Z" fill={accent} transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </svg>
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1.6px)", backgroundSize: "10px 10px" }}
      />
      <svg viewBox="0 0 100 100" className={cn("pack-art-motif relative h-[62%] w-auto drop-shadow-[4px_4px_0_rgba(0,0,0,0.35)]", motifClassName)}>
        <Motif art={art} accent={accent} />
      </svg>
    </div>
  );
}
