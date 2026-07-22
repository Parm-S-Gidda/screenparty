"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

// ── Main screen ───────────────────────────────────────────────────────────────

export function GtpAnsweringView({ state }: { state: RoomStateResponse }) {
  const { session, players, gtp } = state;
  const round = session!.payload.gtpRound;
  const submittedIds = new Set(gtp?.submittedPlayerIds ?? []);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Panel tape tilt={-0.5} className="w-full max-w-3xl px-10 py-6 text-center">
        {round?.mode === "fill_blank" ? (
          <>
            <p className="font-score mb-1 text-sm uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>Fill in the blank</p>
            <p className="font-display text-3xl leading-snug" style={{ color: "#221f30" }}>{round.promptText}</p>
          </>
        ) : (
          <>
            <p className="font-score mb-1 text-sm uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>Answer the question</p>
            <p className="font-display text-3xl leading-snug" style={{ color: "#221f30" }}>{round?.promptText}</p>
          </>
        )}
      </Panel>

      <div className="font-hand text-xl opacity-70">
        {submittedIds.size} / {players.length} answered
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {players.map((p) => (
          <div key={p.id} className="relative flex flex-col items-center gap-1">
            <Mascot avatarId={p.avatarId} size={50} animate={false} />
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

export function GtpGuessingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players, gtp } = state;
  const round = session!.payload.gtpRound;
  const guessing = session!.payload.gtpGuessing;
  if (!guessing) return null;

  const guessesIn = gtp?.guessesIn ?? 0;
  const guessersNeeded = gtp?.guessersNeeded ?? 0;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">
        Answer {(round?.answerIndex ?? 0) + 1} of {round?.totalAnswers}, who wrote this?
      </p>

      <Panel tape tilt={-0.7} className="w-full max-w-3xl px-10 py-8 text-center">
        {round?.mode === "fill_blank" && (
          <p className="font-hand mb-2 text-lg opacity-60">{round.promptText.replace("___", "___")}</p>
        )}
        <p className="font-display text-4xl leading-snug" style={{ color: "#221f30" }}>
          &ldquo;{guessing.answerText}&rdquo;
        </p>
      </Panel>

      <div className="font-hand text-xl opacity-70">{guessesIn} / {guessersNeeded} guessed</div>

      <div className="flex flex-wrap justify-center gap-4">
        <AnimatePresence>
          {players.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1">
              <Mascot avatarId={p.avatarId} size={48} animate={false} />
              <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{p.username}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          Reveal →
        </RoughButton>
      )}
    </div>
  );
}

export function GtpRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const reveal = session!.payload.gtpReveal;
  const round = session!.payload.gtpRound;
  if (!reveal) return null;

  const author = players.find((p) => p.id === reveal.answerPlayerId);
  const isLastAnswer = round ? round.answerIndex + 1 >= round.totalAnswers : false;
  const isLastPrompt = session!.questionIndex + 1 >= session!.questionCount;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TapedLabel tilt={-0.5} color="var(--cream)" className="text-center max-w-2xl">
        <p className="font-display text-3xl" style={{ color: "#221f30" }}>&ldquo;{reveal.answerText}&rdquo;</p>
      </TapedLabel>

      {author && (
        <div className="flex flex-col items-center gap-2">
          <p className="font-hand text-xl opacity-70">Written by…</p>
          <Mascot avatarId={author.avatarId} size={80} expression="correct" />
          <Stamp color="green" size="lg">{author.username}!</Stamp>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 text-sm font-hand opacity-80">
        {reveal.correctGuesserIds.length > 0 && (
          <span style={{ color: "var(--teal)" }}>
            ✓ {reveal.correctGuesserIds.map((id) => players.find((p) => p.id === id)?.username).filter(Boolean).join(", ")} got it!
          </span>
        )}
      </div>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {isLastAnswer && isLastPrompt ? "Final scores →" : isLastAnswer ? "Scoreboard →" : "Next answer →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function GtpAnswerForm({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const round = state.session!.payload.gtpRound;
  const hasSubmitted = state.me?.hasSubmitted;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, { type: "SUBMIT_GTP_ANSWER", text: text.trim() }, token);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">Submitted!</Stamp>
        <p className="font-hand text-xl opacity-70">Waiting for everyone else…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TapedLabel tilt={-1} color="var(--mustard)" className="text-center">
        {round?.mode === "fill_blank" ? (
          <p className="font-display text-lg" style={{ color: "#221f30" }}>{round.promptText}</p>
        ) : (
          <>
            <p className="font-score text-xs uppercase tracking-widest opacity-60">Your answer</p>
            <p className="font-display text-xl" style={{ color: "#221f30" }}>{round?.promptText}</p>
          </>
        )}
      </TapedLabel>
      <textarea
        className="panel-paper w-full resize-none rounded-xl border-2 border-[#221f30] p-3 font-hand text-xl"
        style={{ background: "var(--cream)", color: "#221f30", minHeight: 90 }}
        placeholder={round?.mode === "fill_blank" ? "…" : "Type your answer"}
        value={text}
        maxLength={120}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <RoughButton onClick={submit} disabled={busy || !text.trim()} className="w-full py-3 text-xl">
        {busy ? "Submitting…" : "Submit"}
      </RoughButton>
    </div>
  );
}

