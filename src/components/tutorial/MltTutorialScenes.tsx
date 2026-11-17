"use client";

// Most Likely To tutorial: a scripted round drawn with the real MLT screens.

import { MLT_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

const round = { promptText: "cry at a movie", openedAt: new Date().toISOString() };
// three votes for Priya: a clear winner
const VOTES = [
  { voterId: "sam", targetId: "priya" },
  { voterId: "priya", targetId: "marcus" },
  { voterId: "marcus", targetId: "priya" },
  { voterId: "jules", targetId: "priya" },
];
// two and two: a tie, nobody scores
const TIE_VOTES = [
  { voterId: "sam", targetId: "marcus" },
  { voterId: "priya", targetId: "marcus" },
  { voterId: "marcus", targetId: "priya" },
  { voterId: "jules", targetId: "priya" },
];

function reveal(votes: typeof VOTES, top: string[]): PublicPayload {
  const tie = top.length !== 1;
  return {
    mltRound: round,
    mltReveal: {
      votes,
      topPlayerIds: top,
      winnerVoterIds: tie ? [] : votes.filter((v) => v.targetId === top[0]).map((v) => v.voterId),
      voterPoints: MLT_POINTS.correctVoter,
      topPlayerPoints: MLT_POINTS.topPlayer,
    },
  };
}

export function MltTutorialScene({ scene, hostMode }: SceneProps) {
  const base = { gameType: "mlt" as const, hostMode };
  const owner = hostMode === "self";
  switch (scene) {
    case "welcome":
      return <TitleCard top="Most Likely" bottom="To" />;
    case "prompt":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "MLT_VOTING", payload: { mltRound: round }, progress: { mlt: { submittedVoterIds: ["sam"] } } })} />;
    case "vote": {
      const s = demoState({ ...base, state: "MLT_VOTING", payload: { mltRound: round }, progress: { mlt: { submittedVoterIds: [] } } });
      return (
        <PhoneRow>
          {["sam", "jules"].map((id, i) => <DemoPhone key={id} state={s} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    }
    case "reveal":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "REVEAL", payload: reveal(VOTES, ["priya"]), scores: { sam: 100, marcus: 100, jules: 100, priya: 50 } })} />;
    case "tie":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "REVEAL", payload: reveal(TIE_VOTES, ["marcus", "priya"]) })} />;
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores: { sam: 100, marcus: 100, jules: 100, priya: 50 } })} />
      ) : (
        <Finale line="Most points wins." punch="No hard feelings. Probably." />
      );
    default:
      return null;
  }
}
