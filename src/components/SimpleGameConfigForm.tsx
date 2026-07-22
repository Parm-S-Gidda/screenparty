"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackLink } from "@/components/cartoon/BackLink";
import { LIMITS, PLAN_LABELS, QUESTION_COUNT_OPTIONS, type PlanTier } from "@/lib/constants";

const GAME_META: Record<string, { title: string; desc: string; hasRoundCount: boolean }> = {
  mlt: {
    title: "Most Likely To",
    desc: "A prompt appears and everyone votes for who is most likely. Voters who pick the top choice score. Needs at least 3 players.",
    hasRoundCount: true,
  },
  hol: {
    title: "Higher or Lower",
    desc: "Two items are shown without their values. Vote whether the right one is higher or lower than the left. Correct voters score, then the chain continues.",
    hasRoundCount: false,
  },
  gtp: {
    title: "Guess the Player",
    desc: "Everyone answers a question or fill-in-the-blank. Then each answer is shown anonymously, can you guess who wrote it? Needs at least 3 players.",
    hasRoundCount: true,
  },
  tank: {
    title: "Shark Tank",
    desc: "Everyone gets a random product to pitch. Others vote invest or pass. The more investors the pitcher attracts, the more points they earn.",
    hasRoundCount: false,
  },
  charades: {
    title: "Charades",
    desc: "One player acts out a word (no speaking!) while others type guesses on their phones. First correct guess wins; the actor earns points too.",
    hasRoundCount: false,
  },
  num: {
    title: "Number Rating",
    desc: "One player is the guesser, they see a theme but no number. Everyone else gets a number 1–10 and submits an example. The guesser assigns numbers. Closest wins.",
    hasRoundCount: false,
  },
};

export function SimpleGameConfigForm({ gameType, planTier }: { gameType: string; planTier: PlanTier }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const meta = GAME_META[gameType];

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameType, questionCount, hostMode }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create room");
      router.push(`/screen/${body.code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <BackLink href="/dashboard" label="dashboard" className="mb-3" />
      <h1 className="font-display mb-2 text-3xl uppercase tracking-wide">Set up {meta.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{meta.desc}</p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Game settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {meta.hasRoundCount && (
            <div className="grid gap-2">
              <Label>Number of rounds</Label>
              <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_COUNT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} disabled={n > LIMITS[planTier].maxQuestions}>
                      {n} rounds{n > LIMITS[planTier].maxQuestions ? ", paid plan" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Host mode</Label>
            <Select value={hostMode} onValueChange={(v) => setHostMode(v as typeof hostMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self Host, you pace it from the main screen</SelectItem>
                <SelectItem value="virtual">Virtual AI Host, the AI runs the show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Up to {LIMITS[planTier].maxPlayers} players on your {PLAN_LABELS[planTier]} plan.
          </p>
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="w-full text-lg font-bold" onClick={launch} disabled={busy}>
        {busy ? "Creating room…" : "Launch Room"}
      </Button>
    </main>
  );
}
