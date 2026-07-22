"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BackLink } from "@/components/cartoon/BackLink";
import {
  AUTO_SKIP_OPTIONS,
  LIMITS,
  PLAN_LABELS,
  QUESTION_COUNT_OPTIONS,
  type PlanTier,
} from "@/lib/constants";

type Pack = {
  id: string;
  title: string;
  topic: string;
  description: string;
  isPremium: boolean;
  questionCount: number;
};

export function ConfigForm({ packs, planTier }: { packs: Pack[]; planTier: PlanTier }) {
  const router = useRouter();
  const [packId, setPackId] = useState(packs[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(30);
  const [retriesEnabled, setRetriesEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
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
        body: JSON.stringify({
          packId,
          difficulty,
          questionCount,
          hostMode,
          autoSkip,
          autoSkipSeconds,
          retriesEnabled,
          maxRetries,
          teamsEnabled,
        }),
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
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <BackLink href="/dashboard" label="dashboard" className="mb-3" />
      <h1 className="font-display mb-6 text-3xl uppercase tracking-wide">Set up Fact Frenzy</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Question pack</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {packs.map((pack) => {
            const locked = pack.isPremium && planTier === "free";
            return (
              <button
                key={pack.id}
                type="button"
                disabled={locked}
                onClick={() => setPackId(pack.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  packId === pack.id ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40",
                  locked && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{pack.title}</span>
                  {locked ? (
                    <Badge variant="outline">Paid</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{pack.questionCount} questions</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pack.description}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Game settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Number of questions</Label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)} disabled={n > LIMITS[planTier].maxQuestions}>
                    {n} questions{n > LIMITS[planTier].maxQuestions ? ", paid plan" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Host mode</Label>
            <Select value={hostMode} onValueChange={(v) => setHostMode(v as "self" | "virtual")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self Host, a player runs the game</SelectItem>
                <SelectItem value="virtual">Virtual AI Host, the AI runs the show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Max players</Label>
            <div className="flex h-9 items-center text-sm text-muted-foreground">
              {LIMITS[planTier].maxPlayers} on your {PLAN_LABELS[planTier]} plan
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="auto-skip">Auto skip</Label>
              <p className="text-sm text-muted-foreground">
                {hostMode === "virtual"
                  ? "Always on with the AI host, pick how long to wait"
                  : "Reveal the answer if nobody buzzes in time"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(autoSkip || hostMode === "virtual") && (
                <Select
                  value={String(autoSkipSeconds)}
                  onValueChange={(v) => setAutoSkipSeconds(Number(v))}
                >
                  <SelectTrigger className="w-24">
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
              )}
              <Switch
                id="auto-skip"
                checked={hostMode === "virtual" ? true : autoSkip}
                disabled={hostMode === "virtual"}
                onCheckedChange={setAutoSkip}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="teams">Teams</Label>
              <p className="text-sm text-muted-foreground">
                Red vs Blue, wrong answers pass to the other team, team totals win
              </p>
            </div>
            <Switch id="teams" checked={teamsEnabled} onCheckedChange={setTeamsEnabled} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="retries">Buzz order retries</Label>
              <p className="text-sm text-muted-foreground">
                Wrong answer passes to the next buzzer
              </p>
            </div>
            <div className="flex items-center gap-3">
              {retriesEnabled && (
                <Select value={String(maxRetries)} onValueChange={(v) => setMaxRetries(Number(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "try" : "tries"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Switch id="retries" checked={retriesEnabled} onCheckedChange={setRetriesEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="w-full text-lg font-bold" onClick={launch} disabled={busy || !packId}>
        {busy ? "Creating room…" : "Launch Room"}
      </Button>
    </main>
  );
}
