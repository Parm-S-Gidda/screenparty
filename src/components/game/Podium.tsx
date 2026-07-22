"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/cartoon/Mascot";
import { DoodleStar } from "@/components/cartoon/Doodles";
import type { PodiumEntry, RoomStatePlayer } from "@/lib/game/types";

// 3-place podium as stacked stage boxes (PRD §20). Ties cycle through the
// tied players' names and mascots on a timer.
export function Podium({
  podium,
  players,
}: {
  podium: PodiumEntry[];
  players: RoomStatePlayer[];
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(interval);
  }, []);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const slots = [2, 1, 3].map((place) => podium.find((e) => e.place === place) ?? null);
  const heights = { 1: 168, 2: 118, 3: 88 } as const;
  const boxColors = { 1: "#f0b429", 2: "#2fa8a0", 3: "#ee7c8e" } as const;

  return (
    <div className="flex items-end justify-center gap-5">
      {slots.map((entry, i) => {
        const place = ([2, 1, 3] as const)[i];
        if (!entry) return <div key={place} className="w-40" />;
        const shown = playerById.get(entry.playerIds[tick % entry.playerIds.length]);
        if (!shown) return <div key={place} className="w-40" />;
        return (
          // the whole column, mascot riding its podium, rises as one piece
          <motion.div
            key={place}
            initial={{ opacity: 0, y: 110 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (3 - place) * 0.35, type: "spring", damping: 14 }}
            className="flex w-40 flex-col items-center gap-2"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={shown.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="flex flex-col items-center gap-1"
              >
                <Mascot
                  avatarId={shown.avatarId}
                  expression={place === 1 ? "winner" : "correct"}
                  size={place === 1 ? 96 : 76}
                />
                <span className="font-display max-w-36 truncate text-xl uppercase tracking-wide">
                  {shown.username}
                </span>
                {entry.playerIds.length > 1 && (
                  <span className="font-hand text-sm" style={{ color: "var(--mustard)" }}>
                    {entry.playerIds.length}-way tie!
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            <div
              style={{ height: heights[place], background: boxColors[place] }}
              className="panel-paper panel-grain flex w-full flex-col items-center justify-start gap-1 pt-3"
            >
              <span className="font-display text-4xl leading-none" style={{ color: "#221f30" }}>
                {place}
              </span>
              <span className="font-score text-2xl tabular-nums" style={{ color: "#221f30" }}>
                {entry.score}
              </span>
              {place === 1 && <DoodleStar size={22} className="mt-1 -rotate-12" color="#f5ecd4" />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
