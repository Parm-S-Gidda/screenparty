"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "@/components/game/AvatarBadge";
import { sendAction } from "@/lib/gameClient";
import type { GameAction, RoomStateResponse } from "@/lib/game/types";
import { cn } from "@/lib/utils";

// Majority Would You Rather, main screen + phone views.

// flat screen-print paper colours per side
const SIDE_FILL = { a: "#2fa8a0", b: "#e2493b" } as const;

// --- main screen -------------------------------------------------------------

export function WyrChoosingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  const round = session.payload.wyrRound;
  if (!round) return null;
  const answered = state.wyr?.submittedPlayerIds.length ?? 0;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <h2 className="font-display text-5xl uppercase tracking-wide">Would you rather…</h2>
      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-stretch gap-4">
        <OptionPanel side="a" text={round.optionA} />
        <div className="font-display flex items-center text-4xl" style={{ color: "var(--mustard)" }}>
          VS
        </div>
        <OptionPanel side="b" text={round.optionB} />
      </div>
      <p className="font-hand text-2xl text-muted-foreground">
        Pick your side and call the majority on your phone!
      </p>
      <div className="flex items-center gap-6">
        <p className="font-score text-xl uppercase tracking-wider tabular-nums text-muted-foreground">
          {answered} of {state.players.length} answered
        </p>
        {isOwner && session.hostMode === "self" && answered > 0 && (
          <Button variant="outline" onClick={() => act({ type: "REVEAL_ROUND" })}>
            Reveal now
          </Button>
        )}
      </div>
    </div>
  );
}

function OptionPanel({
  side,
  text,
  dim,
  pct,
}: {
  side: "a" | "b";
  text: string;
  dim?: boolean;
  // vote share shown at the top-right corner once the majority is revealed
  pct?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "a" ? -24 : 24, rotate: side === "a" ? -2 : 2 }}
      animate={{ opacity: dim ? 0.45 : 1, x: 0, rotate: side === "a" ? -0.8 : 0.8 }}
      className={cn(
        "panel-paper panel-grain flex min-h-36 items-center justify-center p-6 text-center",
        dim && "saturate-50"
      )}
      style={{ background: SIDE_FILL[side] }}
    >
      <p className="font-display text-balance text-3xl leading-tight md:text-4xl" style={{ color: "#f5ecd4" }}>
        {text}
      </p>
      {pct !== undefined && (
        <motion.span
          initial={{ scale: 0, rotate: 14 }}
          animate={{ scale: 1, rotate: 6 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 380, damping: 15 }}
          className="font-score absolute -right-3 -top-4 rounded-lg border-[3px] border-[#221f30] px-2 py-0.5 text-2xl tabular-nums"
          style={{
            background: dim ? "var(--cream)" : "var(--mustard)",
            color: "#221f30",
            boxShadow: "2px 2px 0 rgba(0,0,0,.4)",
          }}
        >
          {pct}%
        </motion.span>
      )}
    </motion.div>
  );
}

