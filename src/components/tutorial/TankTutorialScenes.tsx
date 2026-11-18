"use client";

// Shark Tank tutorial: Marcus pitches, drawn with the real Shark Tank screens.

import { TANK_POINTS } from "@/lib/constants";
import type { PublicPayload } from "@/lib/game/types";
import { DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

// a row from the tank_products seed
const PRODUCT = { productName: "SnoozeShield", tagline: "An AI alarm clock that locks your phone until you've actually gotten out of bed and walked to the kitchen." };
const round: PublicPayload["tankRound"] = { pitcherId: "marcus", ...PRODUCT, pitchStart: new Date().toISOString(), pitchSeconds: 60 };
const INVESTMENTS = [
  { investorId: "sam", invested: true },
  { investorId: "priya", invested: true },
  { investorId: "jules", invested: false },
];
const INVESTORS = INVESTMENTS.filter((i) => i.invested).length;

export function TankTutorialScene({ scene, hostMode }: SceneProps) {
  const base = { gameType: "tank" as const, hostMode, currentPlayerId: "marcus" };
  const owner = hostMode === "self";
  switch (scene) {
    case "welcome":
      return <TitleCard top="Shark" bottom="Tank" />;
    case "product":
      return <DemoScreen owner={owner} state={demoState({ ...base, state: "TANK_PITCHING", payload: { tankRound: round } })} />;
    case "pitch": {
      const s = demoState({ ...base, state: "TANK_PITCHING", payload: { tankRound: round } });
      return <DemoPhone state={s} playerId="marcus" />;
    }
    case "invest": {
      const s = demoState({ ...base, state: "TANK_INVESTING", payload: { tankRound: { ...round!, investStart: new Date().toISOString() } }, progress: { tank: { investmentsIn: 0, investorsNeeded: 3 } } });
      return (
        <PhoneRow>
          {["sam", "priya"].map((id, i) => <DemoPhone key={id} state={s} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    }
    case "reveal":
      return (
        <DemoScreen
          owner={owner}
          state={demoState({
            ...base,
            state: "REVEAL",
            scores: { marcus: INVESTORS * TANK_POINTS.perInvestor },
            payload: { tankReveal: { pitcherId: "marcus", ...PRODUCT, investments: INVESTMENTS, investorCount: INVESTORS, pitcherPoints: INVESTORS * TANK_POINTS.perInvestor } },
          })}
        />
      );
    case "finale":
      return owner ? (
        <DemoScreen owner state={demoState({ ...base, state: "SCOREBOARD", scores: { marcus: INVESTORS * TANK_POINTS.perInvestor } })} />
      ) : (
        <Finale line="Everyone pitches once." punch="Most points wins." crown={2} />
      );
    default:
      return null;
  }
}
