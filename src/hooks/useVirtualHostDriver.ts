"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHostLine, sendAction } from "@/lib/gameClient";
import type { GameAction, RoomStateResponse } from "@/lib/game/types";
import type { HostMoment } from "@/lib/ai/hostLines";

// VirtualHostController (PRD §11): in AI-hosted games the room owner's main
// screen is the controller. It reacts to official state changes by speaking
// host lines (voice via ElevenLabs when configured, captions always) and then
// dispatching the next game action. The server still validates every action,
// so a stalled or refreshed screen just picks up where the state machine is.

type CueMoment =
  | HostMoment
  | {
      moment: HostMoment;
      statementId?: string;
      // silence (caption cleared) before this line, e.g. letting the reveal
      // animation finish before the host reacts to the outcome
      preDelayMs?: number;
    };

type Cue = {
  key: string;
  moments: CueMoment[];
  action?: GameAction;
  pauseMs?: number; // extra beat before the follow-up action (e.g. scoreboard)
};

function deriveCue(state: RoomStateResponse): Cue | null {
  const session = state.session;
  if (!session) return null;
  const payload = session.payload;
  const q = session.questionIndex;

  if (session.gameType === "ttal") return deriveTtalCue(state);
  if (session.gameType === "wyr") return deriveWyrCue(state);
  if (session.gameType === "mlt") return deriveMltCue(state);
  if (session.gameType === "hol") return deriveHolCue(state);
  if (session.gameType === "gtp") return deriveGtpCue(state);
  if (session.gameType === "tank") return deriveTankCue(state);
  if (session.gameType === "charades") return deriveCharadesCue(state);
  if (session.gameType === "num") return deriveNumCue(state);

  switch (session.state) {
    case "QUESTION_PREVIEW": {
      const moments: HostMoment[] = [];
      if (q === 0) moments.push("game_intro");
      moments.push(q + 1 === session.questionCount ? "final_question" : "question_intro");
      return { key: `preview:${q}`, moments, action: { type: "DISPLAY_QUESTION" } };
    }
    case "BUZZ_OPEN": {
      // reopened after a wrong answer with nobody left in the buzz queue
      if (payload.lastResult && !payload.lastResult.correct) {
        return { key: `wrong-reopen:${q}:${payload.lastResult.at}`, moments: ["answer_wrong"] };
      }
      // fresh question on screen: read it out loud (players can buzz mid-read)
      return { key: `read:${q}`, moments: ["read_question"] };
    }
    case "PLAYER_BUZZED": {
      const buzz = payload.buzz;
      if (!buzz) return null;
      // direct steal: call out the miss before handing the floor over (a fresh
      // buzz after a reopened window already had its answer_wrong moment)
      const directSteal =
        buzz.attempt > 1 &&
        payload.lastResult &&
        !payload.lastResult.correct &&
        (!payload.buzzOpenedAt || payload.buzzOpenedAt < payload.lastResult.at);
      const moments: HostMoment[] = directSteal
        ? ["answer_wrong", "retry_next_player"]
        : [buzz.attempt > 1 ? "retry_next_player" : "buzz_received"];
      // typing stays locked until the host finishes talking
      return {
        key: `buzz:${q}:${buzz.playerId}:${buzz.attempt}`,
        moments,
        action: { type: "OPEN_ANSWER" },
      };
    }
    case "SHOW_ANSWER": {
      const moments: HostMoment[] = [];
      if (payload.lastResult) {
        moments.push(payload.lastResult.correct ? "answer_correct" : "answer_wrong");
      } else if (payload.skipped) {
        moments.push("no_buzz_timeout");
      }
      // a correct answer already names the answer, only read the reveal when
      // it was wrong or nobody got it
      if (!payload.lastResult?.correct) moments.push("show_answer");
      return {
        key: `answer:${q}`,
        moments,
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 2500,
      };
    }
    case "SCOREBOARD":
      return {
        key: `scoreboard:${q}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_QUESTION" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return {
        key: "gameover",
        moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"],
      };
    }
    default:
      return null;
  }
}

// Majority Would You Rather cues: intro each dilemma, narrate the reveal.
function deriveWyrCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;

  switch (session.state) {
    case "WYR_CHOOSING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "wyr_question_intro"] : ["wyr_question_intro"];
      return { key: `wyr-q:${session.questionIndex}`, moments };
    }
    case "REVEAL":
      return {
        key: `wyr-reveal:${session.questionIndex}`,
        moments: ["wyr_reveal"],
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 4500,
      };
    case "SCOREBOARD":
      return {
        key: `wyr-scoreboard:${session.questionIndex}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return {
        key: "gameover",
        moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"],
      };
    }
    default:
      return null;
  }
}

