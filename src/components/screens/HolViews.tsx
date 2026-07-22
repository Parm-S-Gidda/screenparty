"use client";

import { motion } from "framer-motion";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp, StampPop } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

// ── Main screen ───────────────────────────────────────────────────────────────

export function HolVotingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players, hol } = state;
  const round = session!.payload.holRound;
  if (!round) return null;
  const voted = hol?.submittedVoterIds.length ?? 0;
  const total = players.length;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">Is the right one higher or lower?</p>

      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-6">
        {/* Left item */}
        <Panel tilt={-1} className="flex flex-col items-center gap-2 px-6 py-6 text-center">
          <p className="font-score text-xs uppercase tracking-widest opacity-60">Left</p>
          <p className="font-display text-2xl leading-tight" style={{ color: "#221f30" }}>{round.leftLabel}</p>
          {round.leftValue !== null ? (
            <span className="font-score mt-2 rounded-lg border-2 border-[#221f30] px-3 py-1 text-xl tabular-nums" style={{ background: "var(--mustard)", color: "#221f30" }}>
              {round.leftValue.toLocaleString()} {round.leftUnit}
            </span>
          ) : (
            <span className="font-hand mt-2 text-lg opacity-50">{round.leftUnit}</span>
          )}
        </Panel>

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-4xl" style={{ color: "var(--mustard)" }}>VS</span>
          <span className="font-score text-xs opacity-50">?</span>
        </div>

        {/* Right item */}
        <Panel tilt={1} className="flex flex-col items-center gap-2 px-6 py-6 text-center opacity-80">
          <p className="font-score text-xs uppercase tracking-widest opacity-60">Right</p>
          <p className="font-display text-2xl leading-tight" style={{ color: "#221f30" }}>{round.rightLabel}</p>
          <span className="font-hand mt-2 text-lg opacity-50">{round.rightUnit}</span>
          <span className="font-score rounded-lg border-2 border-dashed border-[#221f30]/40 px-3 py-1 text-xl" style={{ color: "#221f30" }}>?</span>
        </Panel>
      </div>

      <div className="font-hand text-xl opacity-70">{voted} / {total} voted</div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="px-8 py-3 text-xl">
          Reveal →
        </RoughButton>
      )}
    </div>
  );
}

export function HolRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session } = state;
  const reveal = session!.payload.holReveal;
  const round = session!.payload.holRound;
  if (!reveal) return null;

  const isLast = session!.questionIndex + 1 >= session!.questionCount;
  const correct = reveal.majority !== "tie" && reveal.majority === reveal.correctAnswer;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-6">
        <Panel tilt={-1} className="flex flex-col items-center gap-2 px-6 py-6 text-center">
          <p className="font-display text-xl" style={{ color: "#221f30" }}>{round?.leftLabel}</p>
          <span className="font-score rounded-lg border-2 border-[#221f30] px-3 py-1 text-2xl tabular-nums" style={{ background: "var(--cream)", color: "#221f30" }}>
            {reveal.leftValue.toLocaleString()} {round?.leftUnit}
          </span>
        </Panel>

        <div className="flex flex-col items-center">
          <span className="font-display text-4xl" style={{ color: correct ? "var(--teal)" : "var(--coral)" }}>
            {reveal.correctAnswer === "higher" ? "▲" : "▼"}
          </span>
        </div>

        <Panel tilt={1} className="flex flex-col items-center gap-2 px-6 py-6 text-center">
          <p className="font-display text-xl" style={{ color: "#221f30" }}>{round?.rightLabel}</p>
          <span className="font-score rounded-lg border-2 border-[#221f30] px-3 py-1 text-2xl tabular-nums" style={{ background: correct ? "var(--teal)" : "var(--coral)", color: "#fff" }}>
            {reveal.rightValue.toLocaleString()} {round?.rightUnit}
          </span>
        </Panel>
      </div>

      {reveal.majority !== "tie" ? (
        <StampPop color={correct ? "green" : "red"}>
          {correct
            ? `Majority got it! +${reveal.voterPoints} pts`
            : `Majority was wrong!`}
        </StampPop>
      ) : (
        <StampPop color="mustard">It&apos;s a tie, no points!</StampPop>
      )}

      {isOwner && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {isLast ? "See final scores →" : "Next →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function HolVotePanel({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const round = state.session!.payload.holRound;
  const myVote = state.me?.myHolVote;

  async function vote(v: "higher" | "lower") {
    if (myVote) return;
    await sendAction(code, { type: "VOTE_HOL", vote: v }, token);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <TapedLabel tilt={-1} color="var(--cream)" className="mb-2 text-center max-w-xs">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Right side ({round?.rightUnit})</p>
        <p className="font-display text-xl" style={{ color: "#221f30" }}>{round?.rightLabel}</p>
      </TapedLabel>

      <p className="font-hand text-center text-lg opacity-80">
        {round?.leftValue !== null
          ? `Left is ${round?.leftValue?.toLocaleString()} ${round?.leftUnit}, is the right one…`
          : "Is the right one…"}
      </p>

      <div className="flex w-full gap-4">
        {(["higher", "lower"] as const).map((v) => (
          <motion.button
            key={v}
            whileTap={{ scale: 0.92 }}
            onClick={() => void vote(v)}
            disabled={!!myVote}
            className="btn-rough flex-1 py-5 text-2xl uppercase tracking-wider transition"
            style={{
              background: myVote === v ? "var(--mustard)" : myVote ? "rgba(255,255,255,.1)" : "var(--cream)",
              color: "#221f30",
              opacity: myVote && myVote !== v ? 0.4 : 1,
            }}
          >
            {v === "higher" ? "⬆ Higher" : "⬇ Lower"}
          </motion.button>
        ))}
      </div>

      {myVote && <p className="font-hand text-center text-base opacity-70">Waiting for reveal…</p>}
    </div>
  );
}

export function HolRevealPanel({ state }: { state: RoomStateResponse }) {
  const reveal = state.session!.payload.holReveal;
  const myVote = state.me?.myHolVote;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const iCorrect = myVote && myVote === reveal.correctAnswer && reveal.majority !== "tie";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-hand text-xl opacity-80">
        The right side was {reveal.correctAnswer}!
      </p>
      <span className="font-score text-5xl tabular-nums" style={{ color: "var(--mustard)" }}>
        {reveal.rightValue.toLocaleString()}
      </span>
      {iCorrect ? (
        <Stamp color="green" size="lg">+{reveal.voterPoints} pts!</Stamp>
      ) : (
        <Stamp color="red" size="lg">
          {myVote ? (myVote !== reveal.correctAnswer ? "Wrong side!" : "Tie, no points") : "No vote"}
        </Stamp>
      )}
    </div>
  );
}
