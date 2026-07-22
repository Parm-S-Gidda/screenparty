"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarBadge } from "@/components/game/AvatarBadge";
import { fetchPreview, sendAction } from "@/lib/gameClient";
import type { GameAction, RoomStateResponse } from "@/lib/game/types";

// Self-host controller (PRD §9 Self Host flow): the selected player's phone
// previews questions, displays them, and judges spoken answers.
export function HostController({
  code,
  state,
  playerToken,
}: {
  code: string;
  state: RoomStateResponse;
  playerToken?: string;
}) {
  const session = state.session!;
  const [preview, setPreview] = useState<{ index: number; text: string; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (session.state === "QUESTION_PREVIEW" || session.state === "BUZZ_OPEN" || session.state === "PLAYER_BUZZED") {
      fetchPreview(code, playerToken)
        .then((p) => {
          if (!cancelled) setPreview(p);
        })
        .catch((err) => {
          if (!cancelled) setError((err as Error).message);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [code, playerToken, session.state, session.questionIndex]);

  async function act(action: GameAction) {
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, action, playerToken);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const buzzer = state.players.find((p) => p.id === session.payload.buzz?.playerId);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="text-center">
        <p className="font-display text-2xl uppercase tracking-wide" style={{ color: "var(--mustard, #f0b429)" }}>
          You&apos;re the host!
        </p>
        <p className="font-score text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Question {session.questionIndex + 1} of {session.questionCount}
        </p>
      </div>

      {(session.state === "QUESTION_PREVIEW" ||
        session.state === "BUZZ_OPEN" ||
        session.state === "PLAYER_BUZZED") &&
        preview && (
          <Card>
            <CardContent className="pt-4">
              <p className="font-hand text-2xl leading-snug">{preview.text}</p>
              <p className="font-score mt-2 text-xs uppercase tracking-[0.2em] opacity-60">
                answer: <span className="font-display text-base normal-case tracking-normal" style={{ color: "#3e8e2f" }}>{preview.answer}</span>
              </p>
            </CardContent>
          </Card>
        )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      {session.state === "QUESTION_PREVIEW" && (
        <>
          <Button
            size="lg"
            className="h-14 text-lg font-bold"
            disabled={busy}
            onClick={() => act({ type: "DISPLAY_QUESTION" })}
          >
            Display Question
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => act({ type: "SKIP_QUESTION" })}>
            Skip this question
          </Button>
        </>
      )}

      {session.state === "BUZZ_OPEN" && (
        <>
          <p className="animate-pulse text-center text-lg font-semibold">
            Buzzing is open, waiting…
          </p>
          <Button variant="outline" disabled={busy} onClick={() => act({ type: "SKIP_QUESTION" })}>
            Nobody knows it, reveal answer
          </Button>
        </>
      )}

      {session.state === "PLAYER_BUZZED" && buzzer && (
        <>
          <div className="flex items-center justify-center gap-3 rounded-xl border border-primary bg-primary/10 p-4">
            <AvatarBadge avatarId={buzzer.avatarId} />
            <div>
              <p className="text-lg font-bold">{buzzer.username} is answering</p>
              {session.payload.buzz && session.payload.buzz.attempt > 1 && (
                <p className="text-sm text-muted-foreground">
                  Attempt {session.payload.buzz.attempt}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-16 bg-emerald-600 text-lg font-bold hover:bg-emerald-500"
              disabled={busy}
              onClick={() => act({ type: "MARK_CORRECT" })}
            >
              ✓ Correct
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="h-16 text-lg font-bold"
              disabled={busy}
              onClick={() => act({ type: "MARK_INCORRECT" })}
            >
              ✗ Wrong
            </Button>
          </div>
          <Button variant="outline" disabled={busy} onClick={() => act({ type: "SKIP_QUESTION" })}>
            Reveal answer
          </Button>
        </>
      )}

      {/* Between questions the main screen advances itself, the host just
          sees a greyed-out countdown until the next question is ready. */}
      {(session.state === "SHOW_ANSWER" || session.state === "SCOREBOARD") && (
        <AutoAdvanceWait
          state={session.state}
          isLast={session.questionIndex + 1 >= session.questionCount}
        />
      )}
    </div>
  );
}

function AutoAdvanceWait({ state, isLast }: { state: "SHOW_ANSWER" | "SCOREBOARD"; isLast: boolean }) {
  const total = state === "SHOW_ANSWER" ? 6 : 4;
  const [secondsLeft, setSecondsLeft] = useState(total);

  useEffect(() => {
    setSecondsLeft(total);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [state, total]);

  return (
    <Button size="lg" className="h-14 text-lg font-bold opacity-60" disabled>
      {isLast
        ? "Final results coming up…"
        : state === "SHOW_ANSWER"
          ? `Scores in ${secondsLeft}…`
          : `Next question in ${secondsLeft}…`}
    </Button>
  );
}
