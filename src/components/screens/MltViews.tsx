"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp, StampPop } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { Burst } from "@/components/cartoon/Doodles";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

function useSecondsLeft(openedAt: string | undefined, totalSeconds: number | undefined): number | null {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!openedAt || !totalSeconds) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [openedAt, totalSeconds]);
  if (!openedAt || !totalSeconds) return null;
  return Math.max(0, Math.ceil(totalSeconds - (now - new Date(openedAt).getTime()) / 1000));
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function MltVotingView({
  state,
  isOwner,
  act,
  speaking,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
  speaking?: boolean;
}) {
  const { session, players, mlt } = state;
  const payload = session!.payload;
  const prompt = payload.mltRound?.promptText ?? "";
  const submittedIds = new Set(mlt?.submittedVoterIds ?? []);
  const total = players.length;
  const voted = submittedIds.size;
  const isVirtual = session!.hostMode === "virtual";
  const totalSeconds = session!.settings.autoSkipSeconds;
  const secondsLeft = useSecondsLeft(
    speaking ? undefined : payload.mltRound?.openedAt,
    totalSeconds
  );
  const pct = secondsLeft !== null ? (secondsLeft / totalSeconds) * 100 : 100;
  const urgent = secondsLeft !== null && secondsLeft <= 5;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Panel tape tilt={-0.5} className="w-full max-w-3xl px-10 py-6 text-center">
        <p className="font-score mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>
          Most Likely To…
        </p>
        <p className="font-display text-4xl leading-tight md:text-5xl" style={{ color: "#221f30" }}>
          {prompt}
        </p>
      </Panel>

      {secondsLeft !== null && (
        <div className="w-full max-w-3xl px-2">
          <div
            className="relative h-3 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: urgent ? "var(--destructive)" : "var(--mustard)", width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </div>
          <div className="mt-1 text-center font-hand text-sm opacity-50">{secondsLeft}s</div>
        </div>
      )}

      <div className="font-hand text-xl opacity-70">
        {voted} / {total} voted
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <AnimatePresence>
          {players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex flex-col items-center gap-1"
            >
              <Mascot avatarId={p.avatarId} size={52} animate={false} />
              <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{p.username}</span>
              {submittedIds.has(p.id) && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ background: "var(--teal)", color: "#fff" }}>✓</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isOwner && !isVirtual && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          Reveal →
        </RoughButton>
      )}
    </div>
  );
}

