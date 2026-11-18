"use client";

import { useState } from "react";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp, StampPop } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { PhaseTimerBar } from "@/components/cartoon/TimerBar";
import { sendAction } from "@/lib/gameClient";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

// ── Main screen ───────────────────────────────────────────────────────────────

export function CharadesActingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const round = session!.payload.charadesRound;
  if (!round) return null;
  const actor = players.find((p) => p.id === round.actorId);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        {actor && <Mascot avatarId={actor.avatarId} size={80} expression="buzzed" />}
        <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">Acting out</p>
        <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>{actor?.username}</p>
      </div>

      <Panel tape tilt={-0.5} className="px-10 py-5 text-center">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Category</p>
        <p className="font-display text-4xl" style={{ color: "#221f30" }}>{round.category}</p>
        <p className="font-hand mt-1 text-lg opacity-70">No speaking allowed!</p>
      </Panel>

      <PhaseTimerBar state={state} />

      <p className="font-hand text-xl opacity-70">Guesses coming in on phones…</p>

      {isOwner && (
        <RoughButton onClick={() => act({ type: "REVEAL_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          Time&apos;s up →
        </RoughButton>
      )}
    </div>
  );
}

export function CharadesRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players } = state;
  const reveal = session!.payload.charadesReveal;
  if (!reveal) return null;

  const actor = players.find((p) => p.id === reveal.actorId);
  const winner = reveal.winnerId ? players.find((p) => p.id === reveal.winnerId) : null;
  const isLast = session!.questionIndex + 1 >= session!.questionCount;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TapedLabel tilt={-0.5} color="var(--mustard)" className="text-center">
        <p className="font-score text-xs uppercase tracking-widest opacity-60">The word was…</p>
        <p className="font-display text-5xl" style={{ color: "#221f30" }}>{reveal.word}</p>
      </TapedLabel>

      <div className="flex gap-8">
        <div className="flex flex-col items-center gap-1">
          {actor && <Mascot avatarId={actor.avatarId} size={64} expression={winner ? "correct" : "incorrect"} />}
          <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{actor?.username}</span>
          {winner && <Stamp color="green" size="md">+{reveal.actorPoints}</Stamp>}
        </div>
        {winner && (
          <div className="flex flex-col items-center gap-1">
            <Mascot avatarId={winner.avatarId} size={64} expression="correct" />
            <span className="font-hand text-sm" style={{ color: "var(--cream)" }}>{winner.username}</span>
            <Stamp color="green" size="md">+{reveal.guesserPoints}</Stamp>
          </div>
        )}
      </div>

      {winner ? (
        <StampPop color="green">{winner.username} guessed it!</StampPop>
      ) : (
        <StampPop color="red">Nobody guessed in time!</StampPop>
      )}

      {isOwner && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-8 py-3 text-xl">
          {isLast ? "Final scores →" : "Next round →"}
        </RoughButton>
      )}
    </div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

export function CharadesActPhone({ state }: { state: RoomStateResponse }) {
  const { session, me } = state;
  const round = session!.payload.charadesRound;
  const charadesWord = me?.charadesWord;

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Stamp color="green" size="lg">You&apos;re acting!</Stamp>

      {charadesWord ? (
        <TapedLabel tilt={-1.5} color="var(--mustard)" className="text-center">
          <p className="font-score text-xs uppercase tracking-widest opacity-60">Your word</p>
          <p className="font-display text-5xl leading-tight" style={{ color: "#221f30" }}>{charadesWord}</p>
          <p className="font-hand text-base opacity-60">{round?.category}</p>
        </TapedLabel>
      ) : (
        <p className="font-hand text-xl opacity-70">Loading your word…</p>
      )}

      <p className="font-hand text-xl opacity-80">Act it out, no talking!</p>
    </div>
  );
}

export function CharadesGuessPhone({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const round = state.session!.payload.charadesRound;
  const { players, me } = state;
  const actor = players.find((p) => p.id === round?.actorId);
  const amActor = me?.playerId === round?.actorId;
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  if (amActor) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {actor && <Mascot avatarId={actor.avatarId} size={72} expression="buzzed" />}
        <p className="font-display text-3xl uppercase">Act it out!</p>
        <p className="font-hand text-xl opacity-70">No speaking, let them guess!</p>
      </div>
    );
  }

  async function submitGuess() {
    if (busy || !guess.trim()) return;
    setBusy(true);
    const g = guess.trim();
    setGuess("");
    setLast(g);
    try {
      await sendAction(code, { type: "SUBMIT_CHARADES_GUESS", text: g }, token);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        {actor && <Mascot avatarId={actor.avatarId} size={64} expression="buzzed" />}
        <p className="font-score text-xs uppercase tracking-widest opacity-60">Category: {round?.category}</p>
      </div>

      {last && (
        <p className="font-hand text-center text-base opacity-60">Last guess: &ldquo;{last}&rdquo;</p>
      )}

      <input
        className="panel-paper w-full rounded-xl border-2 border-[#221f30] p-3 font-hand text-2xl"
        style={{ background: "var(--cream)", color: "#221f30" }}
        placeholder="Type your guess…"
        value={guess}
        maxLength={60}
        autoCapitalize="off"
        autoComplete="off"
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submitGuess(); } }}
      />
      <RoughButton onClick={submitGuess} disabled={busy || !guess.trim()} className="w-full py-3 text-xl">
        Guess!
      </RoughButton>
    </div>
  );
}

export function CharadesRevealPhone({ state }: { state: RoomStateResponse }) {
  const { session, players, me } = state;
  const reveal = session!.payload.charadesReveal;
  if (!reveal) return <p className="font-hand text-center text-xl opacity-70">Revealing…</p>;

  const iWinner = me?.playerId === reveal.winnerId;
  const iActor = me?.playerId === reveal.actorId;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-score text-sm uppercase tracking-[0.3em] opacity-60">The word was…</p>
      <Stamp color="green" size="lg">{reveal.word}</Stamp>
      {iWinner && (
        <p className="font-display text-4xl" style={{ color: "var(--mustard)" }}>
          You got it! +{reveal.guesserPoints} pts!
        </p>
      )}
      {iActor && reveal.winnerId && (
        <p className="font-display text-3xl" style={{ color: "var(--mustard)" }}>
          They guessed it! +{reveal.actorPoints} pts!
        </p>
      )}
      {iActor && !reveal.winnerId && (
        <p className="font-hand text-xl opacity-70">Nobody guessed in time</p>
      )}
      {!iWinner && !iActor && (
        <p className="font-hand text-xl opacity-70">
          {reveal.winnerId
            ? `${players.find((p) => p.id === reveal.winnerId)?.username} got it first!`
            : "Nobody got it this round!"}
        </p>
      )}
    </div>
  );
}
