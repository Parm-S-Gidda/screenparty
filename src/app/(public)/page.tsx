import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { Mascot } from "@/components/cartoon/Mascot";
import { LandingJoinForm } from "@/components/LandingJoinForm";
import { SpotRays, StarField } from "@/components/cartoon/Doodles";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { HeroStage } from "@/components/public/HeroStage";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { SectionHeading } from "@/components/public/PageParts";

export const metadata: Metadata = {
  title: `Free Party Games for the Big Screen | ${BRAND_NAME}`,
  description:
    "Play party games on any screen, on any device. Trivia, bluffing, acting, voting, and more. Everyone joins with a room code. No app required.",
  openGraph: {
    title: `Free Party Games for the Big Screen | ${BRAND_NAME}`,
    description:
      "Play party games on any screen, on any device. Trivia, bluffing, acting, voting, and more. Everyone joins with a room code. No app required.",
  },
};

const FAQS = [
  {
    q: "What do players need to join a game?",
    a: "Just a phone with a browser. Players open the join page, type the room code from the big screen, pick a mascot, and they're in. No app, no account, no download.",
  },
  {
    q: "Is ScreenParty free?",
    a: `Yes. The free plan hosts up to ${LIMITS.free.maxPlayers} players with all ${AVAILABLE_GAMES.length} games, forever. A $5.99 Party Pass unlocks rooms of up to ${LIMITS.party_plus.maxPlayers} for 24 hours, and monthly plans go up to ${LIMITS.pro_host.maxPlayers} players.`,
  },
  {
    q: "What is the Virtual Host?",
    a: "An optional game-show host that runs the whole session: it reads questions and statements out loud, calls out buzzes, reacts to what happens in the room, and keeps the game moving so you can play too. Some voice and reaction functionality is generated using artificial intelligence.",
  },
  {
    q: "What do I need to host?",
    a: "Any screen with a browser: a TV, a laptop or a projector. Open your room on the big screen, and you or the Virtual Host runs the show from there.",
  },
  {
    q: "Can I play with people in different locations?",
    a: "Yes. Share the main screen on a video call and everyone joins from their own phone, wherever they are.",
  },
];

