"use client";

// Would You Rather tutorial: a scripted round drawn with the real WYR screens.
// With teams on, the same cast splits into red and blue.

import { WYR_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { CAST, DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

// a row from the wyr_questions seed
const round = { optionA: "Always be 10 minutes late", optionB: "Always be 30 minutes early", openedAt: new Date().toISOString() };
const TEAMS = { sam: "red", priya: "red", marcus: "blue", jules: "blue" } as const;
// Sam alone is always late; everyone else is painfully early
const CHOICES = [
  { playerId: "sam", choice: "a" as const },
  { playerId: "priya", choice: "b" as const },
  { playerId: "marcus", choice: "b" as const },
  { playerId: "jules", choice: "b" as const },
];

export function WyrTutorialScene({ scene, hostMode, settings }: SceneProps) {
  const teams = !!settings.teamsEnabled;
  const players = teams ? CAST.map((p) => ({ ...p, team: TEAMS[p.id as keyof typeof TEAMS] })) : CAST;
  const base = { gameType: "wyr" as const, hostMode, players, settings };
  const owner = hostMode === "self";
  // free-for-all: everyone but Marcus called the majority. Teams: red is split
  // 1-1, blue's majority is B, so only red's B predictors score.
  const correct = teams ? ["sam", "priya"] : ["sam", "priya", "jules"];
  const scores = Object.fromEntries(correct.map((id) => [id, WYR_POINTS.correctPrediction]));
  const reveal: PublicPayload["wyrReveal"] = {
    countA: 1, countB: 3, majority: "b", choices: CHOICES, correctPredictorIds: correct, predictorPoints: WYR_POINTS.correctPrediction,
    teamMajorities: teams ? { red: "tie", blue: "b" } : undefined,
  };
  switch (scene) {
    case "welcome":
      return <TitleCard top="Would You" bottom="Rather" members={players} />;
    case "dilemma":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "WYR_CHOOSING", payload: { wyrRound: round }, progress: { wyr: { submittedPlayerIds: ["jules"] } } })} />;
    case "pick":
    case "teams": {
      const s = demoState({ ...base, state: "WYR_CHOOSING", payload: { wyrRound: round }, progress: { wyr: { submittedPlayerIds: [] } } });
      const ids = scene === "teams" ? ["priya", "marcus"] : ["sam", "jules"];
      return (
        <PhoneRow>
          {ids.map((id, i) => <DemoPhone key={id} state={s} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    }
    case "reveal":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "REVEAL", scores, payload: { wyrRound: round, wyrReveal: reveal } })} />;
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores })} />
      ) : (
        <Finale line="Most points wins." punch="Read the room." members={players} />
      );
    default:
      return null;
  }
}
