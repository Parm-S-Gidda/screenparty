import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { Mascot } from "@/components/cartoon/Mascot";
import { TapedLabel } from "@/components/cartoon/Panel";
import { DoodleStar, SpotRays } from "@/components/cartoon/Doodles";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: `How ScreenParty Works | Phone-Controlled Party Games`,
  description:
    "One screen, everyone's phone, no app. Learn how to set up ScreenParty, create a room, and have your friends playing in minutes.",
  openGraph: {
    title: `How ScreenParty Works | Phone-Controlled Party Games`,
    description:
      "One screen, everyone's phone, no app. Learn how to set up ScreenParty on a TV, laptop, or projector.",
  },
};

const INK = "#221f30";

const HOW_FAQS = [
  {
    q: "What browsers are supported?",
    a: "ScreenParty works in any modern browser, Chrome, Firefox, Safari, and Edge on both desktop and mobile. No browser extensions required.",
  },
  {
    q: "Does ScreenParty work on iPhone and Android?",
    a: "Yes. Players join from any smartphone browser. iPhones use Safari or Chrome, Android phones use Chrome or any installed browser.",
  },
  {
    q: "Can I use a smart TV?",
    a: "If the smart TV has a built-in browser you can navigate to the room URL. Alternatively, connect a laptop, a tablet, or a streaming stick with a browser to use the TV as a display.",
  },
  {
    q: "How do players join without an account?",
    a: "Players go to screenparty.gg/join, type the room code from the big screen, pick a mascot, and they're in. No email, no password, no download.",
  },
  {
    q: "What happens when a room expires?",
    a: `Rooms expire after ${LIMITS.free.roomTtlHours} hours on the free plan, ${LIMITS.party_plus.roomTtlHours} hours with Party+, and ${LIMITS.pro_host.roomTtlHours} hours with Pro Host. Expired rooms are no longer joinable. Scores are shown at the end of each game regardless of the room session.`,
  },
  {
    q: "Can I switch games without making everyone rejoin?",
    a: "Yes. From your dashboard, you can start a new game session in the same room. Players who are already in the lobby stay connected.",
  },
  {
    q: "Can ScreenParty be played remotely over video call?",
    a: "Yes. Share the main game screen as a window in your video call and everyone joins the game from their phone wherever they are. The Virtual Host handles all pacing so you can focus on the call.",
  },
  {
    q: "Does the host need to stay on the game screen?",
    a: "In manual mode, the host advances rounds from the main screen. With the Virtual Host on, everything is automated and the host can play on their phone like everyone else.",
  },
];

