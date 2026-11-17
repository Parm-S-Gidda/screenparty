"use client";

// Dashboard game picker: one paper card per game, the whole card is the
// action. A short lift-and-press plays before navigating (skipped under
// reduced motion).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { GamePreview } from "@/components/public/GamePreview";
import { AVAILABLE_GAMES } from "@/lib/games";

export function GameCardDeck() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {AVAILABLE_GAMES.map((game, i) => (
        <GameCard key={game.slug} game={game} index={i} />
      ))}
    </ul>
  );
}

function GameCard({ game, index }: { game: (typeof AVAILABLE_GAMES)[number]; index: number }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const href = `/host/new?game=${game.gameType}`;
  const players = game.minPlayers <= 1 ? "Any size" : `${game.minPlayers}+ players`;

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  function open() {
    if (opening) return;
    setOpening(true);
    setTimeout(() => router.push(href), reduce ? 0 : 220);
  }

  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 26, delay: Math.min(index, 6) * 0.06 }}
      className="flex"
    >
      <button
        type="button"
        data-sfx-hover
        onClick={open}
        aria-label={`Host ${game.name}`}
        aria-busy={opening || undefined}
        className="game-card panel-paper panel-grain group flex w-full flex-col overflow-hidden text-left focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[var(--mustard)]"
        style={opening ? { transform: "translate(2px, 2px)", boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" } : undefined}
      >
        <div
          aria-hidden
          className="relative flex h-32 w-full items-center justify-center overflow-hidden border-b-[3px]"
          style={{ background: game.color, borderColor: "var(--ink)" }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1.6px)", backgroundSize: "10px 10px" }}
          />
          <div className="game-card-art relative">
            <GamePreview slug={game.slug} />
          </div>
        </div>
        <div className="flex w-full flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl leading-tight" style={{ color: "var(--ink)" }}>
              {game.name}
            </h3>
            <span className="font-score shrink-0 text-xs uppercase tracking-[0.12em]" style={{ color: "var(--ink-label)" }}>
              {players}
            </span>
          </div>
          <p className="font-hand flex-1 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
            {game.tagline}
          </p>
          <span className="font-score mt-1 text-sm uppercase tracking-[0.1em]" style={{ color: "var(--ink)" }}>
            {opening ? "Setting up…" : (
              <>
                Host this game <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </>
            )}
          </span>
        </div>
      </button>
    </motion.li>
  );
}
