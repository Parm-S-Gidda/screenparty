"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

// ── Main screen ───────────────────────────────────────────────────────────────

export function NumSubmittingView({ state }: { state: RoomStateResponse }) {
  const { session, players, num } = state;
  const round = session!.payload.numRound;
  if (!round) return null;

  const submittedIds = new Set(num?.submittedExampleIds ?? []);
  const guesser = players.find((p) => p.id === round.guesserPlayerId);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        {guesser && <Mascot avatarId={guesser.avatarId} size={72} expression="idle" />}
        <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">Guessing this round</p>
        <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>{guesser?.username}</p>
      </div>

      <Panel tape tilt={-0.5} className="px-10 py-6 text-center">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Theme</p>
        <p className="font-display text-4xl" style={{ color: "#221f30" }}>{round.theme}</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="font-score text-sm px-2 py-0.5 rounded" style={{ background: "var(--coral)", color: "#fff" }}>1 = {round.scaleLow}</span>
          <span className="font-hand text-lg opacity-50">→</span>
          <span className="font-score text-sm px-2 py-0.5 rounded" style={{ background: "var(--teal)", color: "#fff" }}>10 = {round.scaleHigh}</span>
        </div>
      </Panel>

      <p className="font-hand text-xl opacity-70">
        Everyone else is submitting their example…
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {players
          .filter((p) => p.id !== round.guesserPlayerId)
          .map((p) => (
            <div key={p.id} className="relative flex flex-col items-center gap-1">
              <Mascot avatarId={p.avatarId} size={48} animate={false} />
              <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{p.username}</span>
              {submittedIds.has(p.id) && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ background: "var(--teal)", color: "#fff" }}>✓</span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export function NumGuessingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const round = session!.payload.numRound;
  const guessing = session!.payload.numGuessing;
  if (!round || !guessing) return null;

  const guesser = players.find((p) => p.id === round.guesserPlayerId);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        {guesser && <Mascot avatarId={guesser.avatarId} size={64} expression="buzzed" />}
        <p className="font-display text-2xl" style={{ color: "var(--mustard)" }}>{guesser?.username} is guessing!</p>
      </div>

      <TapedLabel tilt={-0.5} color="var(--cream)" className="text-center">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Theme</p>
        <p className="font-display text-2xl" style={{ color: "#221f30" }}>{round.theme}</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="font-score text-xs px-2 py-0.5 rounded" style={{ background: "var(--coral)", color: "#fff" }}>1 = {round.scaleLow}</span>
          <span className="font-score text-xs px-2 py-0.5 rounded" style={{ background: "var(--teal)", color: "#fff" }}>10 = {round.scaleHigh}</span>
        </div>
      </TapedLabel>

      <div className="w-full max-w-3xl space-y-3">
        {guessing.examples.map((ex, i) => {
          const author = players.find((p) => p.id === ex.playerId);
          return (
            <Panel key={ex.playerId} tilt={(i % 2 ? 0.5 : -0.5)} className="flex items-center gap-4 px-6 py-4">
              {author && <Mascot avatarId={author.avatarId} size={44} animate={false} />}
              <div className="flex-1">
                <p className="font-hand text-xl" style={{ color: "#221f30" }}>&ldquo;{ex.exampleText}&rdquo;</p>
                <p className="font-score text-xs opacity-50">{author?.username} • their number: ?</p>
              </div>
            </Panel>
          );
        })}
      </div>

      <p className="font-hand text-xl opacity-70">
        {guesser?.username} is assigning numbers on their phone…
      </p>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          Reveal →
        </RoughButton>
      )}
    </div>
  );
}