// How-it-works storyboard: each step is drawn as the real UI it describes.
const STEPS = [
  {
    step: "Open a room on the big screen",
    detail: "Any browser on a TV, laptop or projector. A room code appears.",
    visual: (
      <div className="flex flex-col items-center">
        <div
          className="flex h-[88px] w-40 flex-col items-center justify-center gap-0.5 rounded-lg border-4"
          style={{ borderColor: "var(--ink)", background: "var(--stage-bg)" }}
        >
          <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
            Room code
          </span>
          <span className="font-display text-3xl tracking-[0.2em]" style={{ color: "var(--mustard)" }}>
            H4YU
          </span>
        </div>
        <div className="h-2 w-6" style={{ background: "var(--ink)" }} />
        <div className="h-1.5 w-16 rounded-full" style={{ background: "var(--ink)" }} />
      </div>
    ),
  },
  {
    step: "Friends join on their phones",
    detail: "They type the code, pick a character, and the phone becomes their controller.",
    visual: (
      <div
        className="flex h-[112px] w-[72px] flex-col items-center justify-center gap-2 rounded-2xl border-4 px-1.5"
        style={{ borderColor: "var(--ink)", background: "var(--card-white)" }}
      >
        <div className="flex gap-0.5">
          {"H4YU".split("").map((ch) => (
            <span
              key={ch}
              className="font-display flex h-5 w-3.5 items-center justify-center rounded-[3px] border-2 text-xs"
              style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
            >
              {ch}
            </span>
          ))}
        </div>
        <span
          className="font-display w-full rounded-md border-2 py-0.5 text-center text-xs"
          style={{ borderColor: "var(--ink)", background: "var(--mustard)", color: "var(--ink)" }}
        >
          Join
        </span>
      </div>
    ),
  },
  {
    step: "Play, laugh, crown a winner",
    detail: "Run the show yourself, or let the Virtual Host run it so you can play too.",
    visual: (
      <ol className="flex w-44 flex-col gap-1.5">
        {[
          { name: "Sam", pts: "1,250", lead: true },
          { name: "Alex", pts: "980" },
          { name: "Priya", pts: "760" },
        ].map((row, i) => (
          <li
            key={row.name}
            className="font-score flex items-center justify-between rounded-md border-[3px] px-2 py-0.5 text-sm"
            style={{
              borderColor: "var(--ink)",
              background: row.lead ? "var(--mustard)" : "var(--paper)",
              color: "var(--ink)",
            }}
          >
            <span>
              {i + 1}. {row.name}
            </span>
            <span>{row.pts}</span>
          </li>
        ))}
      </ol>
    ),
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    line: `Up to ${LIMITS.free.maxPlayers} players. All ${AVAILABLE_GAMES.length} games.`,
  },
  {
    name: "Party Pass",
    price: "$5.99",
    cadence: "one night (24 hours)",
    line: `Up to ${LIMITS.party_plus.maxPlayers} players. No subscription.`,
    featured: true,
  },
  {
    name: "Party+",
    price: "$10",
    cadence: "per month",
    line: `Up to ${LIMITS.party_plus.maxPlayers} players, every night.`,
  },
];

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://screenparty.gg";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: BRAND_NAME, url: siteUrl },
      {
        "@type": "WebSite",
        name: BRAND_NAME,
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/games?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        name: BRAND_NAME,
        applicationCategory: "GameApplication",
        operatingSystem: "Web browser",
        description:
          "Party games on any screen, controlled from any device. Trivia, bluffing, acting, voting, ranking, and more. No app or accounts for players.",
        offers: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
          { "@type": "Offer", name: "Party Pass (24 hours)", price: "5.99", priceCurrency: "USD" },
          { "@type": "Offer", name: "Party+ (monthly)", price: "10.00", priceCurrency: "USD" },
          { "@type": "Offer", name: "Pro Host (monthly)", price: "30.00", priceCurrency: "USD" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ── */}
      <section className="relative z-10 overflow-hidden px-6 pb-20 pt-10 md:pt-16">
        <SpotRays className="pointer-events-none absolute left-0 top-0 h-full w-[55vw] opacity-40 [mask-image:linear-gradient(to_bottom,black_45%,transparent_95%)]" />
        <SpotRays flip className="pointer-events-none absolute right-0 top-0 h-full w-[55vw] opacity-40 [mask-image:linear-gradient(to_bottom,black_45%,transparent_95%)]" />
        <StarField />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h1
              className="font-display text-balance text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.95]"
              style={{ color: "var(--cream)" }}
            >
              Party games for the <span style={{ color: "var(--mustard)" }}>big screen</span>
            </h1>
            <p className="font-hand max-w-md text-balance text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
              Put a game on your TV or laptop. Everyone plays from their own phone with a room code.
              No app, no console. Free for up to {LIMITS.free.maxPlayers} players.
            </p>
            <div className="flex w-full max-w-sm flex-col gap-4">
              <LandingJoinForm />
              <Link href="/signup" className="btn-rough flex items-center justify-center px-6 py-3 text-xl" style={{ background: "var(--teal)" }}>
                Host a free game
              </Link>
            </div>
          </div>
          <HeroStage />
        </div>
      </section>

      {/* ── How it works ── */}
      {/* curtain band: hard break between the hero stage and the explainer */}
      <section aria-labelledby="how-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
        <SectionHeading id="how-heading">On the air in minutes</SectionHeading>
        {/* One storyboard strip, not three cards: the steps read as a sequence */}
        <ol className="panel panel-grain grid md:grid-cols-3">
          {STEPS.map((item, i) => (
            <li
              key={item.step}
              className="relative flex flex-col items-center gap-3 border-dashed px-6 py-8 text-center max-md:[&:not(:first-child)]:border-t-[3px] md:[&:not(:first-child)]:border-l-[3px]"
            >
              <div aria-hidden className="flex h-[124px] items-center justify-center">
                {item.visual}
              </div>
              <h3 className="font-display mt-2 text-balance text-xl leading-tight" style={{ color: "var(--ink)" }}>
                <span style={{ color: "var(--tomato)" }}>{i + 1}.</span> {item.step}
              </h3>
              <p className="font-hand max-w-[26ch] text-lg leading-snug" style={{ color: "#4a4460" }}>
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
        </div>
      </section>

      {/* ── Games ── */}
      <section aria-labelledby="games-heading" className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <SectionHeading id="games-heading" sub="Trivia, bluffing, acting, voting, pitching and more. Pick one and press play.">
          {AVAILABLE_GAMES.length} games, one room code
        </SectionHeading>
        <RevealList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_GAMES.map((game) => (
            <RevealItem key={game.slug} className="flex">
              <PublicGameCard game={game} />
            </RevealItem>
          ))}
        </RevealList>
      </section>

      {/* ── Virtual Host ── */}
      {/* curtain band: spotlight on the host */}
      <section aria-labelledby="vh-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 id="vh-heading" className="font-display text-balance text-3xl uppercase md:text-4xl" style={{ color: "var(--cream)" }}>
              Let the Virtual Host run the show
            </h2>
            <p className="font-hand mt-4 text-xl leading-snug" style={{ color: "var(--cream)" }}>
              Turn it on and play along with everyone else. It reads every question out loud, reacts to
              buzzes and answers, announces results and keeps the night moving.
            </p>
            <Link href="/virtual-host" className="btn-rough mt-6 inline-flex px-5 py-2.5 text-lg" style={{ background: "var(--ink)", color: "var(--cream)", borderColor: "var(--cream)" }}>
              Meet the Virtual Host
            </Link>
          </div>
          <RevealList className="flex items-center justify-center">
            <RevealItem className="panel relative p-8">
              <div className="flex flex-col items-center gap-4">
                <Mascot avatarId="wizard" size={96} expression="winner" animate={false} />
                <div className="panel-paper px-4 py-2 text-center" style={{ background: "var(--paper)" }}>
                  <p className="font-hand text-xl" style={{ color: "var(--ink)" }}>
                    &ldquo;Ooh, that was close,
                    <br />
                    but not close enough!&rdquo;
                  </p>
                </div>
              </div>
            </RevealItem>
          </RevealList>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section aria-labelledby="pricing-heading" className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24" id="pricing">
        <SectionHeading id="pricing-heading" sub="Start free. Pay only when the party gets bigger.">
          Free game nights, bigger ones when you want
        </SectionHeading>
        <RevealList className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <RevealItem
              key={plan.name}
              className="panel-paper panel-grain relative flex flex-col gap-2 p-6"
            >
              {plan.featured && (
                <span
                  className="font-score absolute -top-3.5 left-5 rounded-md border-2 px-3 py-0.5 text-xs uppercase tracking-[0.15em]"
                  style={{ background: "var(--mustard)", color: "var(--ink)", borderColor: "var(--ink)" }}
                >
                  Best for one night
                </span>
              )}
              <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>
                {plan.name}
              </h3>
              <p>
                <span className="font-score text-3xl" style={{ color: "var(--ink)" }}>{plan.price}</span>{" "}
                <span className="font-hand text-lg" style={{ color: "#6b6248" }}>{plan.cadence}</span>
              </p>
              <p className="font-hand text-lg leading-snug" style={{ color: "#4a4460" }}>{plan.line}</p>
            </RevealItem>
          ))}
        </RevealList>
        <p className="font-hand mt-8 text-center text-lg" style={{ color: "var(--muted-foreground)" }}>
          Running bigger events? Pro Host covers up to {LIMITS.pro_host.maxPlayers} players.{" "}
          <Link href="/pricing" className="font-score text-base uppercase tracking-[0.1em] underline decoration-2 underline-offset-4" style={{ color: "var(--cream)" }}>
            Compare all plans
          </Link>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
        <SectionHeading id="faq-heading">Before the buzzer</SectionHeading>
        <PublicFAQ items={FAQS} withSchema={false} />
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-24 pt-8 text-center">
        <RevealList>
          <RevealItem className="panel panel-grain flex flex-col items-center gap-5 p-8 md:p-12">
            <h2 className="font-display text-3xl uppercase md:text-4xl" style={{ color: "var(--ink)" }}>
              Ready to play?
            </h2>
            <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
              Set up a room in under a minute. Your friends just need their phones.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link href="/signup" className="btn-rough px-8 py-3 text-xl">
                Host a free game
              </Link>
              <Link href="/join" className="font-score text-base uppercase tracking-[0.1em] underline decoration-2 underline-offset-4" style={{ color: "var(--ink)" }}>
                Join a game
              </Link>
            </div>
          </RevealItem>
        </RevealList>
      </section>
    </div>
  );
}
