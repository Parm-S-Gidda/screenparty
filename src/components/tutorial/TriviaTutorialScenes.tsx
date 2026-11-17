"use client";

// Fact Frenzy tutorial: one question played out with the real trivia screens.
// Teams split the cast red/blue; self mode makes Marcus the player-host.

import { ATTEMPT_POINTS } from "@/lib/constants";
import { HostController } from "@/components/screens/HostController";
import type { PublicPayload } from "@/lib/game/types";
import { CAST, DemoPhone, DemoScreen, Finale, Phone, PhoneRow, TitleCard, demoState, type SceneProps } from "./demo";

const Q = { index: 0, text: "What is the largest planet in our solar system?", difficulty: "easy" };
const ANSWER = "Jupiter";
const TEAMS = { sam: "red", priya: "red", marcus: "blue", jules: "blue" } as const;
const at = new Date().toISOString();

export function TriviaTutorialScene({ scene, hostMode, settings }: SceneProps) {
  const teams = !!settings.teamsEnabled;
  const self = hostMode === "self";
  // the self-mode player-host runs the show instead of playing
  const cast = (self ? CAST.filter((p) => p.id !== "marcus") : CAST).map((p) => (teams ? { ...p, team: TEAMS[p.id as keyof typeof TEAMS] } : p));
  const players = self ? [...cast, { ...CAST[2], isHost: true }] : cast;
  const base = { gameType: "buzz_trivia" as const, hostMode, players, settings };
  const buzzed = (playerId: string, buzzOrder: number, attempt: number, extra: PublicPayload = {}) =>
    demoState({ ...base, state: "PLAYER_BUZZED", currentPlayerId: playerId, payload: { question: Q, buzz: { playerId, buzzOrder, attempt, answerOpen: true }, ...extra } });

  // Sam buzzed first and missed (buzz line: Sam, Priya, Jules)
  const missFirst = { playerId: "sam", correct: false, points: 0, at };

  switch (scene) {
    case "welcome":
      return <TitleCard top="Fact" bottom="Frenzy" members={cast} />;
    case "question":
      return <DemoScreen state={demoState({ ...base, state: "BUZZ_OPEN", payload: { question: Q, buzzOpenedAt: at } })} />;
    case "buzz":
      return <DemoScreen state={buzzed("priya", 1, 1)} />;
    case "answer": {
      const s = buzzed("priya", 1, 1);
      if (!self) {
        return (
          <PhoneRow>
            <DemoPhone state={s} playerId="priya" tilt={-3} />
            <DemoPhone state={s} playerId="jules" me={{ buzzOrder: 2 }} tilt={3} delay={0.12} />
          </PhoneRow>
        );
      }
      return (
        <PhoneRow>
          <DemoPhone state={s} playerId="priya" tilt={-3} />
          <HostPhone state={s} />
        </PhoneRow>
      );
    }
    case "points":
      return (
        <DemoScreen
          state={demoState({ ...base, state: "SHOW_ANSWER", scores: { priya: ATTEMPT_POINTS[0] }, payload: { question: Q, answer: { text: ANSWER }, lastResult: { playerId: "priya", correct: true, points: ATTEMPT_POINTS[0], at } } })}
        />
      );
    case "retries":
      // free-for-all: next in line, Priya
      return <DemoScreen state={buzzed("priya", 2, 2, { lastResult: missFirst })} />;
    case "steal":
      // Sam (red) missed; the steal skips red teammate Priya for blue Jules
      return <DemoScreen state={buzzed("jules", 3, 2, { lastResult: missFirst })} />;
    case "teams":
      return <DemoScreen state={demoState({ ...base, state: "SCOREBOARD", scores: { priya: 100, jules: 75 } })} />;
    case "timesup":
      return <DemoScreen state={demoState({ ...base, state: "SHOW_ANSWER", payload: { question: Q, answer: { text: ANSWER }, skipped: true } })} />;
    case "finale":
      if (self) return <HostPhone state={demoState({ ...base, state: "QUESTION_PREVIEW", questionIndex: 1 })} />;
      return <Finale line="Most points wins." punch="Look smart." members={cast} />;
    default:
      return null;
  }
}

/** The self-mode player-host's phone: the real host controller, with the answer in view. */
function HostPhone({ state }: { state: ReturnType<typeof demoState> }) {
  return (
    <Phone owner={CAST[2]} className="w-[15.5rem]">
      <div inert className="pointer-events-none w-[340px] px-4 py-6" style={{ zoom: 0.72 }}>
        <HostController code="DEMO" state={state} demoPreview={{ index: Q.index, text: Q.text, answer: ANSWER }} />
      </div>
    </Phone>
  );
}
