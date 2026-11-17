import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { ClosingCta, PageHeader, SectionHeading, TextLink } from "@/components/public/PageParts";

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

  const steps = [
    {
      title: "Make a free host account",
      body: "Sign up in under a minute. No credit card. Players never need an account.",
      link: { label: "Sign up free", href: "/signup" },
    },
    {
      title: "Pick a game and open a room",
      body: `Choose from ${AVAILABLE_GAMES.length} games, set the rounds, and pick who hosts: you or the Virtual Host. You get a four-letter room code.`,
      link: { label: "Browse games", href: "/games" },
    },
    {
      title: "Put the room on the big screen",
      body: "Open it on a TV, laptop, monitor or projector. The room code goes up in lights for everyone to see.",
    },
    {
      title: "Everyone joins from their phone",
      body: "Players go to screenparty.gg/join, type the code and pick a character. They pop into the lobby on the big screen.",
      link: { label: "See the join page", href: "/join" },
    },
    {
      title: "Press start",
      body: "Run each round yourself, or let the Virtual Host read the questions, call the results and keep the pace while you play too.",
    },
  ];

  const modes = [
    {
      name: "You host",
      plan: "Every plan",
      points: [
        "You advance each round with a button",
        "Questions appear on screen in silence",
        "Add your own commentary and jokes",
        "Full control of the pace",
      ],
    },
    {
      name: "Virtual Host",
      plan: `Free in beta · ${LIMITS.free.aiHostGamesPerMonth} games a month on Free`,
      points: [
        "Reads every question and prompt out loud",
        "Reacts to buzzes, answers and results",
        "Moves to the next round on its own",
        "You play on your phone like everyone else",
      ],
      link: { label: "Meet the Virtual Host", href: "/virtual-host" },
    },
  ];

  const devices = [
    {
      label: "The big screen",
      items: ["Any laptop or desktop browser", "A smart TV browser", "A laptop plugged into a TV", "A projector on any computer", "An iPad on a stand"],
    },
    {
      label: "The controllers",
      items: ["iPhone with Safari or Chrome", "Android with Chrome or Firefox", "Any tablet", "Anything with a modern browser", "Nothing to install"],
    },
  ];

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "How It Works", href: "/how-it-works" },
        ]}
        title={
          <>
            One screen, <span style={{ color: "var(--mustard)" }}>everyone&apos;s phone</span>
          </>
        }
        sub="The game goes on the TV. Phones become the controllers. No app, no console, no accounts for players."
        actions={
          <>
            <Link href="/signup" className="btn-rough px-7 py-3 text-xl">
              Host a free game
            </Link>
            <TextLink href="/games">Browse games</TextLink>
          </>
        }
      />

      {/* the sequence matters here, so the numbers stay */}
      <section aria-labelledby="steps-heading" className="mx-auto w-full max-w-3xl px-6 pb-16 md:pb-24">
        <SectionHeading id="steps-heading" sub="From “what should we play?” to the first question in about two minutes.">
          Getting started
        </SectionHeading>
        <RevealList as="ol" className="relative flex flex-col gap-5">
          {steps.map((step, i) => (
            <RevealItem as="li" key={step.title} className="panel-paper panel-grain flex gap-5 p-5 md:p-6">
              <span
                aria-hidden
                className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 pt-1 text-2xl"
                style={{ borderColor: "var(--ink)", background: i === 0 ? "var(--mustard)" : "var(--paper)", color: "var(--ink)" }}
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-xl leading-tight" style={{ color: "var(--ink)" }}>
                  {step.title}
                </h3>
                <p className="font-hand max-w-[56ch] text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                  {step.body}
                </p>
                {step.link && (
                  <span className="-mb-2">
                    <TextLink href={step.link.href} onPaper>
                      {step.link.label} →
                    </TextLink>
                  </span>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealList>
      </section>

      {/* curtain band: who runs the show */}
      <section aria-labelledby="modes-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading id="modes-heading" sub="Every game works both ways.">
            Who runs the show?
          </SectionHeading>
          <div className="panel panel-grain grid md:grid-cols-2">
            {modes.map((mode) => (
              <div
                key={mode.name}
                className="flex flex-col gap-4 border-dashed p-6 md:p-8 max-md:[&:not(:first-child)]:border-t-[3px] md:[&:not(:first-child)]:border-l-[3px]"
              >
                <div>
                  <h3 className="font-display text-2xl" style={{ color: "var(--ink)" }}>
                    {mode.name}
                  </h3>
                  <p className="font-score mt-1 text-xs uppercase tracking-[0.16em]" style={{ color: "var(--ink-label)" }}>
                    {mode.plan}
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {mode.points.map((pt) => (
                    <li key={pt} className="font-hand flex items-start gap-2.5 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                      <svg aria-hidden viewBox="0 0 16 16" className="mt-1.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                      </svg>
                      {pt}
                    </li>
                  ))}
                </ul>
                {mode.link && (
                  <span className="mt-auto">
                    <TextLink href={mode.link.href} onPaper>
                      {mode.link.label} →
                    </TextLink>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="devices-heading" className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <SectionHeading id="devices-heading">Works on what you already have</SectionHeading>
        <div className="grid gap-10 md:grid-cols-3">
          {devices.map((d) => (
            <div key={d.label} className="flex flex-col gap-3 border-t-4 border-dashed pt-4" style={{ borderColor: "rgba(245,236,212,0.3)" }}>
              <h3 className="font-display text-xl" style={{ color: "var(--cream)" }}>
                {d.label}
              </h3>
              <ul className="font-hand flex flex-col gap-1.5 text-lg" style={{ color: "var(--cream-muted)" }}>
                {d.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-3 border-t-4 border-dashed pt-4" style={{ borderColor: "rgba(245,236,212,0.3)" }}>
            <h3 className="font-display text-xl" style={{ color: "var(--cream)" }}>
              Playing remotely
            </h3>
            <p className="font-hand text-lg leading-snug" style={{ color: "var(--cream-muted)" }}>
              Share the big screen on Zoom, Meet, FaceTime or Discord. Everyone joins from their own phone, wherever they are.
            </p>
            <p className="font-hand text-lg leading-snug" style={{ color: "var(--cream-muted)" }}>
              <span style={{ color: "var(--cream)" }}>Tip:</span> mute yourself on the call during Fact Frenzy and Virtual Host games so the game audio comes through clearly.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-6 pb-16 md:pb-24">
        <SectionHeading id="faq-heading">Common questions</SectionHeading>
        <PublicFAQ items={HOW_FAQS} />
      </section>

      <ClosingCta
        title="Ready to run your first game?"
        body="Set up a room in under a minute. Your friends just need their phones."
        cta={{ href: "/signup", label: "Host a free game" }}
        link={{ href: "/games", label: "Browse games" }}
      />
    </div>
  );
}
