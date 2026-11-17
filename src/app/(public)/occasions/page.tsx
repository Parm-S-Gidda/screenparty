import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { OCCASIONS } from "@/lib/occasions";
import { getGamesBySlugs } from "@/lib/games";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { ClosingCta, PageHeader } from "@/components/public/PageParts";

export const metadata: Metadata = {
  title: `Party Games for Every Occasion | ${BRAND_NAME}`,
  description:
    "House parties, birthdays, family game nights, team building, office parties, university events, and virtual parties. Find the right games and run-of-show for your gathering.",
  openGraph: {
    title: `Party Games for Every Occasion | ${BRAND_NAME}`,
    description:
      "Find the right ScreenParty games for your gathering. Curated run-of-show guides for every occasion.",
  },
};

export default function OccasionsPage() {
  return (
    <div className="relative">
      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Occasions", href: "/occasions" },
        ]}
        title={
          <>
            A game night for <span style={{ color: "var(--mustard)" }}>every occasion</span>
          </>
        }
        sub="Each guide picks the right games, lays out a run of show with timings, and tells you how to set up the room for that kind of crowd."
      />

      <section aria-label="Occasion guides" className="mx-auto -mt-4 w-full max-w-5xl px-6 pb-16 md:pb-24">
        <RevealList as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OCCASIONS.map((occasion) => {
            const games = getGamesBySlugs(occasion.recommendedGameSlugs).slice(0, 3);
            return (
              <RevealItem as="li" key={occasion.slug} className="flex">
                <Link
                  href={`/occasions/${occasion.slug}`}
                  className="game-card panel-paper panel-grain group flex w-full flex-col gap-4 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl leading-tight" style={{ color: "var(--ink)" }}>
                      {occasion.name}
                    </h2>
                    <span className="chip shrink-0">{occasion.runOfShowDuration}</span>
                  </div>
                  <p className="font-hand flex-1 text-pretty text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                    {occasion.tagline}
                  </p>
                  {/* setlist preview: the first games on the run of show */}
                  <ul aria-label="Recommended games" className="flex flex-col gap-1.5 border-t-2 border-dashed pt-3" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
                    {games.map((g) => (
                      <li key={g.slug} className="font-score flex items-center gap-2 text-sm uppercase tracking-[0.08em]" style={{ color: "var(--ink)" }}>
                        <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border-2" style={{ background: g.color, borderColor: "var(--ink)" }} />
                        {g.name}
                      </li>
                    ))}
                  </ul>
                  <span className="font-score text-sm uppercase tracking-[0.1em]" style={{ color: "var(--ink)" }}>
                    Read the guide <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </RevealList>
      </section>

      <ClosingCta
        title="Got the guests? Get the game."
        body="Set up a room in under a minute. Your friends just need their phones."
        cta={{ href: "/signup", label: "Host a free game" }}
        link={{ href: "/games", label: "Browse all games" }}
      />
    </div>
  );
}
