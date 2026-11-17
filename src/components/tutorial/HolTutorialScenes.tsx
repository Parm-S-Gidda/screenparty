"use client";

// Higher or Lower tutorial: a scripted round drawn with the real HOL screens.

import { HOL_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

// rows from the hol_items seed
const PIANO = { label: "Keys on a standard piano", value: 88, unit: "keys", category: "count" };
const BONES = { label: "Bones in an adult human body", value: 206, unit: "bones", category: "count" };
const COUNTRIES = { label: "Countries in the world", value: 195, unit: "countries", category: "count" };
type Item = typeof PIANO;

function round(left: Item, right: Item, leftKnown: boolean): PublicPayload["holRound"] {
  return {
    leftLabel: left.label, leftUnit: left.unit, leftCategory: left.category, leftValue: leftKnown ? left.value : null,
    rightLabel: right.label, rightUnit: right.unit, rightCategory: right.category, openedAt: new Date().toISOString(),
  };
}

// three say higher, Marcus goes rogue; the majority is right
const VOTES = [
  { playerId: "sam", vote: "higher" as const },
  { playerId: "priya", vote: "higher" as const },
  { playerId: "marcus", vote: "lower" as const },
  { playerId: "jules", vote: "higher" as const },
];
const WINNERS = VOTES.filter((v) => v.vote === "higher").map((v) => v.playerId);
const SCORES = Object.fromEntries(WINNERS.map((id) => [id, HOL_POINTS.correctVoter]));

export function HolTutorialScene({ scene, hostMode }: SceneProps) {
  const base = { gameType: "hol" as const, hostMode };
  const owner = hostMode === "self";
  const first = { holRound: round(PIANO, BONES, false) };
  switch (scene) {
    case "welcome":
      return <TitleCard top="Higher" bottom="or Lower" />;
    case "items":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "HOL_VOTING", payload: first, progress: { hol: { submittedVoterIds: [] } } })} />;
    case "vote": {
      const s = demoState({ ...base, state: "HOL_VOTING", payload: first, progress: { hol: { submittedVoterIds: [] } } });
      return (
        <PhoneRow>
          {["priya", "marcus"].map((id, i) => <DemoPhone key={id} state={s} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    }
    case "reveal":
      return (
        <DemoScreen
          owner={owner}
          state={demoState({
            ...base,
            state: "HOL_REVEAL",
            scores: SCORES,
            payload: {
              ...first,
              holReveal: { leftValue: PIANO.value, rightValue: BONES.value, correctAnswer: "higher", majority: "higher", votes: VOTES, correctVoterIds: WINNERS, voterPoints: HOL_POINTS.correctVoter },
            },
          })}
        />
      );
    case "chain":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "HOL_VOTING", questionIndex: 1, payload: { holRound: round(BONES, COUNTRIES, true) }, progress: { hol: { submittedVoterIds: [] } } })} />;
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores: SCORES })} />
      ) : (
        <Finale line="Ten rounds." punch="Most points wins." />
      );
    default:
      return null;
  }
}
