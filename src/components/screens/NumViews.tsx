"use client";

import { PhaseTimerBar } from "@/components/cartoon/TimerBar";
import { DoneCheck } from "@/components/cartoon/DoneCheck";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Panel } from "@/components/cartoon/Panel";
import { Stamp } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot } from "@/components/cartoon/Mascot";
import { sendAction } from "@/lib/gameClient";
import { cn } from "@/lib/utils";
import type { RoomStateResponse, GameAction } from "@/lib/game/types";

const pop = { type: "spring", stiffness: 420, damping: 26 } as const;

// ── Shared prop: the theme card with its 1–10 ruler ──────────────────────────
// The lead of every Number Crunch screen, also drawn by the tutorial demo.

export type ScaleMarker = { n: number; label: string; tone?: "ink" | "mustard" | "teal" | "tomato" };

export function NumScale({
  theme,
  low,
  high,
  size = "lg",
  markers = [],
  pointer,
  className,
}: {
  theme: string;
  low: string;
  high: string;
  size?: "lg" | "md";
  markers?: ScaleMarker[];
  /** live slider: the guesser's mascot riding a triangle above the ruler */
  pointer?: { n: number; avatarId: string };
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <Panel tape tilt={-0.5} className={cn("w-full px-6 pb-6 pt-7 text-center md:px-10", lg ? "max-w-4xl" : "max-w-3xl", className)}>
      <p className={cn("font-display uppercase leading-[0.95]", lg ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl")} style={{ color: "var(--ink)" }}>
        {theme}
      </p>
      <div className={cn("relative", pointer ? "mt-24" : markers.length ? "mt-16" : "mt-5")}>
        {pointer && (
          <motion.div
            aria-hidden
            initial={false}
            animate={{ left: `${(pointer.n - 0.5) * 10}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute bottom-full mb-1 flex -translate-x-1/2 flex-col items-center"
          >
            <Mascot avatarId={pointer.avatarId} size={60} animate={false} />
            <span className="h-0 w-0 border-x-[13px] border-t-[16px] border-x-transparent" style={{ borderTopColor: "var(--ink)" }} />
          </motion.div>
        )}
        {markers.map((m, i) => (
          <motion.span
            key={`${m.label}-${i}`}
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1, left: `${(m.n - 0.5) * 10}%` }}
            transition={{ ...pop, delay: i * 0.06 }}
            className="font-hand absolute -top-14 -translate-x-1/2 whitespace-nowrap rounded-lg border-[3px] px-3 py-1 text-lg leading-tight"
            style={{
              borderColor: "var(--ink)",
              background: m.tone === "tomato" ? "var(--tomato)" : m.tone === "teal" ? "var(--teal)" : m.tone === "ink" ? "var(--ink)" : "var(--mustard)",
              color: m.tone === "ink" ? "var(--cream)" : "var(--ink)",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            {m.label}
          </motion.span>
        ))}
        <div className="grid grid-cols-10 overflow-hidden rounded-lg border-[3px]" style={{ borderColor: "var(--ink)" }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={cn("font-score tabular-nums [&:not(:first-child)]:border-l-[3px]", lg ? "py-2 text-2xl" : "py-1 text-lg")}
              style={{ borderColor: "var(--ink)", background: i % 2 ? "var(--paper)" : "var(--card-white)", color: "var(--ink)" }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-6">
        <span className="font-hand text-left text-lg leading-tight md:text-xl" style={{ color: "var(--ink-body)" }}>
          {low}
        </span>
        <span className="font-hand text-right text-lg leading-tight md:text-xl" style={{ color: "var(--ink-body)" }}>
          {high}
        </span>
      </div>
    </Panel>
  );
}

/** Who's guessing: mascot on a nameplate, sits above the lead. */
function GuesserTag({ avatarId, name, line }: { avatarId?: string; name?: string; line: string }) {
  return (
    <div className="flex items-center gap-3">
      {avatarId && <Mascot avatarId={avatarId} size={64} animate={false} />}
      <div className="nameplate px-4 py-1.5">
        <span className="font-score block text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
          {line}
        </span>
        <span className="font-display text-2xl" style={{ color: "var(--mustard)" }}>
          {name ?? "Someone"}
        </span>
      </div>
    </div>
  );
}

/** Quiet owner control for a stalled round: never competes with the lead. */
function QuietButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-score min-h-11 rounded-lg border-2 px-4 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-[var(--ink-soft)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
      style={{ borderColor: "var(--cream-muted)", color: "var(--cream)" }}
    >
      {children}
    </button>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function NumSubmittingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const { session, players, num } = state;
  const round = session!.payload.numRound;
  if (!round) return null;

  const submittedIds = new Set(num?.submittedExampleIds ?? []);
  const guesser = players.find((p) => p.id === round.guesserPlayerId);
  const writers = players.filter((p) => p.id !== round.guesserPlayerId);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <GuesserTag avatarId={guesser?.avatarId} name={guesser?.username} line="the guesser" />
      <NumScale theme={round.theme} low={round.scaleLow} high={round.scaleHigh} />
      <PhaseTimerBar state={state} />

      <div className="flex flex-col items-center gap-4">
        <p className="font-hand text-2xl" style={{ color: "var(--cream-muted)" }}>
          Everyone else: check your secret number and write something that fits it.
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          {writers.map((p) => {
            const done = submittedIds.has(p.id);
            return (
              <div key={p.id} className="relative flex flex-col items-center gap-1">
                <Mascot avatarId={p.avatarId} size={52} animate={false} className={done ? undefined : "saturate-50"} />
                <span className="font-hand text-lg" style={{ color: done ? "var(--cream)" : "var(--cream-muted)" }}>
                  {p.username}
                </span>
                {done && <DoneCheck />}
              </div>
            );
          })}
        </div>
      </div>

      {isOwner && session!.hostMode === "self" && (
        <QuietButton onClick={() => act({ type: "REVEAL_ROUND" })}>Stop waiting, start guessing</QuietButton>
      )}
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
  const live = guessing.live;
  const active = guessing.examples.find((ex) => ex.playerId === live?.activeId);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <GuesserTag avatarId={guesser?.avatarId} name={guesser?.username} line="is placing these" />
      <NumScale
        theme={round.theme}
        low={round.scaleLow}
        high={round.scaleHigh}
        size="md"
        pointer={active && live && guesser ? { n: live.guesses[active.playerId], avatarId: guesser.avatarId } : undefined}
      />
      <PhaseTimerBar state={state} />

      {/* authors stay hidden until the reveal: the guesser can see this screen */}
      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {guessing.examples.map((ex, i) => {
          const placed = live?.guesses[ex.playerId];
          const isActive = ex.playerId === live?.activeId;
          return (
            <motion.div key={ex.playerId} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: isActive ? 1.03 : 1 }} transition={{ ...pop, delay: Math.min(i, 5) * 0.06 }} className="relative">
              <div
                className="panel-paper flex min-h-24 items-center justify-center px-6 py-4 text-center"
                style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)`, outline: isActive ? "4px solid var(--mustard)" : undefined, outlineOffset: 3 }}
              >
                <p className="font-hand text-3xl leading-tight" style={{ color: "var(--ink)" }}>
                  &ldquo;{ex.exampleText}&rdquo;
                </p>
              </div>
              {placed !== undefined && (
                <motion.span
                  key={placed}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  className="font-display absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-[3px] text-2xl tabular-nums"
                  style={{ borderColor: "var(--ink)", background: isActive ? "var(--mustard)" : "var(--ink)", color: isActive ? "var(--ink)" : "var(--cream)", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
                >
                  {placed}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {isOwner && session!.hostMode === "self" && (
        <QuietButton onClick={() => act({ type: "REVEAL_ROUND" })}>Reveal now</QuietButton>
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
      <div className="flex items-center gap-4">
        <GuesserTag avatarId={guesser?.avatarId} name={guesser?.username} line={`${reveal.theme} · guesses`} />
        <Stamp color="green" size="md">
          +{reveal.guesserPoints} accuracy
        </Stamp>
      </div>

      <div className="flex w-full max-w-4xl flex-col gap-3">
        {reveal.examples.map((ex, i) => (
          <RevealRow key={ex.playerId} index={i} ex={ex} author={players.find((p) => p.id === ex.playerId)} />
        ))}
      </div>

      {isOwner && session!.hostMode === "self" && (
        <RoughButton onClick={() => act({ type: "NEXT_ROUND" })} className="mt-2 px-10 py-3 text-2xl">
          {isLast ? "Final scores" : "Next round"}
        </RoughButton>
      )}
    </div>
  );
}

/** One revealed example: what they wrote, guessed vs actual, and the payout. */
export function RevealRow({
  index,
  ex,
  author,
}: {
  index: number;
  ex: { exampleText: string; actualNumber: number; guessedNumber: number | null; points: number };
  author?: { avatarId: string; username: string };
}) {
  const diff = ex.guessedNumber !== null ? Math.abs(ex.actualNumber - ex.guessedNumber) : null;
  const verdict = diff === 0 ? "Exact!" : ex.points > 0 ? `Off by ${diff}` : diff === null ? "No guess" : "Yikes";
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...pop, delay: Math.min(index, 5) * 0.06 }}>
      <div className="panel-paper flex items-center gap-4 px-5 py-3">
        {author && <Mascot avatarId={author.avatarId} size={48} animate={false} />}
        <div className="min-w-0 flex-1">
          <p className="font-hand truncate text-2xl leading-tight" style={{ color: "var(--ink)" }}>
            &ldquo;{ex.exampleText}&rdquo;
          </p>
          {author && (
            <p className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
              {author.username}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums">
          <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>guess</span>
          <span className="font-display text-3xl" style={{ color: "var(--ink-body)" }}>{ex.guessedNumber ?? "–"}</span>
          <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>was</span>
          <span className="font-display text-4xl" style={{ color: "var(--ink)" }}>{ex.actualNumber}</span>
        </div>
        <span
          className="chip w-28 justify-center"
          style={ex.points > 0 ? { background: diff === 0 ? "var(--teal)" : "var(--mustard)", color: "var(--ink)" } : undefined}
        >
          {ex.points > 0 ? `+${ex.points}` : verdict}
        </span>
      </div>
    </motion.div>
  );
}

// ── Player phone ──────────────────────────────────────────────────────────────

function PhoneTheme({ theme, low, high }: { theme?: string; low?: string; high?: string }) {
  return (
    <div className="panel-paper px-4 py-3 text-center">
      <p className="font-display text-2xl uppercase leading-tight" style={{ color: "var(--ink)" }}>{theme}</p>
      <p className="font-hand text-base leading-snug" style={{ color: "var(--ink-body)" }}>
        1 = {low} · 10 = {high}
      </p>
    </div>
  );
}

function PhoneError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="font-hand text-center text-lg" style={{ color: "var(--coral)" }}>
      {error}
    </p>
  );
}

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
    const avatarId = state.players.find((p) => p.id === me?.playerId)?.avatarId ?? "";
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot avatarId={avatarId} expression="buzzed" size={110} />
        <p className="font-display text-4xl uppercase leading-tight" style={{ color: "var(--mustard)" }}>
          You&apos;re the guesser
        </p>
        <PhoneTheme theme={round?.theme} low={round?.scaleLow} high={round?.scaleHigh} />
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>
          Everyone&apos;s writing hints for you. Look innocent.
        </p>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">Locked in</Stamp>
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>Poker face. Waiting on the others…</p>
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
    <div className="flex flex-col gap-5">
      <PhoneTheme theme={round?.theme} low={round?.scaleLow} high={round?.scaleHigh} />

      <Panel tilt={-1} className="mx-auto flex w-40 flex-col items-center gap-1 px-4 pb-3 pt-3">
        <p className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
          Your secret number
        </p>
        {/* Luckiest Guy's caps overflow a tight line box, so give it room */}
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }} className="font-display pt-2 text-7xl leading-[1.1] tabular-nums" style={{ color: "var(--ink)" }}>
          {myNumber ?? "?"}
        </motion.span>
      </Panel>

      <label className="flex flex-col gap-2">
        <span className="font-hand text-lg" style={{ color: "var(--cream)" }}>
          What&apos;s a {myNumber ?? "?"} for &ldquo;{round?.theme}&rdquo;?
        </span>
        <textarea
          className="font-hand w-full resize-none rounded-xl border-[3px] p-3 text-xl focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
          style={{ background: "var(--card-white)", color: "var(--ink)", borderColor: "var(--ink)", minHeight: 88 }}
          placeholder="Be clever, not obvious"
          value={example}
          maxLength={80}
          aria-invalid={Boolean(error)}
          onChange={(e) => setExample(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
        />
      </label>
      <PhoneError error={error} />
      <RoughButton onClick={submit} disabled={busy || !example.trim()} className="w-full py-3.5 text-2xl">
        {busy ? "Sending…" : "Send it"}
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
  // Live mirror for the big screen: one request in flight, newest position wins,
  // at most one every 500ms (the action route allows 30 per 10s per player).
  const draft = useRef<{ next: { playerId: string; number: number } | null; busy: boolean }>({ next: null, busy: false });

  function sendDraft(playerId: string, number: number) {
    draft.current.next = { playerId, number };
    if (draft.current.busy) return;
    draft.current.busy = true;
    void (async () => {
      while (draft.current.next) {
        const d = draft.current.next;
        draft.current.next = null;
        await Promise.all([
          sendAction(code, { type: "DRAFT_NUM_GUESS", ...d }, token).catch(() => {}),
          new Promise((r) => setTimeout(r, 500)),
        ]);
      }
      draft.current.busy = false;
    })();
  }

  if (!isGuesser) {
    const name = players.find((p) => p.id === round?.guesserPlayerId)?.username ?? "The guesser";
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-3xl uppercase" style={{ color: "var(--cream)" }}>Hands off</p>
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>
          {name} is placing everyone&apos;s examples. No hints. No eyebrows.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">Guesses in</Stamp>
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>Eyes on the big screen…</p>
      </div>
    );
  }

  if (!guessing) {
    return <p className="font-hand text-center text-xl" style={{ color: "var(--cream-muted)" }}>Loading examples…</p>;
  }

  const placed = guessing.examples.filter((ex) => guesses[ex.playerId] !== undefined).length;
  const allGuessed = placed === guessing.examples.length;

  async function submit() {
    if (busy || !allGuessed) return;
    setBusy(true);
    setError(null);
    try {
      const guessList = guessing!.examples.map((ex) => ({ playerId: ex.playerId, number: guesses[ex.playerId] }));
      await sendAction(code, { type: "SUBMIT_NUM_GUESSES", guesses: guessList }, token);
      setSubmitted(true);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PhoneTheme theme={round?.theme} low={round?.scaleLow} high={round?.scaleHigh} />

      <div className="flex flex-col gap-3">
        {guessing.examples.map((ex) => {
          const val = guesses[ex.playerId];
          return (
            <div key={ex.playerId} className="panel-paper p-3">
              <p className="font-hand text-xl leading-snug" style={{ color: "var(--ink)" }}>&ldquo;{ex.exampleText}&rdquo;</p>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={val ?? 5}
                  aria-label={`Number for ${ex.exampleText}`}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setGuesses((prev) => ({ ...prev, [ex.playerId]: n }));
                    sendDraft(ex.playerId, n);
                  }}
                  className="h-11 flex-1 accent-[var(--ink)]"
                />
                <span
                  className="font-display flex h-11 w-12 items-center justify-center rounded-lg border-[3px] text-2xl tabular-nums"
                  style={{ borderColor: "var(--ink)", background: val ? "var(--ink)" : "var(--card-white)", color: val ? "var(--cream)" : "var(--ink-label)" }}
                >
                  {val ?? "–"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <PhoneError error={error} />
      <RoughButton onClick={submit} disabled={busy || !allGuessed} className="w-full py-3.5 text-2xl">
        {busy ? "Locking in…" : allGuessed ? "Lock in guesses" : `${placed}/${guessing.examples.length} placed`}
      </RoughButton>
    </div>
  );
}

export function NumRevealPhone({ state }: { state: RoomStateResponse }) {
  const { session, me } = state;
  const reveal = session!.payload.numReveal;
  if (!reveal) return <p className="font-hand text-center text-xl" style={{ color: "var(--cream-muted)" }}>Revealing…</p>;

  const isGuesser = me?.playerId === reveal.guesserPlayerId;
  const myExample = reveal.examples.find((e) => e.playerId === me?.playerId);

  if (isGuesser) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Stamp color="green" size="lg">+{reveal.guesserPoints} pts</Stamp>
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>Your accuracy bonus. Full damage report on the big screen.</p>
      </div>
    );
  }

  if (myExample) {
    const diff = myExample.guessedNumber !== null ? Math.abs(myExample.actualNumber - myExample.guessedNumber) : null;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-hand text-2xl" style={{ color: "var(--cream)" }}>
          You were a {myExample.actualNumber}. They said {myExample.guessedNumber ?? "nothing"}.
        </p>
        {myExample.points > 0 ? (
          <Stamp color="green" size="lg">+{myExample.points} pts</Stamp>
        ) : (
          <Stamp color="red" size="md">{diff === null ? "No guess" : `Off by ${diff}`}</Stamp>
        )}
      </div>
    );
  }

  return null;
}