export function GtpGuessPanel({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const { session, players, me } = state;
  const guessing = session!.payload.gtpGuessing;
  const round = session!.payload.gtpRound;
  const myId = me?.playerId;
  const myGuess = me?.myGtpGuess;

  // Find whose answer is being guessed (author is hidden until reveal)
  // We don't know the authorId on the client, just show all players except self
  async function guess(targetId: string) {
    if (myGuess) return;
    await sendAction(code, { type: "GUESS_GTP_PLAYER", playerId: targetId }, token);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-hand text-center text-lg opacity-80">
        Answer {(round?.answerIndex ?? 0) + 1} of {round?.totalAnswers}
      </p>
      <TapedLabel tilt={-1} color="var(--cream)" className="text-center mb-2">
        <p className="font-display text-xl" style={{ color: "#221f30" }}>
          &ldquo;{guessing?.answerText}&rdquo;
        </p>
      </TapedLabel>
      <p className="font-hand text-center text-base opacity-70">Who wrote this?</p>
      <div className="grid grid-cols-2 gap-3">
        {players
          .filter((p) => p.id !== myId)
          .map((p) => {
            const chosen = myGuess === p.id;
            return (
              <button
                key={p.id}
                onClick={() => void guess(p.id)}
                disabled={!!myGuess}
                className="panel-paper panel-grain flex flex-col items-center gap-1 p-3 transition active:scale-95"
                style={{
                  background: chosen ? "var(--mustard)" : "var(--cream)",
                  border: chosen ? "3px solid #221f30" : "2px solid #221f30",
                }}
              >
                <Mascot avatarId={p.avatarId} size={38} animate={false} />
                <span className="font-hand text-sm" style={{ color: "#221f30" }}>{p.username}</span>
              </button>
            );
          })}
      </div>
      {myGuess && <p className="font-hand text-center text-base opacity-70">Waiting for reveal…</p>}
    </div>
  );
}

export function GtpRevealPanel({ state }: { state: RoomStateResponse }) {
  const { session, players, me } = state;
  const reveal = session!.payload.gtpReveal;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const author = players.find((p) => p.id === reveal.answerPlayerId);
  const iCorrect = reveal.correctGuesserIds.includes(me?.playerId ?? "");
  const iAmAuthor = me?.playerId === reveal.answerPlayerId;
  const fooledCount = reveal.guesses.filter((g) => g.guessedId !== reveal.answerPlayerId).length;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-hand text-xl opacity-80">Written by…</p>
      {author && <Mascot avatarId={author.avatarId} size={72} expression="correct" />}
      <Stamp color="green" size="lg">{author?.username ?? "?"}</Stamp>
      {iAmAuthor ? (
        <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>
          {fooledCount > 0 ? `+${fooledCount * 50} pts for fooling ${fooledCount}!` : "Nobody fooled 😅"}
        </p>
      ) : iCorrect ? (
        <Stamp color="green" size="lg">+{reveal.guesserPoints} pts!</Stamp>
      ) : (
        <p className="font-hand text-lg opacity-70">Didn&apos;t get it this time!</p>
      )}
    </div>
  );
}
