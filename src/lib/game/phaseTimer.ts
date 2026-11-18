import type { GameAction, RoomStateResponse } from "./types";

type Session = NonNullable<RoomStateResponse["session"]>;

export type PhaseTimer = {
  openedAt: string;
  seconds: number;
  // what the AI host sends when the clock runs out (null = something else enforces it)
  onExpire: GameAction | null;
};

// The one countdown rule for every game: the line timer on screen and the AI
// host's "time's up" both read this, so what players see is what happens.
// Self-hosted games only show the timers they already had; the AI host times
// every phase that waits on players, using the room's answer time.
export function phaseTimer(session: Session): PhaseTimer | null {
  const p = session.payload;
  const s = session.settings;
  const ai = session.hostMode === "virtual";
  const answer = s.autoSkipSeconds;
  const reveal: GameAction = { type: "REVEAL_ROUND" };
  const t = (openedAt: string | undefined, seconds: number | undefined, onExpire: GameAction | null) =>
    openedAt && seconds ? { openedAt, seconds, onExpire } : null;

  switch (session.state) {
    // the buzz window's skip is fired by the owner's screen in both modes
    case "BUZZ_OPEN":
      return s.autoSkip ? t(p.buzzOpenedAt, answer, null) : null;
    case "COLLECTING":
      return t(p.collectingOpenedAt, s.collectingSeconds, { type: "FORCE_COLLECT_DONE" });
    case "VOTING":
      return t(p.ttalRound?.votingOpenedAt, answer, reveal);
    case "MLT_VOTING":
      return t(p.mltRound?.openedAt, answer, reveal);
    case "TANK_PITCHING":
      return t(p.tankRound?.pitchStart, p.tankRound?.pitchSeconds, reveal);
    case "CHARADES_ACTING":
      return t(p.charadesRound?.actStart, p.charadesRound?.actSeconds, reveal);
  }
  if (!ai) return null;
  switch (session.state) {
    case "WYR_CHOOSING":
      return t(p.wyrRound?.openedAt, answer, reveal);
    case "HOL_VOTING":
      return t(p.holRound?.openedAt, answer, reveal);
    case "GTP_ANSWERING": // writing takes longer than tapping
      return t(p.gtpRound?.openedAt, answer * 2, reveal);
    case "GTP_GUESSING":
      return t(p.gtpGuessing?.openedAt, answer, reveal);
    case "TANK_INVESTING":
      return t(p.tankRound?.investStart, answer, reveal);
    case "NUM_SUBMITTING":
      return t(p.numRound?.openedAt, answer * 2, reveal);
    case "NUM_GUESSING":
      return t(p.numGuessing?.openedAt, answer * 2, reveal);
  }
  return null;
}
