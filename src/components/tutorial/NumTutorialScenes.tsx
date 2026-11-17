"use client";

// Live demo for the Number Crunch tutorial: a scripted fake round drawn with
// the same props the real game uses (NumScale, RevealRow, mascots, stamps).

import { motion } from "framer-motion";
import { Mascot } from "@/components/cartoon/Mascot";
import { Stamp } from "@/components/cartoon/Stamp";
import { NumScale, RevealRow } from "@/components/screens/NumViews";
import type { TutorialHostMode } from "@/lib/tutorials";

const THEME = { theme: "Spicy foods", low: "basically milk", high: "call an ambulance" };
const GUESSER = { avatarId: "detective", username: "Sam" };
// each writer's secret number, what they wrote, and what Sam guessed
const CAST = [
  { avatarId: "chef", username: "Priya", number: 2, example: "Ketchup", guess: 2 },
  { avatarId: "pirate", username: "Marcus", number: 9, example: "Ghost pepper", guess: 5 },
  { avatarId: "wizard", username: "Jules", number: 10, example: "The surface of the sun", guess: 10 },
];
const points = (diff: number) => (diff === 0 ? 200 : diff <= 1 ? 100 : diff <= 2 ? 50 : 0);
// same formula as revealRound in src/lib/game/num.ts
const GUESSER_BONUS = Math.round(100 * Math.max(0, 1 - CAST.reduce((s, c) => s + Math.abs(c.number - c.guess), 0) / CAST.length / 9));

const pop = { type: "spring", stiffness: 420, damping: 26 } as const;
const cheer = { type: "spring", stiffness: 600, damping: 18 } as const;

export function NumTutorialScene({ scene, hostMode }: { scene: string; hostMode: TutorialHostMode }) {
  switch (scene) {
    case "welcome":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          <h2 className="font-display text-[clamp(3.5rem,9vw,6.5rem)] uppercase leading-[0.9]" style={{ color: "var(--mustard)" }}>
            Number
            <span className="block" style={{ color: "var(--cream)" }}>Crunch</span>
          </h2>
          <Cast members={[GUESSER, ...CAST]} />
        </div>
      );

    case "theme":
      return <NumScale theme={THEME.theme} low={`1 = ${THEME.low}`} high={`10 = ${THEME.high}`} />;

    case "guesser":
      return (
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <Mascot avatarId={GUESSER.avatarId} size={130} expression="buzzed" />
            <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...cheer, delay: 0.25 }}>
              <Stamp color="mustard" size="lg">The guesser</Stamp>
            </motion.div>
          </div>
          <NumScale theme={THEME.theme} low="1 = ?" high="10 = ?" size="md" markers={[{ n: 5, label: "no numbers for you", tone: "ink" }]} />
        </div>
      );

    case "numbers":
      return (
        <div className="flex flex-wrap items-end justify-center gap-6">
          {CAST.map((c, i) => (
            <motion.div key={c.username} initial={{ y: 60, opacity: 0, rotate: 0 }} animate={{ y: 0, opacity: 1, rotate: i === 1 ? 0 : i ? 3 : -3 }} transition={{ ...pop, delay: i * 0.12 }}>
              <Phone owner={c}>
                <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>secret number</span>
                <span className="font-display text-7xl leading-none tabular-nums" style={{ color: "var(--mustard)" }}>{c.number}</span>
                <span className="font-hand text-base" style={{ color: "var(--cream-muted)" }}>shh</span>
              </Phone>
            </motion.div>
          ))}
        </div>
      );

    case "examples":
      return (
        <div className="flex flex-wrap items-end justify-center gap-6">
          {CAST.map((c, i) => (
            <motion.div key={c.username} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: i === 1 ? 0 : i ? 3 : -3 }} transition={{ ...pop, delay: i * 0.12 }}>
              <Phone owner={c}>
                <span className="font-display text-3xl leading-none tabular-nums" style={{ color: "var(--mustard)" }}>{c.number}</span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...pop, delay: 0.6 + i * 0.5 }}
                  className="font-hand w-full rounded-lg border-[3px] px-2 py-2 text-center text-lg leading-tight"
                  style={{ borderColor: "var(--ink)", background: "var(--card-white)", color: "var(--ink)" }}
                >
                  {c.example}
                </motion.span>
              </Phone>
            </motion.div>
          ))}
        </div>
      );

    case "guessing":
      return (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Mascot avatarId={GUESSER.avatarId} size={64} animate={false} />
            <p className="font-hand text-2xl" style={{ color: "var(--cream)" }}>Sam places each one, no names attached…</p>
          </div>
          <SlidingScale />
        </div>
      );

    case "reveal":
      return (
        <div className="flex w-full max-w-4xl flex-col gap-3">
          {CAST.map((c, i) => (
            <RevealRow key={c.username} index={i} ex={{ exampleText: c.example, actualNumber: c.number, guessedNumber: c.guess, points: points(Math.abs(c.number - c.guess)) }} author={c} />
          ))}
        </div>
      );

    case "guesserScore":
      return (
        <div className="flex flex-col items-center gap-6">
          <Mascot avatarId={GUESSER.avatarId} size={140} expression="correct" />
          <Stamp color="green" size="xl">+{GUESSER_BONUS} accuracy</Stamp>
          <p className="font-hand text-2xl" style={{ color: "var(--cream-muted)" }}>Two bullseyes, one ghost pepper incident.</p>
        </div>
      );

    case "finale":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          <Cast members={[...CAST, GUESSER]} crown={hostMode === "virtual" ? 2 : undefined} />
          <p className="font-display text-4xl uppercase leading-tight md:text-5xl" style={{ color: "var(--cream)" }}>
            Everyone guesses once.
            <span className="block" style={{ color: "var(--mustard)" }}>Most points wins.</span>
          </p>
          {hostMode === "self" && (
            // a picture of the real control, not a working button
            <span aria-hidden className="btn-rough pointer-events-none px-10 py-3 text-2xl">
              Next round
            </span>
          )}
        </div>
      );

    default:
      return null;
  }
}

function Cast({ members, crown }: { members: { avatarId: string; username: string }[]; crown?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      {members.map((m, i) => (
        <motion.div key={m.username} initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ ...pop, delay: i * 0.06 }} className="flex flex-col items-center gap-2">
          <Mascot avatarId={m.avatarId} size={88} expression={crown === i ? "winner" : "idle"} animate={i === 0} />
          <span className="nameplate font-display px-3 py-0.5 text-lg">{m.username}</span>
        </motion.div>
      ))}
    </div>
  );
}

/** A phone controller, drawn: ink body, the owner's mascot on top. */
function Phone({ owner, children }: { owner: { avatarId: string; username: string }; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Mascot avatarId={owner.avatarId} size={56} animate={false} />
      <div
        className="flex h-60 w-40 flex-col items-center justify-center gap-2 rounded-[1.6rem] border-[5px] px-3"
        style={{ borderColor: "var(--ink)", background: "var(--ink-soft)", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)" }}
      >
        {children}
      </div>
      <span className="font-hand text-lg" style={{ color: "var(--cream)" }}>{owner.username}</span>
    </div>
  );
}

/** Examples drop onto the ruler at the guesser's numbers, one after another. */
function SlidingScale() {
  return (
    <NumScale
      theme={THEME.theme}
      low={`1 = ${THEME.low}`}
      high={`10 = ${THEME.high}`}
      markers={CAST.map((c) => ({ n: c.guess, label: c.example === "The surface of the sun" ? "The sun" : c.example }))}
    />
  );
}