export function WyrRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  const round = session.payload.wyrRound;
  const reveal = session.payload.wyrReveal;
  if (!round || !reveal) return null;
  const isLast = session.questionIndex + 1 >= session.questionCount;

  const sideOf = (side: "a" | "b") =>
    reveal.choices.filter((c) => c.choice === side).map((c) => c.playerId);
  const totalVotes = reveal.countA + reveal.countB;
  const pctOf = (count: number) => (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <h2 className="font-display text-4xl uppercase tracking-wide">
        {reveal.majority === "tie" ? "It's a dead tie!" : "The majority says…"}
      </h2>

      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-stretch gap-4">
        {(["a", "b"] as const).map((side, i) => (
          <div key={side} className={cn("flex flex-col gap-3", i === 1 && "order-3")}>
            <OptionPanel
              side={side}
              text={side === "a" ? round.optionA : round.optionB}
              dim={reveal.majority !== "tie" && reveal.majority !== side}
              pct={pctOf(side === "a" ? reveal.countA : reveal.countB)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-2"
            >
              <span
                className="font-score text-5xl tabular-nums"
                style={reveal.majority === side ? { color: "var(--mustard)" } : undefined}
              >
                {side === "a" ? reveal.countA : reveal.countB}
              </span>
              <div className="flex flex-wrap justify-center gap-1">
                {sideOf(side).map((playerId) => {
                  const p = state.players.find((pl) => pl.id === playerId);
                  return p ? <AvatarBadge key={playerId} avatarId={p.avatarId} size="sm" /> : null;
                })}
              </div>
            </motion.div>
          </div>
        ))}
        <div className="font-display order-2 flex items-start justify-center pt-12 text-4xl" style={{ color: "var(--mustard)" }}>
          VS
        </div>
      </div>

      {reveal.teamMajorities && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-hand flex gap-6 text-2xl"
        >
          <span className="text-red-400">
            Red picked{" "}
            {reveal.teamMajorities.red === "tie"
              ? "a split"
              : reveal.teamMajorities.red === "a"
                ? round.optionA
                : round.optionB}
          </span>
          <span className="text-sky-400">
            Blue picked{" "}
            {reveal.teamMajorities.blue === "tie"
              ? "a split"
              : reveal.teamMajorities.blue === "a"
                ? round.optionA
                : round.optionB}
          </span>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="font-hand text-2xl"
      >
        {!reveal.teamMajorities && reveal.majority === "tie" ? (
          <span className="text-muted-foreground">No majority, nobody scores this round!</span>
        ) : (
          <span style={{ color: "#a9d18e" }}>
            {reveal.correctPredictorIds.length} called it (+{reveal.predictorPoints} each)
          </span>
        )}
      </motion.p>

      {isOwner && session.hostMode === "self" && (
        <Button size="lg" className="font-bold" onClick={() => act({ type: "SHOW_SCOREBOARD" })}>
          {isLast ? "Final results" : "Show scoreboard"}
        </Button>
      )}
    </div>
  );
}

// --- phone ---------------------------------------------------------------------

export function WyrChoosePanel({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const round = state.session!.payload.wyrRound;
  const teamsEnabled = state.session!.settings.teamsEnabled ?? false;
  const myTeam = state.players.find((p) => p.id === state.me?.playerId)?.team;
  const otherTeamName = myTeam === "red" ? "Team Blue" : "Team Red";
  const [choice, setChoice] = useState<"a" | "b" | null>(null);
  const [prediction, setPrediction] = useState<"a" | "b" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!round) return null;

  if (state.me?.hasSubmitted) {
    const answered = state.wyr?.submittedPlayerIds.length ?? 0;
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-3xl uppercase">Locked in!</p>
        <p className="font-hand animate-pulse text-xl text-muted-foreground">
          Waiting for the rest… {answered} of {state.players.length}
        </p>
      </div>
    );
  }

  async function submit() {
    if (!choice || !prediction || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, { type: "SUBMIT_WYR", choice, prediction }, token);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const OptionButton = ({
    side,
    selected,
    onPick,
  }: {
    side: "a" | "b";
    selected: boolean;
    onPick: () => void;
  }) => (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "panel-paper font-hand flex-1 p-3 text-center text-lg leading-snug transition active:translate-y-1"
      )}
      style={
        selected
          ? { background: SIDE_FILL[side], color: "#f5ecd4", transform: `rotate(${side === "a" ? -1 : 1}deg)` }
          : { background: "var(--cream)", color: "#221f30", transform: `rotate(${side === "a" ? -0.5 : 0.5}deg)` }
      }
    >
      {side === "a" ? round.optionA : round.optionB}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="font-display text-center text-2xl uppercase tracking-wide">Which would YOU rather?</p>
        <div className="flex gap-2">
          <OptionButton side="a" selected={choice === "a"} onPick={() => setChoice("a")} />
          <OptionButton side="b" selected={choice === "b"} onPick={() => setChoice("b")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-center text-2xl uppercase tracking-wide">
          {teamsEnabled
            ? `What will ${otherTeamName} pick?`
            : "What will the majority pick?"}
        </p>
        <div className="flex gap-2">
          <OptionButton side="a" selected={prediction === "a"} onPick={() => setPrediction("a")} />
          <OptionButton side="b" selected={prediction === "b"} onPick={() => setPrediction("b")} />
        </div>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <Button
        size="lg"
        className="h-14 text-lg font-bold"
        disabled={!choice || !prediction || busy}
        onClick={submit}
      >
        {busy ? "Sending…" : "Lock it in"}
      </Button>
    </div>
  );
}

// Phone result held back briefly so the main screen's reveal (dim, counts,
// percentages) lands first and nobody's phone spoils it.
const WYR_UNVEIL_MS = 4000;

export function WyrRevealPanel({ state }: { state: RoomStateResponse }) {
  const [unveiled, setUnveiled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setUnveiled(true), WYR_UNVEIL_MS);
    return () => clearTimeout(timer);
  }, []);
  const session = state.session!;
  const reveal = session.payload.wyrReveal;
  if (!reveal) return null;

  if (!unveiled) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.p
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="font-display text-3xl uppercase"
        >
          The votes are in…
        </motion.p>
        <p className="font-hand animate-pulse text-xl text-muted-foreground">
          Eyes on the big screen!
        </p>
      </div>
    );
  }
  const me = state.me?.playerId ?? "";
  const myChoice = reveal.choices.find((c) => c.playerId === me)?.choice;
  const calledIt = reveal.correctPredictorIds.includes(me);
  const withMajority = reveal.majority !== "tie" && myChoice === reveal.majority;
  const teams = Boolean(reveal.teamMajorities);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {!teams && reveal.majority === "tie" ? (
        <p className="font-display text-3xl uppercase text-muted-foreground">Dead tie, no points!</p>
      ) : calledIt ? (
        <p className="font-display text-3xl uppercase" style={{ color: "#a9d18e" }}>
          You called {teams ? "the other team" : "the majority"}! +{reveal.predictorPoints}
        </p>
      ) : (
        <p className="font-display text-3xl uppercase text-destructive">
          {teams ? "The other team surprised you…" : "Majority went the other way…"}
        </p>
      )}
      {myChoice && reveal.majority !== "tie" && (
        <p className="font-hand text-xl text-muted-foreground">
          {withMajority ? "You voted with the crowd" : "You went your own way"}
        </p>
      )}
    </div>
  );
}