export function NumRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const reveal = session!.payload.numReveal;
  if (!reveal) return null;

  const guesser = players.find((p) => p.id === reveal.guesserPlayerId);
  const isLast = session!.questionIndex + 1 >= session!.questionCount;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        {guesser && <Mascot avatarId={guesser.avatarId} size={60} expression="correct" />}
        <p className="font-display text-2xl" style={{ color: "var(--mustard)" }}>{guesser?.username}&apos;s guesses</p>
        <p className="font-hand text-base opacity-60">+{reveal.guesserPoints} pts for accuracy</p>
      </div>

      <TapedLabel tilt={-0.5} color="var(--cream)" className="text-center mb-2">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Theme: {reveal.theme}</p>
        <p className="font-hand text-sm opacity-60">1 = {reveal.scaleLow} · 10 = {reveal.scaleHigh}</p>
      </TapedLabel>

      <div className="w-full max-w-3xl space-y-3">
        {reveal.examples.map((ex, i) => {
          const author = players.find((p) => p.id === ex.playerId);
          const diff = ex.guessedNumber !== null ? Math.abs(ex.actualNumber - ex.guessedNumber) : null;
          return (
            <motion.div
              key={ex.playerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Panel tilt={(i % 2 ? 0.5 : -0.5)} className="flex items-center gap-4 px-6 py-3">
                {author && <Mascot avatarId={author.avatarId} size={40} animate={false} />}
                <div className="flex-1">
                  <p className="font-hand text-xl" style={{ color: "#221f30" }}>&ldquo;{ex.exampleText}&rdquo;</p>
                  <p className="font-score text-xs opacity-50">{author?.username}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-score text-xs opacity-50">guessed / actual</span>
                  <span className="font-score text-xl tabular-nums" style={{ color: diff === 0 ? "var(--teal)" : diff !== null && diff <= 1 ? "var(--mustard)" : "var(--coral)" }}>
                    {ex.guessedNumber ?? "?"} / {ex.actualNumber}
                  </span>
                  {ex.points > 0 && <span className="font-score text-xs" style={{ color: "var(--teal)" }}>+{ex.points}</span>}
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {isLast ? "Final scores →" : "Next round →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function NumSubmitPhone({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const { session, me } = state;
  const round = session!.payload.numRound;
  const isGuesser = me?.playerId === round?.guesserPlayerId;
  const myNumber = me?.myNumAssignment;
  const hasSubmitted = me?.hasSubmitted;
  const [example, setExample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isGuesser) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="mustard" size="lg">You&apos;re the guesser!</Stamp>
        <TapedLabel tilt={-1} color="var(--mustard)" className="text-center">
          <p className="font-display text-2xl" style={{ color: "#221f30" }}>{round?.theme}</p>
        </TapedLabel>
        <p className="font-hand text-xl opacity-80">Wait for everyone&apos;s examples to come in…</p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="font-score px-2 py-0.5 rounded" style={{ background: "var(--coral)", color: "#fff" }}>1 = {round?.scaleLow}</span>
          <span className="font-score px-2 py-0.5 rounded" style={{ background: "var(--teal)", color: "#fff" }}>10 = {round?.scaleHigh}</span>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">Example submitted!</Stamp>
        <p className="font-hand text-xl opacity-70">Waiting for others…</p>
      </div>
    );
  }

  async function submit() {
    if (busy || !example.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, { type: "SUBMIT_NUM_EXAMPLE", text: example.trim() }, token);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TapedLabel tilt={-1} color="var(--cream)" className="text-center">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Theme</p>
        <p className="font-display text-2xl" style={{ color: "#221f30" }}>{round?.theme}</p>
      </TapedLabel>

      <div className="flex items-center justify-center gap-4">
        <span className="font-score text-xs px-2 py-0.5 rounded" style={{ background: "var(--coral)", color: "#fff" }}>1 = {round?.scaleLow}</span>
        <span className="font-score text-xs px-2 py-0.5 rounded" style={{ background: "var(--teal)", color: "#fff" }}>10 = {round?.scaleHigh}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="font-hand text-lg opacity-80">Your number is</p>
        <span className="font-display text-7xl tabular-nums" style={{ color: "var(--mustard)" }}>
          {myNumber ?? "?"}
        </span>
        <p className="font-hand text-base opacity-60">Submit an example that feels like a {myNumber}</p>
      </div>

      <textarea
        className="panel-paper w-full resize-none rounded-xl border-2 border-[#221f30] p-3 font-hand text-xl"
        style={{ background: "var(--cream)", color: "#221f30", minHeight: 80 }}
        placeholder={`Something that's a ${myNumber} for "${round?.theme}"…`}
        value={example}
        maxLength={80}
        onChange={(e) => setExample(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <RoughButton onClick={submit} disabled={busy || !example.trim()} className="w-full py-3 text-xl">
        {busy ? "Submitting…" : "Submit"}
      </RoughButton>
    </div>
  );
}

export function NumGuessPhone({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const { session, me, players } = state;
  const round = session!.payload.numRound;
  const guessing = session!.payload.numGuessing;
  const isGuesser = me?.playerId === round?.guesserPlayerId;
  const [guesses, setGuesses] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGuesser) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-display text-3xl uppercase">Waiting…</p>
        <p className="font-hand text-xl opacity-70">
          {players.find((p) => p.id === round?.guesserPlayerId)?.username} is assigning numbers!
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">Guesses locked in!</Stamp>
        <p className="font-hand text-xl opacity-70">Waiting for the reveal…</p>
      </div>
    );
  }

  if (!guessing) {
    return <p className="font-hand text-center text-xl opacity-70">Loading examples…</p>;
  }

  const allGuessed = guessing.examples.every((ex) => guesses[ex.playerId] !== undefined);

  function setGuess(playerId: string, num: number) {
    setGuesses((prev) => ({ ...prev, [playerId]: num }));
  }

  async function submit() {
    if (busy || !allGuessed) return;
    setBusy(true);
    setError(null);
    try {
      const guessList = guessing!.examples.map((ex) => ({
        playerId: ex.playerId,
        number: guesses[ex.playerId],
      }));
      await sendAction(code, { type: "SUBMIT_NUM_GUESSES", guesses: guessList }, token);
      setSubmitted(true);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TapedLabel tilt={-1} color="var(--mustard)" className="text-center">
        <p className="font-display text-xl" style={{ color: "#221f30" }}>{round?.theme}</p>
        <p className="font-hand text-sm opacity-60">1 = {round?.scaleLow} · 10 = {round?.scaleHigh}</p>
      </TapedLabel>

      <div className="space-y-4">
        {guessing.examples.map((ex) => {
          const author = players.find((p) => p.id === ex.playerId);
          const val = guesses[ex.playerId] ?? 5;
          return (
            <div key={ex.playerId} className="panel-paper rounded-xl border-2 border-[#221f30] p-3" style={{ background: "var(--cream)" }}>
              <p className="font-hand text-base" style={{ color: "#4a4460" }}>
                {author && <Mascot avatarId={author.avatarId} size={24} animate={false} />}{" "}
                &ldquo;{ex.exampleText}&rdquo;
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-score text-xs opacity-50">1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={val}
                  onChange={(e) => setGuess(ex.playerId, Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-score text-xs opacity-50">10</span>
                <span className="font-score w-8 rounded border border-[#221f30] px-1 py-0.5 text-center text-lg tabular-nums" style={{ color: "#221f30" }}>
                  {guesses[ex.playerId] ?? "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <RoughButton onClick={submit} disabled={busy || !allGuessed} className="w-full py-3 text-xl">
        {busy ? "Locking in…" : allGuessed ? "Lock in guesses!" : `${Object.keys(guesses).length}/${guessing.examples.length} assigned`}
      </RoughButton>
    </div>
  );
}

export function NumRevealPhone({ state }: { state: RoomStateResponse }) {
  const { session, me } = state;
  const reveal = session!.payload.numReveal;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const isGuesser = me?.playerId === reveal.guesserPlayerId;
  const myExample = reveal.examples.find((e) => e.playerId === me?.playerId);

  if (isGuesser) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">+{reveal.guesserPoints} pts!</Stamp>
        <p className="font-hand text-xl opacity-70">Check the big screen for full results!</p>
      </div>
    );
  }

  if (myExample) {
    const diff = myExample.guessedNumber !== null
      ? Math.abs(myExample.actualNumber - myExample.guessedNumber)
      : null;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-hand text-xl opacity-80">Your number was {myExample.actualNumber}</p>
        <p className="font-hand text-xl opacity-80">They guessed {myExample.guessedNumber ?? "nothing"}</p>
        {myExample.points > 0 ? (
          <Stamp color="green" size="lg">+{myExample.points} pts!</Stamp>
        ) : (
          <Stamp color="red" size="md">Off by {diff}</Stamp>
        )}
      </div>
    );
  }

  return null;
}
