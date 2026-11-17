import type { Metadata } from "next";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { PageHeader, TextLink } from "@/components/public/PageParts";

export const metadata: Metadata = {
  title: `Help & FAQ | ${BRAND_NAME}`,
  description: `Common questions about ScreenParty, how to join a game, how to host, what the Virtual Host does, and how pricing works.`,
  openGraph: {
    title: `Help & FAQ | ${BRAND_NAME}`,
    description: "Common questions about ScreenParty answered.",
  },
};

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

const SECTIONS = [
  { id: "joining", title: "Joining a game", items: JOINING_FAQS },
  { id: "hosting", title: "Hosting", items: HOSTING_FAQS },
  { id: "virtual-host", title: "Virtual Host", items: VIRTUAL_HOST_FAQS, more: { href: "/virtual-host", label: "The Virtual Host page" } },
  { id: "games", title: "Games", items: GAMES_FAQS, more: { href: "/games", label: "Browse all games" } },
  { id: "technical", title: "Technical", items: TECH_FAQS },
];

export default function HelpPage() {
  return (
    <div className="relative">
      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Help", href: "/help" },
        ]}
        title="How can we help?"
        sub="Answers about joining, hosting, the games and the Virtual Host."
      />

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 pb-24 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-14">
        <nav aria-label="Help sections" className="md:sticky md:top-6 md:h-fit">
          <ul className="flex flex-wrap gap-2 md:flex-col md:gap-0">
            {SECTIONS.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="font-score flex min-h-11 items-center rounded-lg border-2 px-3 text-sm uppercase tracking-[0.12em] transition-colors hover:text-[var(--mustard)] md:border-0 md:px-0"
                  style={{ color: "var(--cream)", borderColor: "rgba(245,236,212,0.3)" }}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-16">
          {SECTIONS.map(({ id, title, items, more }) => (
            <section key={id} id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6">
              <h2 id={`${id}-heading`} className="font-display mb-6 text-3xl uppercase" style={{ color: "var(--cream)" }}>
                {title}
              </h2>
              <PublicFAQ items={items} />
              {more && (
                <div className="mt-3">
                  <TextLink href={more.href}>{more.label} →</TextLink>
                </div>
              )}
            </section>
          ))}

          <section aria-labelledby="contact-heading" className="panel-paper panel-grain p-6">
            <h2 id="contact-heading" className="font-display text-xl" style={{ color: "var(--ink)" }}>
              Still stuck?
            </h2>
            {/* Owner decision needed: replace with actual support channel (email, Discord, etc.) */}
            <p className="font-hand mt-2 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
              Contact us through your account dashboard.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
