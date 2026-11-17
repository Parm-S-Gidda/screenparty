import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES, getGameBySlug } from "@/lib/games";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { GamePreview } from "@/components/public/GamePreview";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { ClosingCta, PageHeader, SectionHeading } from "@/components/public/PageParts";

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

// Starter picks: the advice that used to sit in the bottom CTA, now pointing at the games.
const STARTERS = [
  { slug: "two-truths-and-a-lie", why: "Best opener when the group doesn't know each other well." },
  { slug: "fact-frenzy", why: "Works for any crowd size, even a solo warm-up." },
  { slug: "most-likely-to", why: "The one that gets the biggest reactions." },
];

export default function GamesPage() {
  const starters = STARTERS.flatMap(({ slug, why }) => {
    const game = getGameBySlug(slug);
    return game ? [{ game, why }] : [];
  });
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
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Games", href: "/games" },
        ]}
        title={
          <>
            {AVAILABLE_GAMES.length} games, <span style={{ color: "var(--mustard)" }}>one room code</span>
          </>
        }
        sub={`Trivia, bluffing, acting, voting, pitching and more. Put one on the big screen and everyone plays from their phone. All of them are free for up to ${LIMITS.free.maxPlayers} players.`}
      />

      <section aria-label="All games" className="mx-auto -mt-4 w-full max-w-5xl px-6 pb-16 md:pb-24">
        <RevealList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_GAMES.map((game) => (
            <RevealItem key={game.slug} className="flex">
              <PublicGameCard game={game} />
            </RevealItem>
          ))}
        </RevealList>
      </section>

      {/* curtain band: where to start */}
      <section aria-labelledby="start-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading id="start-heading" sub="First game night? Any of these three gets a room going.">
            Not sure where to start?
          </SectionHeading>
          <ol className="panel panel-grain grid md:grid-cols-3">
            {starters.map(({ game, why }, i) => (
              <li
                key={game.slug}
                className="border-dashed max-md:[&:not(:first-child)]:border-t-[3px] md:[&:not(:first-child)]:border-l-[3px]"
              >
                <Link href={`/games/${game.slug}`} className="group flex h-full flex-col items-center gap-3 px-6 py-8 text-center">
                  <div aria-hidden className="flex h-[112px] items-center justify-center transition-transform duration-200 group-hover:-translate-y-1">
                    <GamePreview slug={game.slug} />
                  </div>
                  <h3 className="font-display mt-1 text-xl leading-tight" style={{ color: "var(--ink)" }}>
                    <span style={{ color: "var(--tomato)" }}>{i + 1}.</span> {game.name}
                  </h3>
                  <p className="font-hand max-w-[26ch] text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                    {why}
                  </p>
                  <span className="font-score mt-auto text-sm uppercase tracking-[0.1em]" style={{ color: "var(--ink)" }}>
                    See how it plays{" "}
                    <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="pt-16 md:pt-24">
        <ClosingCta
          title="Pick a game, press play"
          body="Set up a room in under a minute. Your friends just need their phones."
          cta={{ href: "/signup", label: "Host a free game" }}
          link={{ href: "/how-it-works", label: "How it works" }}
        />
      </div>
    </div>
  );
}
