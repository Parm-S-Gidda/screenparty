import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { TapedLabel } from "@/components/cartoon/Panel";
import { SpotRays } from "@/components/cartoon/Doodles";

export const metadata: Metadata = {
  title: `Online Party Games for Groups | ${BRAND_NAME}`,
  description:
    "Nine browser party games on any TV, laptop, or projector. Everyone joins from their phone with a room code. Trivia, bluffing, voting, guessing, pitching, ranking, and acting. Free to host.",
  openGraph: {
    title: `Online Party Games for Groups | ${BRAND_NAME}`,
    description:
      "Nine browser party games on any TV, laptop, or projector. Everyone joins from their phone with a room code. Free to host.",
  },
};

const INK = "#221f30";

const CATEGORIES = [
  "All",
  "Trivia",
  "Bluffing",
  "Voting",
  "Social Guessing",
  "Creative",
  "Acting",
  "Ranking",
];

export default function GamesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ScreenParty Games",
    description: "Online party games playable on any screen with phone controllers",
    numberOfItems: AVAILABLE_GAMES.length,
    itemListElement: AVAILABLE_GAMES.map((game, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: game.name,
      description: game.shortDescription,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/games/${game.slug}`,
    })),
  };

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-60" />
      <SpotRays flip className="absolute right-0 top-0 h-96 w-[50vw] opacity-60" />

      {/* Header */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 pt-16">
        <div className="flex flex-col items-start gap-3">
          <TapedLabel tilt={-1} color="var(--paper)">
            <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
              {AVAILABLE_GAMES.length} games available
            </span>
          </TapedLabel>
          <h1
            className="font-display text-4xl uppercase tracking-wide md:text-5xl"
            style={{ color: "var(--cream)" }}
          >
            Online Party Games for Every Kind of Group
          </h1>
          <p className="font-hand max-w-xl text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
            Put the game on the big screen. Everyone joins from their phone. No app, no console, no player accounts.
          </p>
        </div>
      </section>

      {/* Category labels, informational only (no JS filter at this game count) */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="font-score rounded-full border-2 border-current px-3 py-1 text-[10px] uppercase tracking-[0.2em] opacity-60"
              style={{ color: "var(--cream)" }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Game grid */}
      <section
        aria-label="Available games"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20"
      >
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {AVAILABLE_GAMES.map((game) => (
            <PublicGameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-20 text-center">
        <div className="panel-paper panel-grain flex flex-col items-center gap-4 p-8" style={{ background: "var(--cream)" }}>
          <h2 className="font-display text-2xl uppercase" style={{ color: INK }}>
            Not sure which to start with?
          </h2>
          <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
            Two Truths &amp; a Lie is a great opener for groups that don&apos;t know each other well.
            Fact Frenzy works for any size crowd. Most Likely To is the one that gets the best reactions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/how-it-works"
              className="font-score rounded-md border-2 border-current px-5 py-2 text-xs uppercase tracking-[0.2em]"
              style={{ color: INK }}
            >
              How It Works
            </Link>
            <Link
              href="/signup"
              className="btn-rough px-5 py-2 text-lg"
              style={{ background: "var(--mustard)", color: INK }}
            >
              Host a Game Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
