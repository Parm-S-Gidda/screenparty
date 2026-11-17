import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { GAMES, getGameBySlug, getGamesBySlugs } from "@/lib/games";
import { getOccasionsBySlugs } from "@/lib/occasions";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { GamePreview } from "@/components/public/GamePreview";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { ClosingCta, PageHeader, SectionHeading, TextLink } from "@/components/public/PageParts";

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

export default async function GamePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const relatedGames = getGamesBySlugs(game.relatedGameSlugs).slice(0, 3);
  const relatedOccasions = getOccasionsBySlugs(game.recommendedOccasionSlugs).slice(0, 3);
  const players = game.minPlayers <= 1 ? "Any group size" : `${game.minPlayers}+ players`;

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

  const needs = [
    { label: "A big screen", detail: "Any TV, laptop, monitor or projector with a browser." },
    { label: "Everyone's phones", detail: `Any phone or tablet with a browser. ${players}.` },
    { label: "A room code", detail: "Made when you open the room. Players type it in, no accounts." },
  ];

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Games", href: "/games" },
          { label: game.name, href: `/games/${game.slug}` },
        ]}
        title={game.name}
        sub={
          <>
            <span style={{ color: "var(--cream)" }}>{game.tagline}</span> {game.longDescription}
          </>
        }
        actions={
          <>
            <Link href={`/host/new?game=${game.gameType}`} className="btn-rough px-7 py-3 text-xl">
              Play {game.name} free
            </Link>
            <TextLink href="/how-it-works">How it works</TextLink>
          </>
        }
        aside={
          <div className="flex flex-col items-center gap-5">
            {/* the game's core moment, drawn at stage size */}
            <div
              className="panel relative flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden"
              style={{ background: game.color }}
              aria-hidden
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1.6px)", backgroundSize: "10px 10px" }}
              />
              <div className="relative scale-[1.6] sm:scale-[1.8]">
                <GamePreview slug={game.slug} />
              </div>
            </div>
            <ul className="flex flex-wrap justify-center gap-2" aria-label="Game details">
              <li className="chip">{game.category}</li>
              <li className="chip">{players}</li>
              {game.virtualHostSupported && (
                <li className="chip" style={{ color: "var(--mustard)" }}>
                  Virtual Host
                </li>
              )}
            </ul>
          </div>
        }
      />

      {/* curtain band: the rules, one strip */}
      <section aria-labelledby="rules-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading id="rules-heading">How a round plays</SectionHeading>
          <div className="panel panel-grain grid md:grid-cols-2">
            {[
              { title: "The round", body: game.howItWorks },
              { title: "The points", body: game.scoring },
            ].map((block) => (
              <div
                key={block.title}
                className="flex flex-col gap-3 border-dashed p-6 md:p-8 max-md:[&:not(:first-child)]:border-t-[3px] md:[&:not(:first-child)]:border-l-[3px]"
              >
                <h3 className="font-display text-2xl" style={{ color: "var(--ink)" }}>
                  {block.title}
                </h3>
                <p className="font-hand max-w-[60ch] text-xl leading-snug" style={{ color: "var(--ink-body)" }}>
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="needs-heading" className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <SectionHeading
          id="needs-heading"
          sub={`Free for up to ${LIMITS.free.maxPlayers} players. Nobody installs anything.`}
        >
          What you need
        </SectionHeading>
        <RevealList as="ol" className="grid gap-6 sm:grid-cols-3">
          {needs.map((n) => (
            <RevealItem as="li" key={n.label} className="flex flex-col gap-2 border-t-4 border-dashed pt-4" style={{ borderColor: "rgba(245,236,212,0.3)" }}>
              <h3 className="font-display text-xl" style={{ color: "var(--cream)" }}>
                {n.label}
              </h3>
              <p className="font-hand text-lg leading-snug" style={{ color: "var(--cream-muted)" }}>
                {n.detail}
              </p>
            </RevealItem>
          ))}
        </RevealList>
        {relatedOccasions.length > 0 && (
          <p className="font-hand mt-12 text-center text-xl" style={{ color: "var(--cream-muted)" }}>
            Great for{" "}
            {relatedOccasions.map((o, i) => (
              <span key={o.slug}>
                <Link
                  href={`/occasions/${o.slug}`}
                  className="underline decoration-2 underline-offset-4 transition-colors hover:text-[var(--mustard)]"
                  style={{ color: "var(--cream)" }}
                >
                  {o.name.toLowerCase()}
                </Link>
                {i < relatedOccasions.length - 2 ? ", " : i === relatedOccasions.length - 2 ? " and " : "."}
              </span>
            ))}
          </p>
        )}
      </section>

      {game.gameFaq.length > 0 && (
        <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-6 pb-16 md:pb-24">
          <SectionHeading id="faq-heading">Questions about {game.name}</SectionHeading>
          <PublicFAQ items={game.gameFaq} />
        </section>
      )}

      {relatedGames.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto w-full max-w-5xl px-6 pb-16 md:pb-24">
          <SectionHeading id="related-heading">If your room liked this</SectionHeading>
          <RevealList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedGames.map((g) => (
              <RevealItem key={g.slug} className="flex">
                <PublicGameCard game={g} />
              </RevealItem>
            ))}
          </RevealList>
        </section>
      )}

      <ClosingCta
        title={`Ready to play ${game.name}?`}
        body="Free to host. Players join in seconds with a room code."
        cta={{ href: `/host/new?game=${game.gameType}`, label: `Play ${game.name} free` }}
        link={{ href: "/games", label: "All games" }}
      />
    </div>
  );
}