export default function HowItWorksPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${BRAND_NAME}`,
    description: "Set up a browser party game on a TV or laptop and have friends join from their phones.",
    step: [
      {
        "@type": "HowToStep",
        name: "Create a free account",
        text: "Sign up at ScreenParty in under a minute. No credit card required.",
      },
      {
        "@type": "HowToStep",
        name: "Choose a game and create a room",
        text: "Pick from nine party games and create a room. A four-letter room code is generated.",
      },
      {
        "@type": "HowToStep",
        name: "Put the big screen on the room URL",
        text: "Open the room on your TV, laptop, monitor, or projector. The room code is displayed on screen.",
      },
      {
        "@type": "HowToStep",
        name: "Players join from their phones",
        text: "Everyone types the room code at screenparty.gg/join, picks a mascot, and they appear in the lobby.",
      },
      {
        "@type": "HowToStep",
        name: "Start the game",
        text: "Press start. Run the game yourself or turn on the Virtual Host to automate everything.",
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

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "How It Works", href: "/how-it-works" },
          ]}
        />

        <TapedLabel tilt={-1} color="var(--paper)">
          <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
            no manual required
          </span>
        </TapedLabel>

        <h1
          className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
          style={{ color: "var(--cream)" }}
        >
          Turn Any Screen Into a Party Game
        </h1>
        <p className="font-hand mt-4 max-w-xl text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
          One screen on the wall. Everyone&apos;s phone in their hand. No app, no console, no accounts for players.
        </p>

        {/* Step by step */}
        <section aria-labelledby="steps-heading" className="mt-14">
          <h2
            id="steps-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Getting Started
          </h2>
          <ol className="flex flex-col gap-6">
            {[
              {
                n: "1",
                title: "Create a free host account",
                body: "Sign up at ScreenParty. No credit card required. The free plan gives you everything you need to run a game night.",
                cta: { label: "Sign up free", href: "/signup" },
              },
              {
                n: "2",
                title: "Choose a game and create a room",
                body: `Pick from ${AVAILABLE_GAMES.length} party games. Set the number of questions or rounds, choose Virtual Host or manual mode, and create your room. A four-letter room code is generated.`,
                cta: { label: "Browse games", href: "/games" },
              },
              {
                n: "3",
                title: "Put the big screen on the room URL",
                body: "Open the room on your TV, laptop, monitor, or projector. The four-letter room code goes up on screen in lights. This is the display everyone in the room watches.",
              },
              {
                n: "4",
                title: "Players join from their phones",
                body: "Everyone goes to screenparty.gg/join, types the room code, picks a mascot, and they appear in the lobby. No accounts, no downloads. An iPhone, Android phone, or any device with a browser works.",
                cta: { label: "See join page", href: "/join" },
              },
              {
                n: "5",
                title: "Start the game",
                body: "Hit start from your host screen. In manual mode, you advance each round yourself. With the Virtual Host on, it reads every question, calls results, and keeps pace automatically while you play on your phone.",
              },
            ].map(({ n, title, body, cta }) => (
              <li
                key={n}
                className="panel-paper panel-grain flex gap-5 p-6"
                style={{ background: "var(--cream)" }}
              >
                <span
                  className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] pt-0.5 text-lg"
                  style={{ borderColor: INK, background: "var(--mustard)", color: INK }}
                  aria-hidden
                >
                  {n}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-xl leading-tight" style={{ color: INK }}>
                    {title}
                  </h3>
                  <p className="font-hand text-lg leading-snug" style={{ color: "#4a4460" }}>
                    {body}
                  </p>
                  {cta && (
                    <Link
                      href={cta.href}
                      className="font-score self-start text-[10px] uppercase tracking-[0.25em] underline"
                      style={{ color: INK }}
                    >
                      {cta.label} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Host vs Virtual Host */}
        <section aria-labelledby="modes-heading" className="mt-14">
          <h2
            id="modes-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Manual Mode vs Virtual Host
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="panel-paper panel-grain flex flex-col gap-3 p-6" style={{ background: "var(--cream)" }}>
              <h3 className="font-display text-xl" style={{ color: INK }}>Manual Mode</h3>
              <ul className="font-hand flex flex-col gap-2 text-lg" style={{ color: "#4a4460" }}>
                <li>· You advance each round by pressing a button</li>
                <li>· Questions appear on screen in silence</li>
                <li>· You can add your own commentary</li>
                <li>· Good when you want full control of the pace</li>
                <li>· Available on all plans</li>
              </ul>
            </div>
            <div className="panel-paper panel-grain flex flex-col gap-3 p-6" style={{ background: "var(--cream)" }}>
              <h3 className="font-display text-xl" style={{ color: INK }}>Virtual Host</h3>
              <ul className="font-hand flex flex-col gap-2 text-lg" style={{ color: "#4a4460" }}>
                <li>· Reads every question and prompt out loud</li>
                <li>· Reacts to buzzes, correct answers, and results</li>
                <li>· Advances rounds automatically</li>
                <li>· You can play on your phone like everyone else</li>
                <li>· Free during beta ({LIMITS.free.aiHostGamesPerMonth} games/month on Free)</li>
              </ul>
              <Link
                href="/virtual-host"
                className="font-score self-start text-[10px] uppercase tracking-[0.25em] underline"
                style={{ color: INK }}
              >
                Learn more →
              </Link>
            </div>
          </div>
        </section>

        {/* Device notes */}
        <section aria-labelledby="devices-heading" className="mt-14">
          <h2
            id="devices-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Devices and Browsers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Main screen (host display)",
                items: ["Any laptop or desktop browser", "Smart TV browser", "iPad on a stand", "Laptop connected to a TV", "Projector connected to any computer"],
              },
              {
                label: "Players' phones",
                items: ["iPhone, Safari or Chrome", "Android, Chrome or Firefox", "iPad or Android tablet", "Any device with a modern browser", "No app installation needed"],
              },
            ].map(({ label, items }) => (
              <div
                key={label}
                className="panel-paper panel-grain p-5"
                style={{ background: "var(--cream)" }}
              >
                <h3 className="font-display mb-3 text-lg" style={{ color: INK }}>{label}</h3>
                <ul className="font-hand flex flex-col gap-1.5 text-lg" style={{ color: "#4a4460" }}>
                  {items.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Remote play */}
        <section aria-labelledby="remote-heading" className="mt-14">
          <h2
            id="remote-heading"
            className="font-display mb-4 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Playing Remotely
          </h2>
          <div className="panel-paper panel-grain p-6" style={{ background: "var(--cream)" }}>
            <div className="flex items-start gap-4">
              <Mascot avatarId="detective" size={56} animate={false} />
              <div>
                <p className="font-hand text-xl leading-snug" style={{ color: "#4a4460" }}>
                  ScreenParty works over video call. Share the main game screen as a window in your video call (Zoom, Meet, FaceTime, Discord). Everyone joins the game from their phone. The Virtual Host keeps the game running while you focus on the call.
                </p>
                <p className="font-hand mt-3 text-xl leading-snug" style={{ color: "#4a4460" }}>
                  Tip: for Fact Frenzy and Virtual Host sessions, mute yourself in the video call so the game audio comes through clearly to everyone sharing screen audio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-14">
          <h2
            id="faq-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Common Questions
          </h2>
          <PublicFAQ items={HOW_FAQS} />
        </section>

        {/* CTA */}
        <div className="mb-20 mt-12 text-center">
          <DoodleStar size={30} className="mx-auto mb-4" />
          <div className="inline-flex flex-col items-center gap-4">
            <p className="font-display text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
              Ready to run your first game?
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="btn-rough px-8 py-3 text-xl"
                style={{ background: "var(--mustard)", color: INK }}
              >
                Host Free
              </Link>
              <Link
                href="/games"
                className="font-score rounded-md border-2 border-current px-6 py-3 text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--cream)" }}
              >
                Browse Games
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
