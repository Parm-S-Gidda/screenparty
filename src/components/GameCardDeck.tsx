"use client";

// The game picker as a hand of trading cards: portrait cards in a fanned row,
// whole card clickable, with a quick pack-pull animation before navigating.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DoodleStar } from "@/components/cartoon/Doodles";
import { AVAILABLE_GAMES } from "@/lib/games";

const INK = "#221f30";

export function GameCardDeck() {
  return (
    <div className="mb-8 flex flex-wrap items-stretch justify-center gap-4 md:gap-5">
      {AVAILABLE_GAMES.map((game) => (
        <GameCard key={game.slug} game={game} />
      ))}
      <ComingSoonCard />
    </div>
  );
}

function ComingSoonCard() {
  return (
    <div className="group relative w-48 text-left md:w-1/4 md:max-w-48">
      <div
        className="panel-paper panel-grain relative flex h-full flex-col overflow-hidden p-2.5 opacity-60"
        style={{ background: "var(--cream)" }}
      >
        <div
          className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg border-[3px] border-dashed border-[#221f30]"
          style={{ background: "#e8e0cc" }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(${INK} 1px, transparent 1.6px)`,
              backgroundSize: "10px 10px",
            }}
          />
          <span className="font-display text-5xl" style={{ color: "#8a7f63" }}>?</span>
        </div>

        <span
          className="font-score absolute right-1.5 top-4 rotate-6 rounded-md border-2 border-dashed border-[#221f30] px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
          style={{ background: "#e8e0cc", color: "#8a7f63" }}
        >
          soon
        </span>

        <div
          className="-mx-1 mt-2 -rotate-1 rounded-md border-[3px] border-dashed border-[#221f30] px-2 py-1 text-center"
          style={{ background: "#8a7f63" }}
        >
          <span className="font-display text-lg leading-none tracking-wide" style={{ color: "var(--cream)" }}>
            Coming Soon
          </span>
        </div>

        <p className="font-hand mt-2 flex-1 px-1 text-lg leading-snug" style={{ color: "#8a7f63" }}>
          More games on the way. Stay tuned!
        </p>

        <div className="flex items-center justify-between px-1 pb-1">
          <span className="font-score text-[10px] uppercase tracking-wider" style={{ color: "#8a7f63" }}>
            in development
          </span>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game }: { game: (typeof AVAILABLE_GAMES)[number] }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const href = `/host/new?game=${game.gameType}`;

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  function open() {
    if (opening) return;
    setOpening(true);
    setTimeout(() => router.push(href), 420);
  }

  return (
    <motion.button
      type="button"
      data-sfx-hover
      onClick={open}
      whileHover={{ y: -16, scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.94 }}
      animate={
        opening
          ? { y: -34, scale: 1.14, rotate: [0, -3, 3, 0], transition: { duration: 0.4 } }
          : undefined
      }
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="group relative w-48 text-left md:w-1/4 md:max-w-48"
      aria-label={`Play ${game.name}`}
    >
      <div
        className="panel-paper panel-grain relative flex h-full flex-col overflow-hidden p-2.5"
        style={{ background: "var(--cream)" }}
      >
        {/* art frame, placeholder until real artwork drops in */}
        <div
          className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg border-[3px] border-[#221f30]"
          style={{ background: game.color }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(${INK} 1px, transparent 1.6px)`,
              backgroundSize: "10px 10px",
            }}
          />
          <DoodleStar size={36} className="relative -rotate-6 opacity-90" color="#f5ecd4" />
        </div>

        {/* rarity sticker */}
        <span
          className="font-score absolute right-1.5 top-4 rotate-6 rounded-md border-2 border-[#221f30] px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
          style={{ background: "var(--mustard)", color: INK, boxShadow: "2px 2px 0 rgba(0,0,0,.35)" }}
        >
          {game.sticker}
        </span>

        {/* title banner */}
        <div
          className="-mx-1 mt-2 -rotate-1 rounded-md border-[3px] border-[#221f30] px-2 py-1 text-center"
          style={{ background: INK }}
        >
          <span className="font-display text-lg leading-none tracking-wide" style={{ color: "var(--cream)" }}>
            {game.name}
          </span>
        </div>

        <p className="font-hand mt-2 flex-1 px-1 text-lg leading-snug" style={{ color: "#4a4460" }}>
          {game.tagline}
        </p>

        <div className="flex items-center justify-between px-1 pb-1">
          <span className="font-score text-[10px] uppercase tracking-wider" style={{ color: "#8a7f63" }}>
            {game.minPlayers}+ players
          </span>
          <span
            className="font-display text-sm uppercase transition group-hover:scale-110"
            style={{ color: "#c93a2c" }}
          >
            play →
          </span>
        </div>
      </div>
    </motion.button>
  );
}
