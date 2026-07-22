import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { TapedLabel } from "@/components/cartoon/Panel";
import { SpotRays } from "@/components/cartoon/Doodles";

export const metadata: Metadata = {
  title: `Help & FAQ | ${BRAND_NAME}`,
  description: `Common questions about ScreenParty, how to join a game, how to host, what the Virtual Host does, and how pricing works.`,
  openGraph: {
    title: `Help & FAQ | ${BRAND_NAME}`,
    description: "Common questions about ScreenParty answered.",
  },
};

const INK = "#221f30";

const JOINING_FAQS = [
  {
    q: "What do players need to join a game?",
    a: "Just a phone, tablet, or laptop with a modern browser. No app download, no account, no email address. Players go to screenparty.gg/join, type the room code, and pick a mascot.",
  },
  {
    q: "Where do players find the room code?",
    a: "The room code is displayed on the main game screen, the TV, laptop, or projector the host has opened. It's a four-letter code shown prominently in the lobby.",
  },
  {
    q: "Does ScreenParty work on iPhone and Android?",
    a: "Yes. Any modern smartphone browser works, Safari on iPhone, Chrome on Android, or any other up-to-date browser.",
  },
  {
    q: "What happens if a player loses connection?",
    a: "Players who disconnect can rejoin using the same room code and their previously picked mascot while the room is still active.",
  },
];

const HOSTING_FAQS = [
  {
    q: "What do I need to host a game?",
    a: "A free ScreenParty account and a screen with a browser, a TV connected to a laptop, a standalone laptop, a monitor, or a projector all work.",
  },
  {
    q: "How do I create a room?",
    a: "Sign in to your dashboard, choose a game from the lineup, configure the settings (number of questions, Virtual Host on or off), and create the room. A room code is generated immediately.",
  },
  {
    q: "Can I play while hosting?",
    a: "In manual mode, the host manages transitions from the main screen and can't easily play simultaneously. With the Virtual Host on, everything is automated and the host can join as a player on their phone.",
  },
  {
    q: "How long does a room last?",
    a: `Rooms expire after ${LIMITS.free.roomTtlHours} hours on the free plan, ${LIMITS.party_plus.roomTtlHours} hours on Party+ and Party Pass, and ${LIMITS.pro_host.roomTtlHours} hours on Pro Host. You can start a new game session in the same room before it expires.`,
  },
  {
    q: "Can I kick a player?",
    a: "Yes. From the host view, you can remove any player from the room.",
  },
  {
    q: "Can I switch games without ending the session?",
    a: "Yes. From your dashboard, you can start a new game session in the same room without everyone needing to rejoin.",
  },
];

const VIRTUAL_HOST_FAQS = [
  {
    q: "What is the Virtual Host?",
    a: "An automated game-show host that reads questions out loud, reacts to what happens in the room, and advances the game automatically. It uses artificial intelligence for voice generation and some game-state reactions.",
  },
  {
    q: "Which games support the Virtual Host?",
    a: `All ${AVAILABLE_GAMES.length} games: Fact Frenzy, Two Truths & a Lie, Would You Rather, Most Likely To, Higher or Lower, Guess the Player, Shark Tank, Charades, and Number Rating.`,
  },
  {
    q: "Is the Virtual Host free?",
    a: `Yes, during the current beta period. The free plan includes ${LIMITS.free.aiHostGamesPerMonth} Virtual Host game sessions per month.`,
  },
  {
    q: "Can I run the game manually without the Virtual Host?",
    a: "Yes. Every game supports manual hosting where you advance rounds yourself.",
  },
];

const GAMES_FAQS = [
  {
    q: "What games are available?",
    a: `There are ${AVAILABLE_GAMES.length} games: Fact Frenzy (buzz-in trivia), Two Truths & a Lie (bluffing), Would You Rather (voting), Most Likely To (group voting), Higher or Lower (number trivia), Guess the Player (social guessing), Shark Tank (pitching), Charades (acting), and Number Rating (ranking).`,
  },
  {
    q: "Are all games included on the free plan?",
    a: `Yes. All ${AVAILABLE_GAMES.length} games are available on every plan including the free plan.`,
  },
  {
    q: "How many players do the games need?",
    a: "Fact Frenzy works with 1 or more players. All other games need at least 3 players to work well.",
  },
  {
    q: "Can I create custom questions or prompts?",
    a: "Yes. When configuring a game room, you can add custom questions for Fact Frenzy, custom prompts for Would You Rather and Most Likely To, custom word lists for Charades, and custom category themes for Number Rating.",
  },
];

