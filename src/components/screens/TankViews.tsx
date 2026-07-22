"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp, StampPop } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { Burst } from "@/components/cartoon/Doodles";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

// ── Main screen ───────────────────────────────────────────────────────────────

export function TankPitchingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const tankRound = session!.payload.tankRound;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!tankRound) return;
    const start = new Date(tankRound.pitchStart).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [tankRound?.pitchStart]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tankRound) return null;
  const pitcher = players.find((p) => p.id === tankRound.pitcherId);
  const pitchSeconds = tankRound.pitchSeconds;

  const remaining = Math.max(0, pitchSeconds - elapsed);
  const pct = Math.max(0, 1 - elapsed / pitchSeconds);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        {pitcher && <Mascot avatarId={pitcher.avatarId} size={72} expression="buzzed" />}
        <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">Now pitching</p>
        <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>
          {pitcher?.username ?? "?"}
        </p>
      </div>

      <Panel tape tilt={-0.7} className="w-full max-w-3xl px-10 py-6 text-center">
        <p className="font-score mb-1 text-xs uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>The pitch</p>
        <p className="font-display text-3xl leading-tight" style={{ color: "#221f30" }}>{tankRound.productName}</p>
        <p className="font-hand mt-2 text-xl leading-snug" style={{ color: "#4a4460" }}>{tankRound.tagline}</p>
      </Panel>

      {/* Timer bar */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between">
          <span className="font-score text-xs uppercase tracking-widest opacity-60">Time</span>
          <span className="font-score text-2xl tabular-nums" style={{ color: remaining < 10 ? "var(--coral)" : "var(--mustard)" }}>
            {remaining}s
          </span>
        </div>
        <div className="mt-1 h-3 rounded-full" style={{ background: "rgba(255,255,255,.15)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: remaining < 10 ? "var(--coral)" : "var(--mustard)", width: `${pct * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="px-8 py-3 text-xl">
          Open Investing →
        </RoughButton>
      )}
    </div>
  );
}

export function TankInvestingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players, tank } = state;
  const tankRound = session!.payload.tankRound;
  if (!tankRound) return null;

  const pitcher = players.find((p) => p.id === tankRound.pitcherId);
  const investmentsIn = tank?.investmentsIn ?? 0;
  const investorsNeeded = tank?.investorsNeeded ?? 0;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        {pitcher && <Mascot avatarId={pitcher.avatarId} size={60} />}
        <div>
          <p className="font-score text-xs uppercase tracking-widest opacity-60">Pitch by {pitcher?.username}</p>
          <p className="font-display text-2xl" style={{ color: "#221f30" }}>{tankRound.productName}</p>
        </div>
      </div>

      <Panel tilt={0.5} className="w-full max-w-3xl px-8 py-5 text-center">
        <p className="font-hand text-2xl" style={{ color: "#4a4460" }}>{tankRound.tagline}</p>
      </Panel>

      <p className="font-display text-4xl uppercase" style={{ color: "var(--mustard)" }}>
        🦈 Do you invest?
      </p>

      <div className="font-hand text-xl opacity-70">{investmentsIn} / {investorsNeeded} voted</div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          Reveal →
        </RoughButton>
      )}
    </div>
  );
}

export function TankRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const reveal = session!.payload.tankReveal;
  if (!reveal) return null;

  const pitcher = players.find((p) => p.id === reveal.pitcherId);
  const isLast = session!.questionIndex + 1 >= session!.questionCount;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        {pitcher && <Mascot avatarId={pitcher.avatarId} size={72} expression={reveal.investorCount > 0 ? "correct" : "incorrect"} />}
        <p className="font-display text-2xl" style={{ color: "#221f30" }}>{pitcher?.username}&apos;s pitch</p>
        <TapedLabel tilt={-0.5} color="var(--cream)">
          <p className="font-hand text-xl" style={{ color: "#221f30" }}>{reveal.productName}</p>
        </TapedLabel>
      </div>

      {reveal.investorCount > 0 ? (
        <>
          <Burst className="h-20 w-20 opacity-80" />
          <StampPop color="green">
            {reveal.investorCount} investor{reveal.investorCount !== 1 ? "s" : ""}! +{reveal.pitcherPoints} pts
          </StampPop>
        </>
      ) : (
        <StampPop color="red">No investors this round!</StampPop>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {reveal.investments.map((inv) => {
          const p = players.find((pl) => pl.id === inv.investorId);
          return (
            <div key={inv.investorId} className="flex flex-col items-center gap-1">
              <Mascot avatarId={p?.avatarId ?? "robot"} size={44} expression={inv.invested ? "correct" : "idle"} animate={false} />
              <span className="font-hand text-sm" style={{ color: inv.invested ? "var(--teal)" : "rgba(255,255,255,.5)" }}>
                {p?.username} {inv.invested ? "✓" : "✗"}
              </span>
            </div>
          );
        })}
      </div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {isLast ? "Final scores →" : "Next pitcher →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function TankPitchPhone({
  state,
}: {
  state: RoomStateResponse;
}) {
  const { session, me, players } = state;
  const tankRound = session!.payload.tankRound;
  if (!tankRound) return null;

  const amPitcher = me?.playerId === tankRound.pitcherId;
  const pitcher = players.find((p) => p.id === tankRound.pitcherId);

  if (amPitcher) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">You&apos;re pitching!</Stamp>
        <TapedLabel tilt={-1} color="var(--mustard)" className="text-center">
          <p className="font-display text-2xl" style={{ color: "#221f30" }}>{tankRound.productName}</p>
          <p className="font-hand mt-1 text-lg" style={{ color: "#4a4460" }}>{tankRound.tagline}</p>
        </TapedLabel>
        <p className="font-hand text-xl opacity-80">
          Sell it! You have {tankRound.pitchSeconds} seconds on the clock 🎤
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {pitcher && <Mascot avatarId={pitcher.avatarId} size={72} expression="buzzed" />}
      <p className="font-display text-2xl">{pitcher?.username} is pitching…</p>
      <Panel tilt={-1} className="px-6 py-4">
        <p className="font-hand text-xl" style={{ color: "#221f30" }}>{tankRound.tagline}</p>
      </Panel>
      <p className="font-hand text-base opacity-70">Get ready to invest or pass!</p>
    </div>
  );
}

