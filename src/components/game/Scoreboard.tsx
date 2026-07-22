"use client";

import { motion } from "framer-motion";
import { AvatarBadge } from "./AvatarBadge";
import { DoodleStar } from "@/components/cartoon/Doodles";
import type { RoomStatePlayer, RoomStateResponse } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type RankedPlayer = RoomStatePlayer & { score: number; place: number };

// At game over, results render from the standings frozen into the payload so
// players who leave the room don't vanish (or shift everyone's placing).
export function finalPlayersAndScores(state: RoomStateResponse): {
  players: RoomStatePlayer[];
  scores: { playerId: string; score: number }[];
} {
  const standings = state.session?.payload.finalStandings;
  if (!standings) return { players: state.players, scores: state.scores };
  return {
    players: standings.map((s) => ({
      id: s.playerId,
      username: s.username,
      avatarId: s.avatarId,
      isHost: false,
      team: s.team,
    })),
    scores: standings.map((s) => ({ playerId: s.playerId, score: s.score })),
  };
}

export function rankPlayers(
  players: RoomStatePlayer[],
  scores: { playerId: string; score: number }[]
): RankedPlayer[] {
  const scoreByPlayer = new Map(scores.map((s) => [s.playerId, s.score]));
  const ranked = players
    .map((p) => ({ ...p, score: scoreByPlayer.get(p.id) ?? 0, place: 0 }))
    .sort((a, b) => b.score - a.score);
  let place = 0;
  let prevScore: number | null = null;
  ranked.forEach((p, i) => {
    if (p.score !== prevScore) {
      place = i + 1;
      prevScore = p.score;
    }
    p.place = place;
  });
  return ranked;
}

// Leaderboard as a stack of paper strips, each row a scrap of coloured paper
// with a rank sticker, mascot, marker name, and big score.
const ROW_TINTS = ["#f5ecd4", "#f1e3c2", "#f5ecd4", "#efe0be"];

export function Scoreboard({
  players,
  scores,
  highlightPlayerId,
  compact = false,
}: {
  players: RoomStatePlayer[];
  scores: { playerId: string; score: number }[];
  highlightPlayerId?: string | null;
  compact?: boolean;
}) {
  const ranked = rankPlayers(players, scores);
  return (
    <div className={cn("flex w-full flex-col", compact ? "gap-2" : "gap-3")}>
      {ranked.map((p, i) => (
        <motion.div
          key={p.id}
          layout
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={cn(
            "panel-paper panel-grain flex items-center gap-3 px-4",
            compact ? "py-1" : "py-1.5"
          )}
          style={{
            background: ROW_TINTS[i % ROW_TINTS.length],
            outline: highlightPlayerId === p.id ? "3px dashed var(--mustard, #f0b429)" : undefined,
            outlineOffset: 2,
          }}
        >
          {/* rank sticker */}
          <span
            className={cn(
              "font-display flex shrink-0 items-center justify-center rounded-full border-[3px] border-[#221f30] pt-0.5",
              compact ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg"
            )}
            style={{
              background: p.place === 1 ? "#f0b429" : p.place === 2 ? "#c8cdd6" : p.place === 3 ? "#e0925a" : "#eaddbd",
              color: "#221f30",
              transform: "rotate(-6deg)",
              boxShadow: "2px 2px 0 rgba(0,0,0,.35)",
            }}
          >
            {p.place}
          </span>
          <AvatarBadge avatarId={p.avatarId} size={compact ? "sm" : "md"} />
          <span
            className={cn("font-display flex-1 truncate uppercase tracking-wide", compact ? "text-base" : "text-xl")}
            style={{ color: "#221f30" }}
          >
            {p.username}
          </span>
          {p.place === 1 && p.score > 0 && <DoodleStar size={compact ? 16 : 22} className="shrink-0 -rotate-12" />}
          <span
            className={cn("font-score tabular-nums", compact ? "text-lg" : "text-2xl")}
            style={{ color: "#221f30" }}
          >
            {p.score}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
