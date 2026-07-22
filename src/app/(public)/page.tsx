import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { Mascot } from "@/components/cartoon/Mascot";
import { LandingJoinForm } from "@/components/LandingJoinForm";
import { TapedLabel } from "@/components/cartoon/Panel";
import {
  DoodleStar,
  ScribbleUnderline,
  SpotRays,
  StarField,
} from "@/components/cartoon/Doodles";
import { PublicGameCard } from "@/components/public/PublicGameCard";
import { PricingSection } from "@/components/public/PricingSection";
import { PublicFAQ } from "@/components/public/PublicFAQ";

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

const INK = "#221f30";

const FAQS = [
  {
    q: "What do players need to join a game?",
    a: "Just a phone with a browser. Players open the join page, type the room code from the big screen, pick a mascot, and they're in, no app, no account, no download.",
  },
  {
    q: "Is ScreenParty free?",
    a: `Yes, the free plan hosts up to ${LIMITS.free.maxPlayers} players with all nine games, forever. A $5.99 Party Pass unlocks bigger games for 24 hours, and monthly plans go up to ${LIMITS.pro_host.maxPlayers} players.`,
  },
  {
    q: "How many people can play at once?",
    a: `${LIMITS.free.maxPlayers} on the free plan, ${LIMITS.party_plus.maxPlayers} with Party+ or a Party Pass, and up to ${LIMITS.pro_host.maxPlayers} with Pro Host, enough for a full office party.`,
  },
  {
    q: "What games are included?",
    a: `All ${AVAILABLE_GAMES.length} games are included on every plan: Fact Frenzy, Two Truths & a Lie, Would You Rather, Most Likely To, Higher or Lower, Guess the Player, Shark Tank, Charades, and Number Rating.`,
  },
  {
    q: "What is the Virtual Host?",
    a: "An optional game-show host that runs the whole session: it reads questions and statements out loud, calls out buzzes, reacts to what happens in the room, and keeps the game moving so you can play too. Some Voice and reaction functionality is generated using artificial intelligence.",
  },
  {
    q: "What do I need to host?",
    a: "Any screen with a browser, a TV, a laptop, a projector. Open your room on the big screen, and the Virtual Host or your own pace runs the show from there.",
  },
  {
    q: "Can I play with people in different locations?",
    a: "Yes. Share the main screen through a video call and everyone joins the game from their own phone wherever they are.",
  },
  {
    q: "Can I switch games without creating a new room?",
    a: "Yes. From your dashboard you can start a new game session in the same room without everyone needing a new room code.",
  },
];

const OCCASIONS = [
  { label: "House Parties", href: "/occasions/house-parties" },
  { label: "Birthdays", href: "/occasions/birthday-parties" },
  { label: "Family Game Night", href: "/occasions/family-game-night" },
  { label: "Team Building", href: "/occasions/team-building" },
  { label: "Office Parties", href: "/occasions/office-parties" },
  { label: "University Events", href: "/occasions/university-events" },
  { label: "Virtual Parties", href: "/occasions/virtual-parties" },
];

