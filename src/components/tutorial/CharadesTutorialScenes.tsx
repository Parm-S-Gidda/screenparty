"use client";

// Charades tutorial: Jules acts, drawn with the real Charades screens.

import { CHARADES_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

const WORD = "penguin";
const round: PublicPayload["charadesRound"] = { actorId: "jules", category: "animals", actStart: new Date().toISOString(), actSeconds: 60 };

export function CharadesTutorialScene({ scene, hostMode }: SceneProps) {
  const base = { gameType: "charades" as const, hostMode, currentPlayerId: "jules" };
  const owner = hostMode === "self";
  const acting = demoState({ ...base, state: "CHARADES_ACTING", payload: { charadesRound: round } });
  switch (scene) {
    case "welcome":
      return <TitleCard top="Charades" bottom="No talking" />;
    case "actor":
      return <DemoPhone state={acting} playerId="jules" me={{ charadesWord: WORD }} />;
    case "acting":
      return <DemoScreen owner={owner} state={acting} />;
    case "guess":
      return (
        <PhoneRow>
          {["sam", "priya"].map((id, i) => <DemoPhone key={id} state={acting} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    case "reveal":
      return (
        <DemoScreen
          owner={owner}
          state={demoState({
            ...base,
            state: "REVEAL",
            scores: { priya: CHARADES_POINTS.correctGuesser, jules: CHARADES_POINTS.actor },
            payload: { charadesReveal: { actorId: "jules", word: WORD, winnerId: "priya", guesserPoints: CHARADES_POINTS.correctGuesser, actorPoints: CHARADES_POINTS.actor } },
          })}
        />
      );
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores: { priya: CHARADES_POINTS.correctGuesser, jules: CHARADES_POINTS.actor } })} />
      ) : (
        <Finale line="Everyone acts once." punch="Most points wins." />
      );
    default:
      return null;
  }
}
