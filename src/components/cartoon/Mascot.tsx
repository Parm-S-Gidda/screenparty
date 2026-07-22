"use client";

// Player avatars: illustrated character heads from /public/avatars, wrapped
// with the game's expression animations (bob, cheer, slump) and a crown
// overlay for winners. Same prop API as the old code-drawn mascots, so every
// call site, screens, nameplates, pickers, works unchanged.

import Image from "next/image";
import { AVATARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type MascotExpression =
  | "idle"
  | "buzzed"
  | "correct"
  | "incorrect"
  | "winner";

const KNOWN_IDS = new Set<string>(AVATARS.map((a) => a.id));

// bump when the artwork files change so browsers and the image optimizer
// drop their cached copies
const ART_VERSION = 4;

export function Mascot({
  avatarId,
  expression = "idle",
  size = 64,
  className,
  animate = true,
}: {
  avatarId: string;
  expression?: MascotExpression;
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const id = KNOWN_IDS.has(avatarId) ? avatarId : "default";
  const animClass =
    expression === "buzzed" || expression === "winner" || expression === "correct"
      ? "anim-cheer"
      : expression === "incorrect"
        ? "anim-slump"
        : animate
          ? "anim-bob"
          : undefined;

  return (
    <span
      className={cn("relative inline-block shrink-0", animClass, className)}
      style={{ width: size, height: size, transformOrigin: "50% 90%" }}
      aria-hidden
    >
      {expression === "winner" && (
        <svg
          viewBox="0 0 60 30"
          className="absolute -top-[26%] left-1/2 z-10 -translate-x-1/2 -rotate-6"
          style={{ width: size * 0.62 }}
          aria-hidden
        >
          <path
            d="M8 26 L4 6 L18 16 L30 2 L42 16 L56 6 L52 26 Z"
            fill="#f0b429"
            stroke="#221f30"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <Image
        src={`/avatars/${id}.png?v=${ART_VERSION}`}
        alt=""
        width={size}
        height={size}
        className={cn(
          "h-full w-full select-none object-contain",
          expression === "incorrect" && "saturate-[0.6]"
        )}
        draggable={false}
        priority={size >= 100}
      />
    </span>
  );
}