const WHY_BENEFITS = [
  { headline: "Everyone already has a controller", body: "Phones are the buttons. No gamepads, no dongles, no apps." },
  { headline: "No accounts for players", body: "Players join with a code and a mascot. Nothing to sign up for." },
  { headline: "Works on any screen", body: "TV, laptop, monitor, projector. If it has a browser, it works." },
  { headline: "Nine game types in one place", body: "Trivia, bluffing, voting, guessing, pitching, ranking, and acting." },
  { headline: "Manual or Virtual Host", body: "Run the show yourself or turn it over to the Virtual Host." },
  { headline: "Free to start", body: "No credit card. Just sign up, create a room, and play." },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: BRAND_NAME,
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://screenparty.gg",
      },
      {
        "@type": "WebSite",
        name: BRAND_NAME,
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://screenparty.gg",
        potentialAction: {
          "@type": "SearchAction",
          target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://screenparty.gg"}/games?q={search_term_string}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-[88vh] flex-col items-center justify-center gap-5 overflow-hidden px-6 pb-24 pt-10 text-center">
        {/* Spotlight rays scoped to hero only so they don't bleed into lower sections */}
        <SpotRays className="pointer-events-none absolute left-0 top-0 h-full w-[55vw] opacity-60" />
        <SpotRays flip className="pointer-events-none absolute right-0 top-0 h-full w-[55vw] opacity-60" />
        <StarField />

        {/* ── Floating background mascots ── */}
        {/* Left side: big floater top, spinner mid, small floater low */}
        <span className="pointer-events-none absolute left-2 top-[8%] z-[2]" aria-hidden
          style={{ animation: "float-mascot 5.4s ease-in-out infinite" }}>
          <Mascot avatarId="alien" size={96} expression="idle" animate={false} />
        </span>
        <span className="pointer-events-none absolute left-5 top-[52%] z-[2]" aria-hidden
          style={{ animation: "spin-bob 7.2s linear infinite 1.4s" }}>
          <Mascot avatarId="robot" size={60} expression="idle" animate={false} />
        </span>
        <span className="pointer-events-none absolute left-28 top-[78%] z-[2]" aria-hidden
          style={{ animation: "float-mascot 4.0s ease-in-out infinite 3.1s" }}>
          <Mascot avatarId="nerd" size={44} expression="idle" animate={false} />
        </span>

        {/* Right side: big floater top, medium floater mid */}
        <span className="pointer-events-none absolute right-2 top-[12%] z-[2]" aria-hidden
          style={{ animation: "float-mascot 4.9s ease-in-out infinite 0.6s" }}>
          <Mascot avatarId="cowboy" size={90} expression="idle" animate={false} />
        </span>
        <span className="pointer-events-none absolute right-6 top-[54%] z-[2]" aria-hidden
          style={{ animation: "float-mascot 5.8s ease-in-out infinite 2.2s" }}>
          <Mascot avatarId="queen" size={72} expression="idle" animate={false} />
        </span>
        <span className="pointer-events-none absolute right-32 top-[80%] z-[2]" aria-hidden
          style={{ animation: "spin-bob 8s linear infinite 4.5s" }}>
          <Mascot avatarId="ghost" size={46} expression="idle" animate={false} />
        </span>


        {/* Dark scrim: sits above mascots (z-2) but below content (z-10), blurs the background layer */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background: "rgba(22, 19, 36, 0.58)",
            backdropFilter: "blur(1.2px)",
            WebkitBackdropFilter: "blur(1.2px)",
          }}
        />

        <p
          className="relative z-10 font-score text-xs uppercase tracking-[0.4em]"
          style={{ color: "var(--mustard)", opacity: 0.9 }}
        >
          No app · No console · Just browsers
        </p>

        <div className="relative z-10">
          <p className="font-display relative inline-block text-5xl uppercase leading-none tracking-wide md:text-6xl">
            <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
            <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
            <DoodleStar size={26} className="absolute -left-8 -top-3 -rotate-12" />
            <DoodleStar size={18} color="#2fa8a0" className="absolute -right-7 top-1 rotate-12" />
          </p>
          <ScribbleUnderline className="mx-auto mt-1 w-3/4" color="#2fa8a0" />
          <h1
            className="font-display mx-auto mt-3 max-w-xl text-balance text-2xl uppercase tracking-wide md:text-3xl"
            style={{ color: "var(--cream)" }}
          >
            Free party games for the big screen. Any device is a controller.
          </h1>
          <p
            className="font-hand mx-auto mt-2 max-w-lg text-balance text-lg"
            style={{ color: "var(--muted-foreground)" }}
          >
            Trivia, bluffing, acting, voting, and more on your TV, laptop, or projector.
            Everyone joins from any device with a room code.
          </p>
        </div>

        <div className="relative z-10 flex w-full max-w-sm flex-col gap-3">
          <LandingJoinForm />
          <Link
            href="/signup"
            className="btn-rough flex items-center justify-center px-6 py-3 text-xl"
            style={{ background: "var(--teal)", color: "var(--cream)" }}
          >
            Host a free game
          </Link>
        </div>

        {/* gradient fade into the sections below */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to bottom, transparent, var(--stage-bg))" }}
        />
      </section>

      {/* ── Trust strip ── */}
      <section className="border-b py-6" style={{ borderColor: "rgba(245,236,212,0.1)" }}>
        <ul className="font-score mx-auto flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--muted-foreground)" }}>
          {[
            "No app required",
            "No player accounts",
            "Free to start",
            "9 game types",
            "Up to 50 players",
            "Works on any screen",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span aria-hidden style={{ color: "var(--teal)" }}>·</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* ── How it works ── */}
      <section
        aria-labelledby="how-heading"
        className="mx-auto w-full max-w-5xl px-6 py-14"
      >
        <SectionHeading id="how-heading" eyebrow="how it works">
          On the air in minutes
        </SectionHeading>
        <ol className="grid gap-5 md:grid-cols-4">
          {[
            {
              step: "Put the game on the big screen",
              detail: "Open your room in any browser. A room code appears on screen.",
              visual: (
                <div
                  className="mx-auto flex h-20 w-36 items-center justify-center rounded-lg border-[3px]"
                  style={{ borderColor: INK, background: INK }}
                  aria-hidden
                >
                  <span className="font-display text-2xl tracking-[0.3em]" style={{ color: "var(--mustard)" }}>
                    TUTQ
                  </span>
                </div>
              ),
            },
            {
              step: "Friends join from their phones",
              detail: "Type the code, pick a mascot, and the phone becomes the controller.",
              visual: (
                <div className="flex items-end justify-center gap-2" aria-hidden>
                  <div
                    className="flex h-20 w-12 -rotate-3 items-end justify-center rounded-xl border-[3px] pb-2"
                    style={{ borderColor: INK, background: "var(--paper)" }}
                  >
                    <div className="h-8 w-8 rounded-full border-[3px]" style={{ borderColor: INK, background: "var(--tomato)" }} />
                  </div>
                  <Mascot avatarId="party" size={48} animate={false} />
                </div>
              ),
            },
            {
              step: "Run the show or hand it over",
              detail: "Manage the game yourself or turn on the Virtual Host to play along.",
              visual: (
                <div className="flex items-center justify-center gap-2" aria-hidden>
                  <Mascot avatarId="wizard" size={48} expression="winner" animate={false} />
                  <div className="panel-paper rotate-1 px-2 py-1" style={{ background: "var(--cream)" }}>
                    <span className="font-hand text-sm" style={{ color: INK }}>&ldquo;Ooh, close!&rdquo;</span>
                  </div>
                </div>
              ),
            },
            {
              step: "Play, reveal, repeat",
              detail: "See the results, move to the next game, and keep the night going.",
              visual: (
                <div className="flex items-center justify-center gap-2" aria-hidden>
                  {["cowboy", "alien", "nerd"].map((id, i) => (
                    <Mascot key={id} avatarId={id} size={i === 1 ? 52 : 40} expression={i === 1 ? "winner" : "idle"} animate={false} />
                  ))}
                </div>
              ),
            },
          ].map((item, i) => (
            <li
              key={item.step}
              className="panel-paper panel-grain flex flex-col gap-3 p-5"
              style={{ background: "var(--cream)" }}
            >
              <span
                className="font-display flex h-8 w-8 items-center justify-center rounded-full border-[3px] pt-0.5 text-base"
                style={{ borderColor: INK, background: "var(--mustard)", color: INK }}
                aria-hidden
              >
                {i + 1}
              </span>
              {item.visual}
              <h3 className="font-display text-lg leading-tight" style={{ color: INK }}>
                {item.step}
              </h3>
              <p className="font-hand text-lg leading-snug" style={{ color: "#4a4460" }}>
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <SectionDivider />

      {/* ── Game catalogue ── */}
      <section
        aria-labelledby="games-heading"
        className="mx-auto w-full max-w-7xl px-6 py-14"
      >
        <SectionHeading id="games-heading" eyebrow="the games">
          {AVAILABLE_GAMES.length} online party games. One room code.
        </SectionHeading>
        <p
          className="font-hand mx-auto mb-10 max-w-xl text-center text-xl leading-snug"
          style={{ color: "var(--muted-foreground)" }}
        >
          Trivia, bluffing, acting, voting, pitching, and more. No app, no controller, just any
          browser and a room code.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {AVAILABLE_GAMES.map((game) => (
            <PublicGameCard key={game.slug} game={game} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/games"
            className="btn-rough inline-flex items-center px-8 py-3 text-xl"
            style={{ background: "var(--mustard)", color: INK }}
          >
            See All Games
          </Link>
        </div>
      </section>

      <SectionDivider />

      {/* ── Virtual Host ── */}
      <section
        aria-labelledby="vh-heading"
        className="mx-auto w-full max-w-5xl px-6 py-14"
      >
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <TapedLabel tilt={-1.5} color="var(--paper)">
              <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
                virtual host
              </span>
            </TapedLabel>
            <h2
              id="vh-heading"
              className="font-display mt-3 text-3xl uppercase tracking-wide md:text-4xl"
              style={{ color: "var(--cream)" }}
            >
              Play along with your own Virtual Host
            </h2>
            <p className="font-hand mt-4 text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
              Turn on the Virtual Host and play along with everyone else. It can read questions,
              explain rounds, announce results, keep the game moving, and react to what happens in
              the room.
            </p>
            <ul className="font-hand mt-5 flex flex-col gap-2 text-lg" style={{ color: "#4a4460" }}>
              {[
                "Reads every question and prompt out loud",
                "Reacts to buzzes, answers, and results",
                "Keeps the pace without you lifting a finger",
                "Works on all 9 games",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden style={{ color: "var(--mustard)" }}>★</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Link
                href="/virtual-host"
                className="btn-rough px-5 py-2.5 text-lg"
                style={{ background: "var(--mustard)", color: INK }}
              >
                Meet the Virtual Host
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="panel relative p-8" style={{ background: "var(--cream)" }}>
              <div className="flex flex-col items-center gap-4">
                <Mascot avatarId="wizard" size={96} expression="winner" animate={false} />
                <div className="panel-paper px-4 py-2 text-center" style={{ background: "var(--paper)" }}>
                  <p className="font-hand text-xl" style={{ color: INK }}>
                    &ldquo;Ooh, that was close -
                    <br />but not close enough!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Occasions ── */}
      <section
        aria-labelledby="occasions-heading"
        className="mx-auto w-full max-w-5xl px-6 py-14"
      >
        <SectionHeading id="occasions-heading" eyebrow="occasions">
          A game for every kind of gathering
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {OCCASIONS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="panel-paper panel-grain flex items-center p-4 transition-opacity hover:opacity-80"
              style={{ background: "var(--cream)" }}
            >
              <span className="font-display text-base leading-tight" style={{ color: INK }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── Why ScreenParty ── */}
      <section
        aria-labelledby="why-heading"
        className="mx-auto w-full max-w-5xl px-6 py-14"
      >
        <SectionHeading id="why-heading" eyebrow="why screenparty">
          Built for how people actually gather
        </SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {WHY_BENEFITS.map(({ headline, body }) => (
            <div
              key={headline}
              className="panel-paper panel-grain flex flex-col gap-2 p-5"
              style={{ background: "var(--cream)" }}
            >
              <h3 className="font-display text-xl leading-tight" style={{ color: INK }}>
                {headline}
              </h3>
              <p className="font-hand text-lg leading-snug" style={{ color: "#4a4460" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── Pricing ── */}
      <section
        aria-labelledby="pricing-heading"
        className="mx-auto w-full max-w-6xl px-6 py-14"
        id="pricing"
      >
        <SectionHeading id="pricing-heading" eyebrow="pricing">
          Free game nights, bigger ones when you want
        </SectionHeading>
        <PricingSection />
        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="font-score text-xs uppercase tracking-[0.25em] opacity-60 transition hover:opacity-100"
            style={{ color: "var(--cream)" }}
          >
            See full plan details →
          </Link>
        </div>
      </section>

      <SectionDivider />

      {/* ── FAQ ── */}
      <section
        aria-labelledby="faq-heading"
        className="mx-auto w-full max-w-3xl px-6 py-14"
      >
        <SectionHeading id="faq-heading" eyebrow="questions">
          Before the buzzer
        </SectionHeading>
        <PublicFAQ items={FAQS} withSchema={false} />
      </section>

      <SectionDivider />

      {/* ── Final CTA ── */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-16 pt-8 text-center">
        <div className="panel-paper panel-grain flex flex-col items-center gap-5 p-8 md:p-12" style={{ background: "var(--cream)" }}>
          <DoodleStar size={36} className="-mt-4" />
          <h2 className="font-display text-3xl uppercase tracking-wide" style={{ color: INK }}>
            Ready to play?
          </h2>
          <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
            Pick a game, set up a room, and you&apos;re live in under a minute.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/games"
              className="btn-rough px-8 py-3 text-xl"
              style={{ background: "var(--mustard)", color: INK }}
            >
              Choose a Game
            </Link>
            <Link
              href="/join"
              className="btn-rough px-8 py-3 text-xl"
              style={{ background: INK, color: "var(--cream)" }}
            >
              Join with Room Code
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto flex max-w-xs items-center gap-4 px-6">
      <span className="h-px flex-1" style={{ background: "rgba(245,236,212,0.1)" }} />
      <DoodleStar size={12} color="rgba(245,236,212,0.22)" />
      <span className="h-px flex-1" style={{ background: "rgba(245,236,212,0.1)" }} />
    </div>
  );
}

function SectionHeading({
  id,
  eyebrow,
  children,
}: {
  id: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <TapedLabel tilt={-1.5} color="var(--paper)">
        <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
          {eyebrow}
        </span>
      </TapedLabel>
      <h2
        id={id}
        className="font-display text-3xl uppercase tracking-wide md:text-4xl"
        style={{ color: "var(--cream)" }}
      >
        {children}
      </h2>
    </div>
  );
}
