import Link from "next/link";
import { DoodleStar } from "@/components/cartoon/Doodles";
import type { PublicGame } from "@/lib/games";

const INK = "#221f30";

type PublicGameCardProps = {
  game: PublicGame;
};

export function PublicGameCard({ game }: PublicGameCardProps) {
  return (
    <article className="panel-paper panel-grain relative flex flex-col overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* Art frame */}
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden border-b-[3px]"
        style={{ background: game.color, borderColor: INK }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(${INK} 1px, transparent 1.6px)`,
            backgroundSize: "10px 10px",
          }}
        />
        <DoodleStar size={34} color="#f5ecd4" className="relative -rotate-6 opacity-90" />

        {game.virtualHostSupported && (
          <span
            className="font-score absolute bottom-2 right-2 rounded px-2 py-0.5 text-[9px] uppercase tracking-widest"
            style={{ background: INK, color: "var(--mustard)" }}
          >
            Virtual Host
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category */}
        <span
          className="font-score self-start rounded px-1.5 text-[10px] uppercase tracking-[0.25em]"
          style={{ background: INK, color: "var(--cream)" }}
        >
          {game.category}
        </span>

        {/* Title */}
        <h3 className="font-display text-xl leading-tight" style={{ color: INK }}>
          {game.name}
        </h3>

        {/* Tagline */}
        <p className="font-hand flex-1 text-lg leading-snug" style={{ color: "#4a4460" }}>
          {game.tagline}
        </p>

        {/* Players */}
        <p
          className="font-score text-[10px] uppercase tracking-wider"
          style={{ color: "#8a7f63" }}
        >
          {game.minPlayers}+ players
        </p>

        {/* Actions */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <Link
            href={`/games/${game.slug}`}
            className="font-score flex-1 rounded-md border-2 border-current px-3 py-1.5 text-center text-[10px] uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
            style={{ color: INK }}
          >
            How It Works
          </Link>
          <Link
            href={`/host/new?game=${game.gameType}`}
            className="btn-rough font-score flex-1 px-3 py-1.5 text-center text-[10px] uppercase tracking-[0.15em]"
            style={{ background: "var(--mustard)", color: INK }}
          >
            Play Free
          </Link>
        </div>
      </div>
    </article>
  );
}
