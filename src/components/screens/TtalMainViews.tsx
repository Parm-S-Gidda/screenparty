"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "@/components/game/AvatarBadge";
import { playSfx, preloadSfx } from "@/lib/sfx";
import type { GameAction, RoomStateResponse } from "@/lib/game/types";
import { cn } from "@/lib/utils";

// Two Truths and a Lie, main screen views.

const LETTERS = ["A", "B", "C"];

export function oddLabel(state: RoomStateResponse, capital = false): string {
  const twoLies = state.session?.settings.variation === "two_lies";
  const word = twoLies ? "truth" : "lie";
  return capital ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

export function TtalCollectingView({ state }: { state: RoomStateResponse }) {
  const submitted = new Set(state.ttal?.submittedPlayerIds ?? []);
  const twoLies = state.session?.settings.variation === "two_lies";
  const rounds = state.session?.settings.rounds ?? 1;
  const turnsPerRound = rounds > 0 ? (state.session?.questionCount ?? 0) / rounds : 0;
  const roundNumber =
    turnsPerRound > 0 ? Math.floor((state.session?.questionIndex ?? 0) / turnsPerRound) + 1 : 1;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="text-center">
        {rounds > 1 && (
          <p className="font-score text-lg uppercase tracking-[0.3em] text-muted-foreground">
            Round {roundNumber} of {rounds}
          </p>
        )}
        <h2 className="font-display text-4xl uppercase tracking-wide md:text-5xl">
          Write {twoLies ? "two lies and a truth" : "two truths and a lie"}!
        </h2>
        <p className="font-hand mt-2 text-2xl text-muted-foreground">
          Everyone scribbles their statements on their phones…
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {state.players.map((p) => (
          <div key={p.id} className="flex w-24 flex-col items-center gap-2">
            <div className="relative">
              <AvatarBadge avatarId={p.avatarId} size="lg" className={cn(!submitted.has(p.id) && "opacity-50")} />
              {submitted.has(p.id) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-white"
                >
                  ✓
                </motion.span>
              )}
            </div>
            <span className="max-w-24 truncate text-sm font-semibold">{p.username}</span>
          </div>
        ))}
      </div>
      <p className="font-hand animate-pulse text-2xl text-muted-foreground">
        {submitted.size} of {state.players.length} ready…
      </p>
    </div>
  );
}

export function TtalVotingView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  const round = session.payload.ttalRound;
  // decode the reveal sounds before the unveil needs them
  useEffect(() => {
    for (const name of ["hover", "correct", "error", "coin", "collect"] as const) preloadSfx(name);
  }, []);
  if (!round) return null;
  const subject = state.players.find((p) => p.id === round.subjectId);
  const ttal = state.ttal;
  // a selected player-host paces the game from their phone instead
  const hasPlayerHost = state.players.some((p) => p.isHost);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex items-center gap-6">
        <AvatarBadge avatarId={subject?.avatarId ?? ""} size="xl" expression="buzzed" />
        <div>
          <h2 className="font-display text-5xl uppercase tracking-wide md:text-6xl">
            {subject?.username}
          </h2>
          <p className="font-hand text-2xl text-muted-foreground">Which one is the {oddLabel(state)}?</p>
        </div>
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-4">
        {round.statements.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.25 }}
            className="panel-paper panel-grain flex items-center gap-4 bg-card px-6 py-4"
          >
            <span
              className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-[#221f30] pt-1 text-2xl"
              style={{ background: "var(--mustard)", color: "#221f30", boxShadow: "2px 2px 0 rgba(0,0,0,.35)" }}
            >
              {LETTERS[i]}
            </span>
            <p className="font-hand text-3xl leading-snug">{s.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <p className="font-score text-xl uppercase tracking-wider tabular-nums text-muted-foreground">
          {ttal?.votesIn ?? 0} of {ttal?.votersNeeded ?? 0} votes in
        </p>
        {isOwner && session.hostMode === "self" && !hasPlayerHost && (ttal?.votesIn ?? 0) > 0 && (
          <Button variant="outline" onClick={() => act({ type: "REVEAL_ROUND" })}>
            Reveal now
          </Button>
        )}
      </div>
    </div>
  );
}

