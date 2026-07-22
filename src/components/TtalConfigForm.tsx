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
import {
  AUTO_SKIP_OPTIONS,
  LIMITS,
  PLAN_LABELS,
  TTAL_DEFAULT_ROUNDS,
  TTAL_ROUND_OPTIONS,
  type PlanTier,
} from "@/lib/constants";

export function TtalConfigForm({ planTier }: { planTier: PlanTier }) {
  const router = useRouter();
  const [variation, setVariation] = useState<"two_truths" | "two_lies">("two_truths");
  const [rounds, setRounds] = useState(TTAL_DEFAULT_ROUNDS);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameType: "ttal", variation, rounds, hostMode, autoSkipSeconds }),
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
      <h1 className="font-display mb-2 text-3xl uppercase tracking-wide">Set up Two Truths and a Lie</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Everyone writes three statements about themselves, then you take turns spotting each
        other&apos;s odd one out. Needs at least 3 players.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Game settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label>Variation</Label>
            <Select value={variation} onValueChange={(v) => setVariation(v as typeof variation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="two_truths">Two Truths and a Lie, spot the lie</SelectItem>
                <SelectItem value="two_lies">Two Lies and a Truth, spot the truth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Rounds</Label>
            <Select value={String(rounds)} onValueChange={(v) => setRounds(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTAL_ROUND_OPTIONS.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} {r === 1 ? "round" : "rounds"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Each round, everyone writes a fresh set of statements and takes a turn as the
              subject.
            </p>
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
              <Label>Voting time limit</Label>
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