// Two Truths and a Lie cues: the AI paces collection, rounds, and reveals.
// Votes auto-close server-side when everyone has voted; the driver only
// advances after reveals and scoreboards (and force-reveals on timeout below).
function deriveTtalCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;

  switch (session.state) {
    case "COLLECTING":
      // fires once per round: every cycle starts with a fresh COLLECTING phase
      return {
        key: `ttal-collect:${session.questionIndex}`,
        moments:
          session.questionIndex === 0
            ? ["game_intro", "ttal_collect_intro"]
            : ["ttal_collect_intro"],
      };
    case "VOTING": {
      const round = payload.ttalRound;
      if (!round) return null;
      // introduce the subject, then read their statements out loud in the
      // on-screen order so everyone can vote without squinting at the board.
      // Key includes the turn index: subjects repeat across rounds.
      return {
        key: `ttal-subject:${session.questionIndex}:${round.subjectId}`,
        moments: [
          "ttal_subject_intro",
          ...round.statements.map((s) => ({
            moment: "ttal_statement_read" as const,
            statementId: s.id,
          })),
        ],
      };
    }
    case "REVEAL":
      return {
        key: `ttal-reveal:${session.questionIndex}`,
        moments: [
          // tease as the unveil starts, then hold the reaction until the
          // staged animation (badges ~8s + payouts ~2.5s) has played out
          "ttal_reveal_intro",
          { moment: "ttal_reveal", preDelayMs: 8500 },
        ],
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 2500,
      };
    case "SCOREBOARD":
      return {
        key: `ttal-scoreboard:${session.questionIndex}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return {
        key: "gameover",
        moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"],
      };
    }
    default:
      return null;
  }
}

function deriveMltCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  switch (session.state) {
    case "MLT_VOTING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "mlt_round_intro"] : ["mlt_round_intro"];
      return { key: `mlt-voting:${session.questionIndex}`, moments };
    }
    case "REVEAL":
      return {
        key: `mlt-reveal:${session.questionIndex}`,
        moments: ["mlt_reveal"],
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 4000,
      };
    case "SCOREBOARD":
      return {
        key: `mlt-scoreboard:${session.questionIndex}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

function deriveHolCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  switch (session.state) {
    case "HOL_VOTING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "hol_round_intro"] : ["hol_round_intro"];
      return { key: `hol-voting:${session.questionIndex}`, moments };
    }
    case "HOL_REVEAL":
      return {
        key: `hol-reveal:${session.questionIndex}`,
        moments: ["hol_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 3500,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

function deriveGtpCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  const q = session.questionIndex;
  const answerIdx = payload.gtpRound?.answerIndex ?? 0;
  switch (session.state) {
    case "GTP_ANSWERING": {
      const moments: Cue["moments"] =
        q === 0 ? ["game_intro", "gtp_answering_intro"] : ["gtp_answering_intro"];
      return { key: `gtp-answering:${q}`, moments };
    }
    case "GTP_GUESSING":
      return {
        key: `gtp-guessing:${q}:${answerIdx}`,
        moments: ["gtp_guessing"],
      };
    case "REVEAL":
      return {
        key: `gtp-reveal:${q}:${answerIdx}`,
        moments: ["gtp_answer_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 3500,
      };
    case "SCOREBOARD":
      return {
        key: `gtp-scoreboard:${q}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

function deriveTankCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  switch (session.state) {
    case "TANK_PITCHING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "tank_pitch_intro"] : ["tank_pitch_intro"];
      return { key: `tank-pitching:${session.questionIndex}`, moments };
    }
    case "TANK_INVESTING":
      return {
        key: `tank-investing:${session.questionIndex}`,
        moments: ["tank_invest"],
      };
    case "REVEAL":
      return {
        key: `tank-reveal:${session.questionIndex}`,
        moments: ["tank_reveal"],
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 3500,
      };
    case "SCOREBOARD":
      return {
        key: `tank-scoreboard:${session.questionIndex}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

function deriveCharadesCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  switch (session.state) {
    case "CHARADES_ACTING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "charades_round_intro"] : ["charades_round_intro"];
      return { key: `charades-acting:${session.questionIndex}`, moments };
    }
    case "REVEAL":
      return {
        key: `charades-reveal:${session.questionIndex}`,
        moments: ["charades_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 3500,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

function deriveNumCue(state: RoomStateResponse): Cue | null {
  const session = state.session!;
  const payload = session.payload;
  switch (session.state) {
    case "NUM_SUBMITTING": {
      const moments: Cue["moments"] =
        session.questionIndex === 0 ? ["game_intro", "num_round_intro"] : ["num_round_intro"];
      return { key: `num-submitting:${session.questionIndex}`, moments };
    }
    case "NUM_GUESSING":
      return {
        key: `num-guessing:${session.questionIndex}`,
        moments: ["num_guessing"],
      };
    case "REVEAL":
      return {
        key: `num-reveal:${session.questionIndex}`,
        moments: ["num_reveal"],
        action: { type: "SHOW_SCOREBOARD" },
        pauseMs: 4000,
      };
    case "SCOREBOARD":
      return {
        key: `num-scoreboard:${session.questionIndex}`,
        moments: ["scoreboard_reveal"],
        action: { type: "NEXT_ROUND" },
        pauseMs: 4000,
      };
    case "GAME_OVER": {
      const winners = payload.podium?.find((e) => e.place === 1);
      return { key: "gameover", moments: [(winners?.playerIds.length ?? 1) > 1 ? "game_over_tie" : "game_over_winner"] };
    }
    default: return null;
  }
}

export function useVirtualHostDriver(code: string, state: RoomStateResponse | null, enabled: boolean) {
  const [caption, setCaption] = useState<string | null>(null);
  const runningRef = useRef(false);
  const doneKeys = useRef(new Set<string>());
  const skipRef = useRef<(() => void) | null>(null);
  const answerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playClip = useCallback((audioUrl: string | null, text: string) => {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        skipRef.current = null;
        resolve();
      };
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        skipRef.current = () => {
          audio.pause();
          finish();
        };
        audio.onended = finish;
        audio.onerror = finish;
        void audio.play().catch(() => {
          // autoplay blocked: fall back to caption-timed display
          const ms = Math.min(Math.max(text.length * 55, 1500), 6000);
          setTimeout(finish, ms);
        });
      } else {
        const ms = Math.min(Math.max(text.length * 55, 1500), 6000);
        const timer = setTimeout(finish, ms);
        skipRef.current = () => {
          clearTimeout(timer);
          finish();
        };
      }
    });
  }, []);

  useEffect(() => {
    if (!enabled || !state) return;
    const cue = deriveCue(state);
    if (!cue || runningRef.current || doneKeys.current.has(cue.key)) return;
    doneKeys.current.add(cue.key);
    runningRef.current = true;

    void (async () => {
      try {
        for (const item of cue.moments) {
          const moment = typeof item === "string" ? item : item.moment;
          const params =
            typeof item !== "string" && item.statementId
              ? { statementId: item.statementId }
              : undefined;
          const preDelayMs = typeof item === "string" ? 0 : (item.preDelayMs ?? 0);
          if (preDelayMs > 0) {
            setCaption(null);
            await new Promise((r) => setTimeout(r, preDelayMs));
          }
          try {
            const line = await fetchHostLine(code, moment, params);
            setCaption(line.text);
            await playClip(line.audioUrl, line.text);
          } catch {
            // a failed line must never stall the game
          }
        }
        if (cue.pauseMs) await new Promise((r) => setTimeout(r, cue.pauseMs));
        if (cue.action) {
          await sendAction(code, cue.action).catch(() => {});
        }
      } finally {
        setCaption(null);
        runningRef.current = false;
      }
    })();
  }, [enabled, state, code, playClip]);

  // Safety nets so an idle player can't stall the game: a buzzed player who
  // never answers gets skipped; a TTAL vote that never completes gets
  // force-revealed once at least one vote is in.
  useEffect(() => {
    if (answerTimeout.current) {
      clearTimeout(answerTimeout.current);
      answerTimeout.current = null;
    }
    if (!enabled || !state?.session) return;
    const session = state.session;
    const waitMs = (session.settings.autoSkipSeconds + 15) * 1000;

    if (session.gameType === "buzz_trivia" && session.state === "PLAYER_BUZZED") {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "SKIP_QUESTION" }).catch(() => {});
      }, waitMs);
    } else if (
      session.gameType === "ttal" &&
      session.state === "VOTING" &&
      (state.ttal?.votesIn ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, waitMs);
    } else if (
      session.gameType === "wyr" &&
      session.state === "WYR_CHOOSING" &&
      (state.wyr?.submittedPlayerIds.length ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, waitMs);
    } else if (
      session.gameType === "mlt" &&
      session.state === "MLT_VOTING" &&
      (state.mlt?.submittedVoterIds.length ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, 60_000);
    } else if (
      session.gameType === "hol" &&
      session.state === "HOL_VOTING" &&
      (state.hol?.submittedVoterIds.length ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, 40_000);
    } else if (
      session.gameType === "gtp" &&
      session.state === "GTP_GUESSING" &&
      (state.gtp?.guessesIn ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, 45_000);
    } else if (
      session.gameType === "tank" &&
      session.state === "TANK_INVESTING" &&
      (state.tank?.investmentsIn ?? 0) > 0
    ) {
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, 45_000);
    } else if (
      session.gameType === "charades" &&
      session.state === "CHARADES_ACTING"
    ) {
      // Auto-end after the acting timer plus a buffer
      const actSeconds = session.payload.charadesRound?.actSeconds ?? 60;
      answerTimeout.current = setTimeout(() => {
        void sendAction(code, { type: "REVEAL_ROUND" }).catch(() => {});
      }, (actSeconds + 8) * 1000);
    }
    return () => {
      if (answerTimeout.current) clearTimeout(answerTimeout.current);
    };
  }, [enabled, code, state]);

  const skip = useCallback(() => skipRef.current?.(), []);

  return { caption, skip };
}
