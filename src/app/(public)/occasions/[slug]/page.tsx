import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { OCCASIONS, getOccasionBySlug } from "@/lib/occasions";
import { GAMES, getGamesBySlugs } from "@/lib/games";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { ClosingCta, PageHeader, SectionHeading, TextLink } from "@/components/public/PageParts";

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

export default async function OccasionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const occasion = getOccasionBySlug(slug);
  if (!occasion) notFound();

  const recommendedGames = getGamesBySlugs(occasion.recommendedGameSlugs);
  // run-of-show entries name games by display name; colour the dot when it matches one
  const colorFor = (name: string) => GAMES.find((g) => g.name === name)?.color ?? "var(--paper)";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Occasions", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/occasions` },
      { "@type": "ListItem", position: 2, name: occasion.name },
    ],
  };

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Occasions", href: "/occasions" },
          { label: occasion.name, href: `/occasions/${occasion.slug}` },
        ]}
        title={occasion.name}
        sub={
          <>
            <span style={{ color: "var(--cream)" }}>{occasion.tagline}</span> {occasion.intro}
          </>
        }
        actions={
          <>
            <Link href="/signup" className="btn-rough px-7 py-3 text-xl">
              Host a free game
            </Link>
            <TextLink href="#show-heading">See the run of show</TextLink>
          </>
        }
      />

      {/* curtain band: the run of show as a cue sheet */}
      <section aria-labelledby="show-heading" className="band-curtain scroll-mt-6 px-6 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-start">
          <div>
            <h2 id="show-heading" className="font-display text-balance text-3xl uppercase leading-[1.05] md:text-4xl" style={{ color: "var(--cream)" }}>
              A {occasion.runOfShowDuration} run of show
            </h2>
            <p className="font-hand mt-4 text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
              This order works for most groups. Swap games as the room warms up.
            </p>
            <p className="mt-6 flex flex-col gap-1">
              <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                Group size
              </span>
              <span className="font-hand text-xl leading-snug" style={{ color: "var(--cream)" }}>
                {occasion.groupSizeGuidance}
              </span>
            </p>
          </div>
          <ol className="panel panel-grain flex flex-col px-5 py-2 md:px-7">
            {occasion.suggestedRunOfShow.map((item, i) => (
              <li
                key={item.game}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] border-dashed py-4 [&:not(:first-child)]:border-t-[3px]"
              >
                <span className="font-display text-xl" style={{ color: "var(--tomato)" }}>
                  {i + 1}.
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display flex items-center gap-2 text-xl leading-tight" style={{ color: "var(--ink)" }}>
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border-2" style={{ background: colorFor(item.game), borderColor: "var(--ink)" }} />
                    {item.game}
                  </h3>
                  {item.note && (
                    <p className="font-hand text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                      {item.note}
                    </p>
                  )}
                </div>
                <span className="font-score col-start-2 whitespace-nowrap text-sm sm:col-start-3 sm:row-start-1 uppercase tabular-nums tracking-[0.1em]" style={{ color: "var(--ink-label)" }}>
                  {item.duration}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="setup-heading" className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <SectionHeading id="setup-heading" align="left">
              Setup tips
            </SectionHeading>
            <RevealList as="ul" className="flex flex-col gap-5">
              {occasion.setupTips.map((tip) => (
                <RevealItem as="li" key={tip} className="font-hand flex items-start gap-3 text-xl leading-snug" style={{ color: "var(--cream-muted)" }}>
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-1.5 h-4 w-4 shrink-0" fill="none" stroke="var(--mustard)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                  </svg>
                  <span className="max-w-[56ch]">{tip}</span>
                </RevealItem>
              ))}
            </RevealList>
          </div>
          <aside aria-labelledby="content-heading" className="panel-paper panel-grain h-fit p-6">
            <h2 id="content-heading" className="font-display text-xl" style={{ color: "var(--ink)" }}>
              Content notes
            </h2>
            <p className="font-hand mt-3 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
              {occasion.contentNotes}
            </p>
          </aside>
        </div>
      </section>

      {recommendedGames.length > 0 && (
        <section aria-labelledby="games-heading" className="mx-auto w-full max-w-5xl px-6 pb-16 md:pb-24">
          <SectionHeading id="games-heading">Games for this crowd</SectionHeading>
          <RevealList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedGames.map((game) => (
              <RevealItem key={game.slug} className="flex">
                <PublicGameCard game={game} />
              </RevealItem>
            ))}
          </RevealList>
        </section>
      )}

      <ClosingCta
        title="Ready to host?"
        body="Free to start. Players join in seconds with a room code."
        cta={{ href: "/signup", label: "Host a free game" }}
        link={{ href: "/occasions", label: "Other occasions" }}
      />
    </div>
  );
}
