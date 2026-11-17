"use client";

// Guess the Player tutorial: a scripted round drawn with the real GTP screens.

import { GTP_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

const PROMPT = "What's a weird food combination you actually love?";
const ANSWER = "Pickles dipped in peanut butter"; // Sam wrote it
const round = (answerIndex: number): PublicPayload["gtpRound"] => ({
  promptText: PROMPT, mode: "prompt", answerIndex, totalAnswers: answerIndex < 0 ? 0 : 4, openedAt: new Date().toISOString(),
});
// Marcus sees through Sam; Priya and Jules blame Marcus
const GUESSES = [
  { guesserId: "priya", guessedId: "marcus" },
  { guesserId: "marcus", guessedId: "sam" },
  { guesserId: "jules", guessedId: "marcus" },
];
const CORRECT = GUESSES.filter((g) => g.guessedId === "sam").map((g) => g.guesserId);
const SCORES = { marcus: GTP_POINTS.correctGuess, sam: (GUESSES.length - CORRECT.length) * GTP_POINTS.perFooled };

export function GtpTutorialScene({ scene, hostMode }: SceneProps) {
  const base = { gameType: "gtp" as const, hostMode };
  const owner = hostMode === "self";
  switch (scene) {
    case "welcome":
      return <TitleCard top="Guess the" bottom="Player" />;
    case "prompt":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "GTP_ANSWERING", payload: { gtpRound: round(-1) }, progress: { gtp: { submittedPlayerIds: ["jules"], guessesIn: 0, guessersNeeded: 0 } } })} />;
    case "answer": {
      const s = demoState({ ...base, state: "GTP_ANSWERING", payload: { gtpRound: round(-1) }, progress: { gtp: { submittedPlayerIds: [], guessesIn: 0, guessersNeeded: 0 } } });
      return (
        <PhoneRow>
          {["sam", "priya"].map((id, i) => <DemoPhone key={id} state={s} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    }
    case "guess":
      return (
        <DemoScreen
          owner={owner}
          state={demoState({
            ...base,
            state: "GTP_GUESSING",
            payload: { gtpRound: round(0), gtpGuessing: { answerText: ANSWER, openedAt: new Date().toISOString() } },
            progress: { gtp: { submittedPlayerIds: [], guessesIn: 2, guessersNeeded: 3 } },
          })}
        />
      );
    case "reveal":
      return (
        <DemoScreen
          owner={owner}
          state={demoState({
            ...base,
            state: "REVEAL",
            scores: SCORES,
            payload: {
              gtpRound: round(0),
              gtpReveal: { answerPlayerId: "sam", answerText: ANSWER, guesses: GUESSES, correctGuesserIds: CORRECT, guesserPoints: GTP_POINTS.correctGuess, writerPoints: GTP_POINTS.perFooled },
            },
          })}
        />
      );
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores: SCORES })} />
      ) : (
        <Finale line="Most points wins." punch="Trust no one." crown={0} />
      );
    default:
      return null;
  }
}