export function MltRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const reveal = session!.payload.mltReveal;
  const round = session!.payload.mltRound;
  if (!reveal) return null;

  const topIds = new Set(reveal.topPlayerIds);
  const voteCounts = new Map<string, number>();
  for (const v of reveal.votes) {
    voteCounts.set(v.targetId, (voteCounts.get(v.targetId) ?? 0) + 1);
  }

  const sorted = [...players].sort(
    (a, b) => (voteCounts.get(b.id) ?? 0) - (voteCounts.get(a.id) ?? 0)
  );

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TapedLabel tilt={-0.5} color="var(--mustard)" className="text-center">
        <p className="font-score text-xs uppercase tracking-widest" style={{ color: "#8a7f63" }}>Most Likely To…</p>
        <p className="font-display text-3xl" style={{ color: "#221f30" }}>{round?.promptText}</p>
      </TapedLabel>

      <div className="flex flex-wrap justify-center gap-5">
        {sorted.map((p) => {
          const count = voteCounts.get(p.id) ?? 0;
          const isTop = topIds.has(p.id);
          return (
            <motion.div
              key={p.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative flex flex-col items-center gap-1"
            >
              {isTop && <Burst className="absolute -top-4 left-1/2 h-20 w-20 -translate-x-1/2 opacity-80" />}
              <Mascot avatarId={p.avatarId} size={isTop ? 72 : 52} expression={isTop ? "correct" : "idle"} animate={false} />
              <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{p.username}</span>
              {count > 0 && (
                <span
                  className="font-score rounded-full px-2 py-0.5 text-sm tabular-nums"
                  style={{ background: isTop ? "var(--mustard)" : "rgba(255,255,255,.15)", color: "#221f30" }}
                >
                  {count} vote{count !== 1 ? "s" : ""}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {reveal.topPlayerIds.length === 1 && (
        <StampPop color="green">
          <span className="font-score text-sm">
            {players.find((p) => p.id === reveal.topPlayerIds[0])?.username} wins!
          </span>
        </StampPop>
      )}
      {reveal.topPlayerIds.length > 1 && (
        <StampPop color="mustard">
          <span className="font-score text-sm">It&apos;s a tie, no points!</span>
        </StampPop>
      )}

      {isOwner && session!.hostMode !== "virtual" && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {session!.questionIndex + 1 >= session!.questionCount ? "Scores →" : "Next →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function MltVotePanel({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const { players, me } = state;
  const myId = me?.playerId;
  const myVote = me?.myMltVoteTarget;
  async function vote(targetId: string) {
    if (myVote) return;
    await sendAction(code, { type: "VOTE_MLT", targetPlayerId: targetId }, token);
  }

  return (
    <div className="flex flex-col gap-4">
      <TapedLabel tilt={-1} color="var(--mustard)" className="mb-2 text-center">
        <p className="font-display text-xl" style={{ color: "#221f30" }}>
          {state.session!.payload.mltRound?.promptText}
        </p>
      </TapedLabel>
      <p className="font-hand text-center text-lg opacity-80">Tap who fits best!</p>
      <div className="grid grid-cols-2 gap-3">
        {players
          .filter((p) => p.id !== myId)
          .map((p) => {
            const chosen = myVote === p.id;
            return (
              <button
                key={p.id}
                onClick={() => void vote(p.id)}
                disabled={!!myVote}
                className="panel-paper panel-grain flex flex-col items-center gap-1 p-3 transition active:scale-95"
                style={{
                  background: chosen ? "var(--mustard)" : "var(--cream)",
                  border: chosen ? "3px solid #221f30" : "2px solid #221f30",
                  boxShadow: chosen ? "4px 4px 0 rgba(0,0,0,.4)" : "2px 2px 0 rgba(0,0,0,.25)",
                }}
              >
                <Mascot avatarId={p.avatarId} size={44} animate={false} />
                <span className="font-hand text-base" style={{ color: "#221f30" }}>{p.username}</span>
                {chosen && <Stamp color="green" size="md">✓</Stamp>}
              </button>
            );
          })}
      </div>
      {myVote && (
        <p className="font-hand text-center text-base opacity-70">Waiting for others…</p>
      )}
    </div>
  );
}

export function MltRevealPanel({ state }: { state: RoomStateResponse }) {
  const { session, players, me } = state;
  const reveal = session!.payload.mltReveal;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const myVote = me?.myMltVoteTarget;
  const isTie = reveal.topPlayerIds.length > 1;
  const iWonWithVote = !isTie && myVote && reveal.winnerVoterIds.includes(me!.playerId);
  const topName = isTie
    ? "It's a tie!"
    : (players.find((p) => p.id === reveal.topPlayerIds[0])?.username ?? "");

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {topName ? (
        <>
          <p className="font-hand text-xl opacity-80">The group picked…</p>
          <Stamp color={isTie ? "mustard" : iWonWithVote ? "green" : "ink"} size="lg">{topName}!</Stamp>
          {isTie ? (
            <p className="font-hand text-lg opacity-70">No points for a tie!</p>
          ) : iWonWithVote ? (
            <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>
              +{reveal.voterPoints} pts!
            </p>
          ) : (
            <p className="font-hand text-lg opacity-70">
              {myVote === reveal.topPlayerIds[0] ? "You called it!" : "Better luck next round!"}
            </p>
          )}
        </>
      ) : (
        <p className="font-hand text-xl opacity-70">Nobody voted, no points!</p>
      )}
    </div>
  );
}
