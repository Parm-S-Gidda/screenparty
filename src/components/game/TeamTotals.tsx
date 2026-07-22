"use client";

import { motion } from "framer-motion";
import type { RoomStatePlayer, TeamId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export const TEAM_META: Record<TeamId, { name: string; emoji: string; text: string; bg: string; ring: string }> = {
  red: { name: "Team Red", emoji: "🔴", text: "text-red-400", bg: "bg-red-500/15", ring: "ring-red-500" },
  blue: { name: "Team Blue", emoji: "🔵", text: "text-sky-400", bg: "bg-sky-500/15", ring: "ring-sky-500" },
};

export function teamTotals(
  players: RoomStatePlayer[],
  scores: { playerId: string; score: number }[]
): Record<TeamId, number> {
  const scoreOf = new Map(scores.map((s) => [s.playerId, s.score]));
  const totals: Record<TeamId, number> = { red: 0, blue: 0 };
  for (const p of players) {
    if (p.team === "red" || p.team === "blue") totals[p.team] += scoreOf.get(p.id) ?? 0;
  }
  return totals;
}

export function TeamTotalsBar({
  players,
  scores,
}: {
  players: RoomStatePlayer[];
  scores: { playerId: string; score: number }[];
}) {
  const totals = teamTotals(players, scores);
  return (
    <div className="flex w-full max-w-md items-center justify-center gap-3">
      {(["red", "blue"] as const).map((team) => (
        <motion.div
          key={team}
          layout
          className={cn("panel-paper panel-grain flex flex-1 items-center justify-between px-4 py-2")}
          style={{
            background: team === "red" ? "#e2493b" : "#5aa9e6",
            transform: `rotate(${team === "red" ? -0.8 : 0.8}deg)`,
          }}
        >
          <span className="font-display text-lg uppercase" style={{ color: "#f5ecd4" }}>
            {TEAM_META[team].name}
          </span>
          <span className="font-score text-2xl tabular-nums" style={{ color: "#221f30" }}>
            {totals[team]}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
