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
import { Switch } from "@/components/ui/switch";
import { BackLink } from "@/components/cartoon/BackLink";
import {
  AUTO_SKIP_OPTIONS,
  LIMITS,
  PLAN_LABELS,
  QUESTION_COUNT_OPTIONS,
  type PlanTier,
} from "@/lib/constants";

export function WyrConfigForm({ planTier }: { planTier: PlanTier }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(30);
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameType: "wyr", questionCount, hostMode, autoSkipSeconds, teamsEnabled }),
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
      <h1 className="font-display mb-2 text-3xl uppercase tracking-wide">Set up Majority Would You Rather</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Each round everyone picks their answer and predicts what the majority chose. Call it
        right to score. Needs at least 3 players.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Game settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
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

          {hostMode === "virtual" && (
            <div className="grid gap-2">
              <Label>Answer time limit</Label>
              <Select
                value={String(autoSkipSeconds)}
                onValueChange={(v) => setAutoSkipSeconds(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_SKIP_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="teams">Teams</Label>
              <p className="text-sm text-muted-foreground">
                Red vs Blue, predict what the OTHER team&apos;s majority picks
              </p>
            </div>
            <Switch id="teams" checked={teamsEnabled} onCheckedChange={setTeamsEnabled} />
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
