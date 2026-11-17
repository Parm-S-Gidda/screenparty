"use client";

// Two Truths and a Lie tutorial: Sam in the hot seat, drawn with the real
// TTAL screens. The two-lies variation flips which statement is the odd one.

import { TTAL_POINTS } from "@/lib/constants";
import { TtalHostControls } from "@/components/screens/TtalPlayerViews";
import type { PublicPayload } from "@/lib/game/types";
import { CAST, DemoPhone, DemoScreen, Finale, PhoneRow, TitleCard, demoState, fan, type SceneProps } from "./demo";

const STATEMENTS = [
  { id: "goose", text: "I've been chased by a goose. Twice." },
  { id: "show", text: "I was on a kids' cooking show." },
  { id: "europe", text: "I can name every country in Europe." },
];

export function TtalTutorialScene({ scene, hostMode, settings }: SceneProps) {
  const twoLies = settings.variation === "two_lies";
  const odd = twoLies ? "goose" : "show";
  // self mode always has a player-host; Marcus paces the rounds
  const players = hostMode === "self" ? CAST.map((p) => ({ ...p, isHost: p.id === "marcus" })) : CAST;
  const base = { gameType: "ttal" as const, hostMode, players, settings, currentPlayerId: "sam", questionCount: 12 };
  const round = { subjectId: "sam", statements: STATEMENTS, votingOpenedAt: new Date().toISOString() };
  // Priya and Jules spot it, Marcus is fooled
  const votes = [
    { voterId: "priya", statementId: odd },
    { voterId: "marcus", statementId: "europe" },
    { voterId: "jules", statementId: odd },
  ];
  const correct = votes.filter((v) => v.statementId === odd).map((v) => v.voterId);
  const fooled = votes.filter((v) => v.statementId !== odd).map((v) => v.voterId);
  const scores = { ...Object.fromEntries(correct.map((id) => [id, TTAL_POINTS.correctGuess])), sam: fooled.length * TTAL_POINTS.perFooled };
  const reveal: PublicPayload = {
    ttalRound: round,
    ttalReveal: { oddStatementId: odd, votes, correctVoterIds: correct, fooledVoterIds: fooled, subjectPoints: fooled.length * TTAL_POINTS.perFooled, guesserPoints: TTAL_POINTS.correctGuess },
  };
  const voting = demoState({ ...base, state: "VOTING", payload: { ttalRound: round }, progress: { ttal: { submittedPlayerIds: [], votesIn: 1, votersNeeded: 3 } } });

  switch (scene) {
    case "welcome":
      return twoLies ? <TitleCard top="Two Lies" bottom="and a Truth" /> : <TitleCard top="Two Truths" bottom="and a Lie" />;
    case "writing": {
      const s = demoState({ ...base, state: "COLLECTING", payload: { collectingOpenedAt: new Date().toISOString() }, progress: { ttal: { submittedPlayerIds: [], votesIn: 0, votersNeeded: 0 } } });
      return <DemoPhone state={s} playerId="priya" />;
    }
    case "hotseat":
      return <DemoScreen state={voting} />;
    case "voting":
      return (
        <PhoneRow>
          {["priya", "jules"].map((id, i) => <DemoPhone key={id} state={voting} playerId={id} tilt={fan(i, 2)} delay={i * 0.12} />)}
        </PhoneRow>
      );
    case "reveal":
      return <DemoScreen state={demoState({ ...base, state: "REVEAL", scores, payload: reveal })} />;
    case "rounds":
      return <DemoScreen state={demoState({ ...base, state: "SCOREBOARD", scores })} />;
    case "finale": {
      if (hostMode === "virtual") return <Finale line="Keep a straight face." punch="Most points wins." />;
      // scoreboard, not reveal: the phone holds REVEAL controls back for the 10s unveil
      const s = demoState({ ...base, state: "SCOREBOARD", scores });
      return <DemoPhone state={s} playerId="marcus" extra={<TtalHostControls code="DEMO" token="demo" state={s} />} />;
    }
    default:
      return null;
  }
}
