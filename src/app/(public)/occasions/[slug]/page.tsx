import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { OCCASIONS, getOccasionBySlug } from "@/lib/occasions";
import { getGamesBySlugs } from "@/lib/games";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { TapedLabel } from "@/components/cartoon/Panel";
import { DoodleStar, SpotRays } from "@/components/cartoon/Doodles";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return OCCASIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const occasion = getOccasionBySlug(slug);
  if (!occasion) return {};
  return {
    title: occasion.seoTitle,
    description: occasion.seoDescription,
    openGraph: {
      title: occasion.seoTitle,
      description: occasion.seoDescription,
    },
  };
}

const INK = "#221f30";

export default async function OccasionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const occasion = getOccasionBySlug(slug);
  if (!occasion) notFound();

  const recommendedGames = getGamesBySlugs(occasion.recommendedGameSlugs);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Occasions", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/occasions` },
      { "@type": "ListItem", position: 2, name: occasion.name },
    ],
  };

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "Occasions", href: "/occasions" },
            { label: occasion.name, href: `/occasions/${occasion.slug}` },
          ]}
        />

        <TapedLabel tilt={-1} color="var(--paper)">
          <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
            game guide
          </span>
        </TapedLabel>
        <h1
          className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
          style={{ color: "var(--cream)" }}
        >
          {occasion.name}
        </h1>
        <p className="font-hand mt-3 text-2xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
          {occasion.tagline}
        </p>
        <p className="font-hand mt-3 text-xl leading-snug" style={{ color: "var(--muted-foreground)", opacity: 0.8 }}>
          {occasion.intro}
        </p>

        {/* Group size */}
        <div className="mt-6 inline-block">
          <div className="panel-paper px-4 py-2" style={{ background: "var(--cream)" }}>
            <p className="font-hand text-lg" style={{ color: "#4a4460" }}>
              <strong className="font-display" style={{ color: INK }}>Group size:</strong>{" "}
              {occasion.groupSizeGuidance}
            </p>
          </div>
        </div>

        {/* Run of show */}
        <section aria-labelledby="show-heading" className="mt-14">
          <h2
            id="show-heading"
            className="font-display mb-2 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Suggested {occasion.runOfShowDuration} Run of Show
          </h2>
          <p className="font-hand mb-5 text-lg" style={{ color: "var(--muted-foreground)" }}>
            This order works well for most groups. Adjust based on how your guests respond.
          </p>
          <ol className="flex flex-col gap-4">
            {occasion.suggestedRunOfShow.map((item, i) => (
              <li
                key={item.game}
                className="panel-paper panel-grain flex gap-5 p-5"
                style={{ background: "var(--cream)" }}
              >
                <span
                  className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] pt-0.5 text-base"
                  style={{ borderColor: INK, background: "var(--mustard)", color: INK }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="font-display text-xl" style={{ color: INK }}>
                      {item.game}
                    </h3>
                    <span className="font-score text-[10px] uppercase tracking-[0.2em]" style={{ color: "#8a7f63" }}>
                      {item.duration}
                    </span>
                  </div>
                  {item.note && (
                    <p className="font-hand mt-1 text-lg leading-snug" style={{ color: "#4a4460" }}>
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Setup tips */}
        <section aria-labelledby="setup-heading" className="mt-14">
          <h2
            id="setup-heading"
            className="font-display mb-5 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Setup Tips
          </h2>
          <ul className="flex flex-col gap-3">
            {occasion.setupTips.map((tip) => (
              <li
                key={tip}
                className="panel-paper panel-grain flex items-start gap-3 p-4"
                style={{ background: "var(--cream)" }}
              >
                <DoodleStar size={16} className="mt-1 shrink-0" />
                <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
                  {tip}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Content notes */}
        <section aria-labelledby="content-heading" className="mt-14">
          <h2
            id="content-heading"
            className="font-display mb-4 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Content Notes
          </h2>
          <div className="panel-paper panel-grain p-5" style={{ background: "var(--cream)" }}>
            <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
              {occasion.contentNotes}
            </p>
          </div>
        </section>

        {/* Recommended games */}
        {recommendedGames.length > 0 && (
          <section aria-labelledby="games-heading" className="mt-14">
            <h2
              id="games-heading"
              className="font-display mb-6 text-2xl uppercase tracking-wide"
              style={{ color: "var(--cream)" }}
            >
              Recommended Games
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {recommendedGames.map((game) => (
                <PublicGameCard key={game.slug} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mb-20 mt-12 text-center">
          <div className="panel-paper panel-grain inline-flex flex-col items-center gap-4 px-10 py-8" style={{ background: "var(--cream)" }}>
            <h2 className="font-display text-2xl uppercase" style={{ color: INK }}>
              Ready to host?
            </h2>
            <p className="font-hand text-xl" style={{ color: "#4a4460" }}>
              Free to start. Players join in seconds with a room code.
            </p>
            <Link
              href="/signup"
              className="btn-rough px-8 py-3 text-xl"
              style={{ background: "var(--mustard)", color: INK }}
            >
              Host Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