// Staged unveil: statement by statement, first the voters' avatars pop onto a
// statement, then its border lights up and a TRUE/FALSE badge pops onto the top
// edge. The non-odd statements go first, the odd one (the lie, or the truth in
// two-lies) is saved for last.
export function TtalRevealView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (a: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  const round = session.payload.ttalRound;
  const reveal = session.payload.ttalReveal;
  const twoLies = session.settings.variation === "two_lies";

  // each statement gets two beats: voters, then the stamp
  const sequence = useMemo(() => {
    if (!round || !reveal) return [];
    const others = round.statements.map((s) => s.id).filter((id) => id !== reveal.oddStatementId);
    return [...others, reveal.oddStatementId];
  }, [round, reveal]);
  // one extra beat at the end so the last badge lands before the points show
  const totalPhases = sequence.length * 2 + 1;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (phase >= totalPhases) return;
    const timer = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 900 : 1200);
    return () => clearTimeout(timer);
  }, [phase, totalPhases]);

  // sound for each beat: avatar pops, true/false unveils, then the payouts.
  // playedPhase guards against refires when a state poll swaps object
  // identities; timers only clear on unmount so staggered pops aren't cut off.
  const playedPhase = useRef(0);
  const soundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = soundTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (!reveal || phase === 0 || playedPhase.current >= phase) return;
    // host-driven mode can jump two beats at once (verdict lands as the next
    // statement starts), so catch up on every beat we haven't played yet
    const from = playedPhase.current + 1;
    playedPhase.current = phase;
    for (let beat = from; beat <= phase; beat++) {
      if (beat <= sequence.length * 2) {
        const id = sequence[Math.floor((beat - 1) / 2)];
        if (beat % 2 === 1) {
          // voters land on this statement, one pop per avatar
          const voterCount = reveal.votes.filter((v) => v.statementId === id).length;
          for (let i = 0; i < voterCount; i++) {
            soundTimers.current.push(setTimeout(() => playSfx("hover"), i * 120));
          }
        } else {
          // the odd statement is the winning pick (the lie in two-truths, the
          // truth in two-lies), it gets the "correct" chime, the decoys buzz,
          // regardless of which badge label they carry
          playSfx(id === reveal.oddStatementId ? "correct" : "error");
        }
      } else {
        // final beat: guessers cash in, then the subject's coins rain down
        if (reveal.correctVoterIds.length > 0) {
          soundTimers.current.push(setTimeout(() => playSfx("coin"), 300));
        }
        reveal.fooledVoterIds.forEach((_, i) => {
          soundTimers.current.push(setTimeout(() => playSfx("collect"), 1000 + i * 350));
        });
      }
    }
  }, [phase, sequence, reveal]);

  if (!round || !reveal) return null;
  const subject = state.players.find((p) => p.id === round.subjectId);
  const isLast = session.questionIndex + 1 >= session.questionCount;
  const done = phase >= totalPhases;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <h2 className="font-display text-3xl uppercase tracking-wide md:text-4xl">
        {subject?.username}&apos;s results are…
      </h2>

      <div className="flex w-full max-w-3xl flex-col gap-5">
        {round.statements.map((s, i) => {
          const isOdd = s.id === reveal.oddStatementId;
          const isTrue = isOdd ? twoLies : !twoLies;
          const step = sequence.indexOf(s.id);
          const votersShown = phase > step * 2;
          const stamped = phase > step * 2 + 1;
          const voters = reveal.votes.filter((v) => v.statementId === s.id);
          const verdictColor = isTrue ? "#3e8e2f" : "#c93a2c";
          return (
            <div
              key={s.id}
              className="panel-paper panel-grain relative flex items-center gap-4 px-6 py-4"
              style={{
                background: "var(--cream)",
                borderWidth: 6,
                borderColor: stamped ? verdictColor : undefined,
                transition: "border-color 0.25s ease",
              }}
>
              <span
                className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-[#221f30] pt-1 text-2xl"
                style={{ background: "var(--mustard)", color: "#221f30", boxShadow: "2px 2px 0 rgba(0,0,0,.35)" }}
              >
                {LETTERS[i]}
              </span>
              <p className="font-hand flex-1 text-2xl leading-snug md:text-3xl" style={{ color: "#221f30" }}>
                {s.text}
              </p>
              <div className="flex min-h-9 -space-x-2">
                <AnimatePresence>
                  {votersShown &&
                    voters.map((v, vi) => {
                      const voter = state.players.find((p) => p.id === v.voterId);
                      return voter ? (
                        <motion.div
                          key={v.voterId}
                          initial={{ scale: 0, y: -12 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: vi * 0.12, type: "spring", stiffness: 400, damping: 18 }}
                        >
                          <AvatarBadge avatarId={voter.avatarId} size="sm" />
                        </motion.div>
                      ) : null;
                    })}
                </AnimatePresence>
              </div>
              {stamped && (
                // the wrapper clips the badge so it slides down from under the
                // top border (the card itself can't be overflow-hidden, the
                // points tag hangs off its corner)
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-hidden pb-1">
                  <motion.div
                    initial={{ y: "-110%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="font-display rounded-b-lg px-5 pb-1 pt-0.5 text-xl uppercase tracking-wider"
                    style={{
                      background: verdictColor,
                      color: "var(--cream)",
                      boxShadow: "2px 2px 0 rgba(0,0,0,.25)",
                    }}
                  >
                    {isTrue ? "True" : "False"}
                  </motion.div>
                </div>
              )}
              {done && isOdd && reveal.correctVoterIds.length > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: 30 }}
                  animate={{ scale: 1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.3 }}
                  className="font-score pointer-events-none absolute -right-4 -top-5 rounded-lg border-[3px] border-[#221f30] px-3 py-0.5 text-2xl tabular-nums"
                  style={{ background: "#3e8e2f", color: "var(--cream)", boxShadow: "2px 2px 0 rgba(0,0,0,.4)" }}
                >
                  +{reveal.guesserPoints}
                  {reveal.correctVoterIds.length > 1 && ` ×${reveal.correctVoterIds.length}`}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="relative">
            <AvatarBadge
              avatarId={subject?.avatarId ?? ""}
              size="md"
              expression={reveal.subjectPoints > 0 ? "correct" : "idle"}
            />
            {/* fooling points drop out of the statements into the subject */}
            {reveal.fooledVoterIds.map((id, i) => (
              <span key={id} className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
                <motion.span
                  initial={{ opacity: 0, y: -110, scale: 1 }}
                  animate={{ opacity: [0, 1, 1, 0], y: 0, scale: [1, 1, 1, 0.4] }}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.35, ease: "easeIn" }}
                  className="font-score block text-3xl tabular-nums"
                  style={{ color: "var(--mustard)", textShadow: "2px 2px 0 rgba(0,0,0,.5)" }}
                >
                  +{reveal.fooledVoterIds.length > 0 ? reveal.subjectPoints / reveal.fooledVoterIds.length : 0}
                </motion.span>
              </span>
            ))}
            {reveal.subjectPoints > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 14,
                  delay: 0.4 + reveal.fooledVoterIds.length * 0.35 + 0.6,
                }}
                className="font-score absolute -right-10 -top-2 rotate-6 rounded-lg border-[3px] border-[#221f30] px-2 py-0.5 text-xl tabular-nums"
                style={{ background: "var(--mustard)", color: "#221f30", boxShadow: "2px 2px 0 rgba(0,0,0,.4)" }}
              >
                +{reveal.subjectPoints}
              </motion.span>
            )}
          </div>
          <p className="font-hand text-xl" style={{ color: "var(--muted-foreground)" }}>
            {reveal.subjectPoints > 0
              ? `${subject?.username} fooled ${reveal.fooledVoterIds.length}!`
              : `${subject?.username} fooled no one…`}
          </p>
        </motion.div>
      )}

      {done && isOwner && session.hostMode === "self" && !state.players.some((p) => p.isHost) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Button size="lg" className="font-bold" onClick={() => act({ type: "SHOW_SCOREBOARD" })}>
            {isLast ? "Final results" : "Show scoreboard"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
