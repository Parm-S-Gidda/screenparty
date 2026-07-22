"use client";

// A contestant on stage: mascot + dark nameplate + optional score sticker.

import { Mascot, type MascotExpression } from "./Mascot";
import { cn } from "@/lib/utils";

export function PlayerStand({
  avatarId,
  name,
  score,
  expression = "idle",
  size = 76,
  highlight = false,
  tilt = 0,
  team,
  className,
  children,
}: {
  avatarId: string;
  name: string;
  score?: number;
  expression?: MascotExpression;
  size?: number;
  highlight?: boolean;
  tilt?: number;
  team?: "red" | "blue" | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("group relative flex flex-col items-center", className)}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <Mascot avatarId={avatarId} expression={expression} size={size} animate={!highlight} />
      <div
        className={cn(
          "nameplate mt-1.5 flex min-w-20 flex-col items-center px-3 py-1",
          highlight && "outline-4 outline-offset-2 outline-[var(--mustard)]"
        )}
        style={
          team === "red"
            ? { borderColor: "#e2493b" }
            : team === "blue"
              ? { borderColor: "#5aa9e6" }
              : undefined
        }
      >
        <span className="font-display max-w-28 truncate text-sm uppercase leading-tight tracking-wide">
          {name}
        </span>
        {score !== undefined && (
          <span className="font-score text-base leading-tight tabular-nums" style={{ color: "var(--mustard)" }}>
            {score}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