const TECH_FAQS = [
  {
    q: "Which browsers are supported?",
    a: "Any modern browser, Chrome, Firefox, Safari, Edge. The main screen and player phones both just need an up-to-date browser.",
  },
  {
    q: "Can I use a smart TV?",
    a: "If the TV has a built-in browser, yes. Otherwise, connect a laptop to the TV via HDMI and use the laptop's browser as the main screen.",
  },
  {
    q: "Can ScreenParty be played remotely over video call?",
    a: "Yes. Share the main game screen as a window in Zoom, Google Meet, or any video call app. Players join the game from their phones and can see each other on the call.",
  },
  {
    q: "Does ScreenParty require a fast internet connection?",
    a: "A standard home Wi-Fi connection is sufficient. ScreenParty uses real-time communication for game state but does not stream high-bandwidth video.",
  },
];

export default function HelpPage() {
  return (
    <div className="relative overflow-hidden">
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "Help", href: "/help" },
          ]}
        />

        <TapedLabel tilt={-1} color="var(--paper)">
          <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
            help & faq
          </span>
        </TapedLabel>
        <h1
          className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
          style={{ color: "var(--cream)" }}
        >
          Common Questions
        </h1>
        <p className="font-hand mt-4 text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
          Everything you need to know about joining, hosting, games, and the Virtual Host.
        </p>

        <nav aria-label="Help sections" className="mt-8 flex flex-wrap gap-2">
          {[
            { label: "Joining", href: "#joining" },
            { label: "Hosting", href: "#hosting" },
            { label: "Virtual Host", href: "#virtual-host" },
            { label: "Games", href: "#games" },
            { label: "Technical", href: "#technical" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="font-score rounded-full border-2 border-current px-3 py-1 text-[10px] uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
              style={{ color: "var(--cream)" }}
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="joining" className="mt-12">
          <h2 className="font-display mb-5 text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Joining a Game
          </h2>
          <PublicFAQ items={JOINING_FAQS} />
        </section>

        <section id="hosting" className="mt-12">
          <h2 className="font-display mb-5 text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Hosting
          </h2>
          <PublicFAQ items={HOSTING_FAQS} />
        </section>

        <section id="virtual-host" className="mt-12">
          <h2 className="font-display mb-5 text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Virtual Host
          </h2>
          <PublicFAQ items={VIRTUAL_HOST_FAQS} />
          <div className="mt-4">
            <Link
              href="/virtual-host"
              className="font-score text-[10px] uppercase tracking-[0.25em] underline"
              style={{ color: "var(--cream)" }}
            >
              Full Virtual Host page →
            </Link>
          </div>
        </section>

        <section id="games" className="mt-12">
          <h2 className="font-display mb-5 text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Games
          </h2>
          <PublicFAQ items={GAMES_FAQS} />
          <div className="mt-4">
            <Link
              href="/games"
              className="font-score text-[10px] uppercase tracking-[0.25em] underline"
              style={{ color: "var(--cream)" }}
            >
              Browse all games →
            </Link>
          </div>
        </section>

        <section id="technical" className="mt-12">
          <h2 className="font-display mb-5 text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Technical
          </h2>
          <PublicFAQ items={TECH_FAQS} />
        </section>

        <div className="mb-20 mt-12 border-t pt-8" style={{ borderColor: "rgba(245,236,212,0.15)" }}>
          <p className="font-hand text-xl" style={{ color: "var(--muted-foreground)" }}>
            Still have a question?{" "}
            {/* Owner decision needed: replace with actual support channel (email, Discord, etc.) */}
            <span style={{ color: "var(--cream)" }}>Contact us through your account dashboard.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
