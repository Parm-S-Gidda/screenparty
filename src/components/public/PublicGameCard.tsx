import Link from "next/link";
import { GamePreview } from "@/components/public/GamePreview";
import type { PublicGame } from "@/lib/games";

type PublicGameCardProps = {
  game: PublicGame;
};

// The whole card is one link to the game's page (DESIGN.md: one action per card).
export function PublicGameCard({ game }: PublicGameCardProps) {
  const players = game.minPlayers <= 1 ? "Any group size" : `${game.minPlayers}+ players`;
  return (
    <Link
      href={`/games/${game.slug}`}
      className="game-card panel-paper panel-grain group relative flex w-full flex-col overflow-hidden"
    >
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden border-b-[3px]"
        style={{ background: game.color, borderColor: "var(--ink)" }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1.6px)", backgroundSize: "10px 10px" }}
        />
        <div className="game-card-art relative">
          <GamePreview slug={game.slug} />
        </div>
        {game.virtualHostSupported && (
          <span
            className="font-score absolute right-2 top-2 rounded px-2 py-0.5 text-xs uppercase tracking-[0.12em]"
            style={{ background: "var(--ink)", color: "var(--mustard)" }}
          >
            Virtual Host
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span
          className="font-score self-start rounded px-2 text-xs uppercase tracking-[0.15em]"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {game.category}
        </span>
        <h3 className="font-display text-xl leading-tight" style={{ color: "var(--ink)" }}>
          {game.name}
        </h3>
        <p className="font-hand flex-1 text-pretty text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
          {game.tagline}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-score text-xs uppercase tracking-[0.12em]" style={{ color: "var(--ink-label)" }}>
            {players}
          </span>
          <span className="font-score text-sm uppercase tracking-[0.1em]" style={{ color: "var(--ink)" }}>
            See how it plays <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
