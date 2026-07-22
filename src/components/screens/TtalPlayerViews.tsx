"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { sendAction } from "@/lib/gameClient";
import { LIMITS } from "@/lib/constants";
import type { RoomStateResponse } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { oddLabel } from "./TtalMainViews";

const LETTERS = ["A", "B", "C"];

// Phone: write your two truths and a lie (or two lies and a truth). The slots
// are fixed, the form tells you which ones are truths and which is the lie -
// and the server shuffles them before anyone else sees them.
export function TtalStatementForm({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const twoLies = state.session?.settings.variation === "two_lies";
  const [statements, setStatements] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = twoLies
    ? [
        { label: "The truth", hint: "something true about you…", odd: true },
        { label: "Lie #1", hint: "make it believable…", odd: false },
        { label: "Lie #2", hint: "another convincing lie…", odd: false },
      ]
    : [
        { label: "Truth #1", hint: "something true about you…", odd: false },
        { label: "Truth #2", hint: "another true one…", odd: false },
        { label: "The lie", hint: "make it believable…", odd: true },
      ];

  if (state.me?.hasSubmitted) {
    const submitted = new Set(state.ttal?.submittedPlayerIds ?? []);
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-3xl uppercase">You&apos;re in!</p>
        <p className="font-hand animate-pulse text-xl text-muted-foreground">
          Waiting for the others… {submitted.size} of {state.players.length} ready
        </p>
      </div>
    );
  }

  const ready = statements.every((s) => s.trim().length >= 3);

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(
        code,
        { type: "SUBMIT_STATEMENTS", statements: statements.map((s) => s.trim()) },
        token
      );
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-display text-2xl uppercase tracking-wide">
          {twoLies ? "Two lies and a truth" : "Two truths and a lie"}
        </p>
        <p className="font-hand text-lg text-muted-foreground">
          {twoLies
            ? "Write one truth and two lies, they'll be shuffled before anyone sees them."
            : "Write two truths and one lie, they'll be shuffled before anyone sees them."}
        </p>
      </div>

      {slots.map((slot, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span
            className="font-score self-start px-2 py-0.5 text-xs uppercase tracking-[0.2em]"
            style={
              slot.odd
                ? { background: "var(--mustard)", color: "#221f30" }
                : { background: "var(--teal)", color: "var(--cream)" }
            }
          >
            {slot.label}
          </span>
          <textarea
            value={statements[i]}
            onChange={(e) => {
              const next = [...statements];
              next[i] = e.target.value;
              setStatements(next);
            }}
            maxLength={LIMITS.statementMaxLength}
            rows={2}
            placeholder={slot.hint}
            className="panel-paper font-hand w-full resize-none bg-card p-3 text-xl leading-snug outline-none placeholder:opacity-40"
          />
        </div>
      ))}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <Button size="lg" className="h-14 text-lg font-bold" disabled={!ready || busy} onClick={submit}>
        {busy ? "Sending…" : "Lock them in"}
      </Button>
    </div>
  );
}

// Phone: vote for the odd statement (or wait if you're the subject).
export function TtalVotePanel({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const session = state.session!;
  const round = session.payload.ttalRound;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!round) return null;

  const isSubject = state.me?.playerId === round.subjectId;
  const myVote = state.me?.myVoteStatementId ?? null;

  if (isSubject) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.p
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="font-display text-3xl uppercase"
        >
          All eyes on you
        </motion.p>
        <p className="font-hand text-xl text-muted-foreground">
          Everyone&apos;s trying to spot your {oddLabel(state)}. Keep a straight face!
        </p>
      </div>
    );
  }

  async function vote(statementId: string) {
    if (busy || myVote) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, { type: "CAST_VOTE", statementId }, token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-center text-2xl uppercase tracking-wide">
        Which one is the {oddLabel(state)}?
      </p>
      {round.statements.map((s, i) => (
        <button
          key={s.id}
          disabled={busy || Boolean(myVote)}
          onClick={() => vote(s.id)}
          className={cn(
            "panel-paper panel-grain flex items-center gap-3 p-4 text-left transition active:translate-y-1",
            myVote && myVote !== s.id && "opacity-50 saturate-50"
          )}
          style={{ background: myVote === s.id ? "var(--mustard)" : "var(--cream)" }}
        >
          <span
            className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-[#221f30] pt-0.5 text-lg"
            style={{ background: "var(--teal)", color: "var(--cream)" }}
          >
            {LETTERS[i]}
          </span>
          <span className="font-hand text-xl leading-snug" style={{ color: "#221f30" }}>
            {s.text}
          </span>
        </button>
      ))}
      {myVote && (
        <p className="font-hand animate-pulse text-center text-lg text-muted-foreground">
          Vote locked in, waiting for the others…
        </p>
      )}
      {error && <p className="font-hand text-center text-lg text-destructive">{error}</p>}
    </div>
  );
}