export function TankInvestPhone({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const { session, me } = state;
  const tankRound = session!.payload.tankRound;
  const amPitcher = me?.playerId === tankRound?.pitcherId;
  const myVote = me?.myTankInvestment;

  async function invest(val: boolean) {
    if (myVote !== null) return;
    await sendAction(code, { type: "SUBMIT_TANK_INVESTMENT", invest: val }, token);
  }

  if (amPitcher) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot avatarId={me ? "party" : "robot"} size={72} expression="buzzed" />
        <p className="font-display text-3xl uppercase">Waiting for the verdict…</p>
        <p className="font-hand text-xl opacity-70">Will the sharks invest? 🦈</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <TapedLabel tilt={-1} color="var(--cream)" className="text-center">
        <p className="font-display text-2xl" style={{ color: "#221f30" }}>{tankRound?.productName}</p>
        <p className="font-hand mt-1 text-lg" style={{ color: "#4a4460" }}>{tankRound?.tagline}</p>
      </TapedLabel>

      <p className="font-display text-3xl uppercase" style={{ color: "var(--mustard)" }}>Do you invest?</p>

      <div className="flex w-full gap-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => void invest(true)}
          disabled={myVote !== null}
          className="btn-rough flex-1 py-5 text-2xl"
          style={{
            background: myVote === true ? "var(--teal)" : "var(--cream)",
            color: "#221f30",
            opacity: myVote !== null && myVote !== true ? 0.4 : 1,
          }}
        >
          💰 Invest
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => void invest(false)}
          disabled={myVote !== null}
          className="btn-rough flex-1 py-5 text-2xl"
          style={{
            background: myVote === false ? "var(--coral)" : "var(--cream)",
            color: "#221f30",
            opacity: myVote !== null && myVote !== false ? 0.4 : 1,
          }}
        >
          ✋ Pass
        </motion.button>
      </div>

      {myVote !== null && (
        <p className="font-hand text-center text-base opacity-70">Vote locked in! Waiting for others…</p>
      )}
    </div>
  );
}

export function TankRevealPhone({ state }: { state: RoomStateResponse }) {
  const { session, me } = state;
  const reveal = session!.payload.tankReveal;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const amPitcher = me?.playerId === reveal.pitcherId;
  const myInv = reveal.investments.find((i) => i.investorId === me?.playerId);

  if (amPitcher) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {reveal.investorCount > 0 ? (
          <>
            <Stamp color="green" size="lg">Deal! +{reveal.pitcherPoints} pts</Stamp>
            <p className="font-hand text-xl opacity-80">{reveal.investorCount} shark{reveal.investorCount !== 1 ? "s" : ""} invested!</p>
          </>
        ) : (
          <Stamp color="red" size="lg">No deal this round!</Stamp>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {reveal.investorCount > 0 ? (
        <p className="font-hand text-xl">{reveal.investorCount} shark{reveal.investorCount !== 1 ? "s" : ""} invested!</p>
      ) : (
        <p className="font-hand text-xl opacity-70">Nobody invested.</p>
      )}
      {myInv?.invested && <Stamp color="green" size="lg">You invested!</Stamp>}
      {myInv && !myInv.invested && <Stamp color="ink" size="md">You passed</Stamp>}
    </div>
  );
}
