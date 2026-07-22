import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { GAMES, getGameBySlug, getGamesBySlugs } from "@/lib/games";
import { getOccasionsBySlugs } from "@/lib/occasions";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { TapedLabel } from "@/components/cartoon/Panel";
import { DoodleStar, SpotRays } from "@/components/cartoon/Doodles";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return {
    title: game.seoTitle,
    description: game.seoDescription,
    openGraph: {
      title: game.seoTitle,
      description: game.seoDescription,
    },
  };
}

const INK = "#221f30";

export default async function GamePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const relatedGames = getGamesBySlugs(game.relatedGameSlugs).slice(0, 3);
  const relatedOccasions = getOccasionsBySlugs(game.recommendedOccasionSlugs).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `${game.name}, ${BRAND_NAME}`,
        applicationCategory: "GameApplication",
        operatingSystem: "Web browser",
        description: game.longDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Games", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/games` },
          { "@type": "ListItem", position: 2, name: game.name },
        ],
      },
    ],
  };

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "Games", href: "/games" },
            { label: game.name, href: `/games/${game.slug}` },
          ]}
        />

        {/* Hero */}
        <div className="grid items-start gap-10 md:grid-cols-5">
          <div className="md:col-span-3">
            <TapedLabel tilt={-1} color="var(--paper)">
              <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
                {game.category}
              </span>
            </TapedLabel>
            <h1
              className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
              style={{ color: "var(--cream)" }}
            >
              {game.name}
            </h1>
            <p className="font-hand mt-4 text-2xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
              {game.tagline}
            </p>
            <p className="font-hand mt-3 text-xl leading-snug" style={{ color: "var(--muted-foreground)", opacity: 0.8 }}>
              {game.longDescription}
            </p>

            {/* Metadata chips */}
            <ul className="font-score mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em]">
              <li className="rounded-full border-2 border-current px-3 py-1 opacity-70" style={{ color: "var(--cream)" }}>
                {game.minPlayers}+ players
              </li>
              {game.virtualHostSupported && (
                <li className="rounded-full border-2 border-current px-3 py-1" style={{ color: "var(--mustard)" }}>
                  Virtual Host
                </li>
              )}
              {game.manualHostSupported && (
                <li className="rounded-full border-2 border-current px-3 py-1 opacity-70" style={{ color: "var(--cream)" }}>
                  Manual Host
                </li>
              )}
            </ul>

            {/* Primary CTA */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/host/new?game=${game.gameType}`}
                className="btn-rough px-6 py-3 text-xl"
                style={{ background: "var(--mustard)", color: INK }}
              >
                Play {game.name} Free
              </Link>
              <Link
                href="/how-it-works"
                className="font-score rounded-md border-2 border-current px-5 py-3 text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--cream)" }}
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Art panel */}
          <div className="md:col-span-2">
            <div
              className="panel flex h-64 items-center justify-center overflow-hidden"
              style={{ background: game.color }}
              aria-hidden
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(#221f30 1px, transparent 1.6px)`,
                  backgroundSize: "10px 10px",
                }}
              />
              <DoodleStar size={64} color="#f5ecd4" className="relative -rotate-6 opacity-90" />
            </div>
          </div>
        </div>

        {/* How it works */}
        <section aria-labelledby="how-heading" className="mt-16">
          <h2
            id="how-heading"
            className="font-display mb-4 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            How a Round Works
          </h2>
          <div className="panel-paper panel-grain p-6" style={{ background: "var(--cream)" }}>
            <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
              {game.howItWorks}
            </p>
          </div>
        </section>

        {/* Scoring */}
        <section aria-labelledby="scoring-heading" className="mt-10">
          <h2
            id="scoring-heading"
            className="font-display mb-4 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            How Scoring Works
          </h2>
          <div className="panel-paper panel-grain p-6" style={{ background: "var(--cream)" }}>
            <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
              {game.scoring}
            </p>
          </div>
        </section>

        {/* What you need */}
        <section aria-labelledby="requirements-heading" className="mt-10">
          <h2
            id="requirements-heading"
            className="font-display mb-4 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            What You Need
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Host's screen",
                detail: "Any TV, laptop, monitor, or projector with a browser.",
              },
              {
                label: "Players' phones",
                detail: `Any smartphone or tablet with a browser. ${game.minPlayers}+ players total.`,
              },
              {
                label: "A room code",
                detail: "Generated when you create the room. Players type it to join, no accounts needed.",
              },
            ].map(({ label, detail }) => (
              <div
                key={label}
                className="panel-paper panel-grain flex flex-col gap-2 p-4"
                style={{ background: "var(--cream)" }}
              >
                <h3 className="font-display text-lg leading-tight" style={{ color: INK }}>
                  {label}
                </h3>
                <p className="font-hand text-lg leading-snug" style={{ color: "#4a4460" }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Best occasions */}
        {relatedOccasions.length > 0 && (
          <section aria-labelledby="occasions-heading" className="mt-10">
            <h2
              id="occasions-heading"
              className="font-display mb-4 text-2xl uppercase tracking-wide"
              style={{ color: "var(--cream)" }}
            >
              Best Occasions for {game.name}
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedOccasions.map((occasion) => (
                <Link
                  key={occasion.slug}
                  href={`/occasions/${occasion.slug}`}
                  className="panel-paper panel-grain px-4 py-2 transition-opacity hover:opacity-80"
                  style={{ background: "var(--cream)" }}
                >
                  <span className="font-display text-base" style={{ color: INK }}>
                    {occasion.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {game.gameFaq.length > 0 && (
          <section aria-labelledby="faq-heading" className="mt-10">
            <h2
              id="faq-heading"
              className="font-display mb-4 text-2xl uppercase tracking-wide"
              style={{ color: "var(--cream)" }}
            >
              Questions About {game.name}
            </h2>
            <PublicFAQ items={game.gameFaq} />
          </section>
        )}

        {/* Related games */}
        {relatedGames.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16">
            <h2
              id="related-heading"
              className="font-display mb-6 text-2xl uppercase tracking-wide"
              style={{ color: "var(--cream)" }}
            >
              Games You Might Also Like
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {relatedGames.map((g) => (
                <PublicGameCard key={g.slug} game={g} />
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="mb-20 mt-12 text-center">
          <div className="panel-paper panel-grain inline-flex flex-col items-center gap-4 px-10 py-8" style={{ background: "var(--cream)" }}>
            <h2 className="font-display text-2xl uppercase" style={{ color: INK }}>
              Ready to play {game.name}?
            </h2>
            <p className="font-hand text-xl" style={{ color: "#4a4460" }}>
              Free to host. Players join in seconds with a room code.
            </p>
            <Link
              href={`/host/new?game=${game.gameType}`}
              className="btn-rough px-8 py-3 text-xl"
              style={{ background: "var(--mustard)", color: INK }}
            >
              Play {game.name} Free
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