// Phone: pacing controls for a selected player-host (self mode). They play
// like everyone else, these buttons render below their normal game view and
// replace the main screen's Reveal/Scoreboard/Next round buttons.
export function TtalHostControls({
  code,
  token,
  state,
}: {
  code: string;
  token: string;
  state: RoomStateResponse;
}) {
  const session = state.session!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: { type: "REVEAL_ROUND" | "SHOW_SCOREBOARD" | "NEXT_ROUND" }) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, action, token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  let button: React.ReactNode = null;
  if (session.state === "VOTING" && (state.ttal?.votesIn ?? 0) > 0) {
    const allIn = (state.ttal?.votesIn ?? 0) >= (state.ttal?.votersNeeded ?? Infinity);
    // the server reveals on its own once every vote is in
    if (!allIn) {
      button = (
        <Button variant="outline" disabled={busy} onClick={() => act({ type: "REVEAL_ROUND" })}>
          Reveal now ({state.ttal?.votesIn} of {state.ttal?.votersNeeded} votes in)
        </Button>
      );
    }
  } else if (session.state === "REVEAL") {
    const isLast = session.questionIndex + 1 >= session.questionCount;
    button = (
      <Button size="lg" className="font-bold" disabled={busy} onClick={() => act({ type: "SHOW_SCOREBOARD" })}>
        {isLast ? "Final results" : "Show scoreboard"}
      </Button>
    );
  } else if (session.state === "SCOREBOARD") {
    button = (
      <Button size="lg" className="font-bold" disabled={busy} onClick={() => act({ type: "NEXT_ROUND" })}>
        Next round!
      </Button>
    );
  }
  if (!button) return null;

  const section = (
    <div className="mt-8 flex flex-col items-center gap-2">
      <p className="font-score text-[10px] uppercase tracking-[0.3em] opacity-50">host controls</p>
      {button}
      {error && <p className="font-hand text-center text-lg text-destructive">{error}</p>}
    </div>
  );
  // during REVEAL the whole section stays hidden until the unveil has played
  // (the reveal panel above already shows the "eyes on the big screen" hold)
  return session.state === "REVEAL" ? <HoldForUnveil>{section}</HoldForUnveil> : section;
}

// How long the main screen's staged unveil takes: 900ms first beat + 6 more
// 1200ms beats (voters + badge for 3 statements), then ~2s of points raining
// into the subject's avatar. Phones sit on their hands until it's over.
const UNVEIL_MS = 10_000;

function useUnveilDone(): boolean {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), UNVEIL_MS);
    return () => clearTimeout(timer);
  }, []);
  return done;
}

function HoldForUnveil({ children }: { children: React.ReactNode }) {
  const unveiled = useUnveilDone();
  return unveiled ? <>{children}</> : null;
}

// Phone: your round result, held back until the main screen's staged unveil
// has finished, so nobody's phone spoils the reveal.
export function TtalRevealPanel({ state }: { state: RoomStateResponse }) {
  const unveiled = useUnveilDone();
  const session = state.session!;
  const round = session.payload.ttalRound;
  const reveal = session.payload.ttalReveal;
  if (!round || !reveal) return null;

  if (!unveiled) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.p
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="font-display text-3xl uppercase"
        >
          The truth comes out…
        </motion.p>
        <p className="font-hand animate-pulse text-xl text-muted-foreground">
          Eyes on the big screen!
        </p>
      </div>
    );
  }

  const me = state.me?.playerId;
  const isSubject = me === round.subjectId;
  const oddText = round.statements.find((s) => s.id === reveal.oddStatementId)?.text;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {isSubject ? (
        reveal.subjectPoints > 0 ? (
          <p className="font-display text-3xl uppercase" style={{ color: "var(--mustard)" }}>
            You fooled {reveal.fooledVoterIds.length}! +{reveal.subjectPoints}
          </p>
        ) : (
          <p className="font-display text-2xl uppercase text-muted-foreground">
            They all saw right through you…
          </p>
        )
      ) : reveal.correctVoterIds.includes(me ?? "") ? (
        <p className="font-display text-3xl uppercase" style={{ color: "#a9d18e" }}>
          You caught the {oddLabel(state)}! +{reveal.guesserPoints}
        </p>
      ) : reveal.fooledVoterIds.includes(me ?? "") ? (
        <p className="font-display text-3xl uppercase text-destructive">Fooled!</p>
      ) : (
        <p className="font-hand text-xl text-muted-foreground">No vote this round</p>
      )}
      <div className="panel-paper panel-grain px-5 py-3" style={{ background: "var(--mustard)" }}>
        <p className="font-score text-xs uppercase tracking-[0.25em]" style={{ color: "#8a2f24" }}>
          the {oddLabel(state)}
        </p>
        <p className="font-hand text-2xl leading-snug" style={{ color: "#221f30" }}>
          {oddText}
        </p>
      </div>
    </div>
  );
}
