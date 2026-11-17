"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTO_SKIP_OPTIONS, LIMITS, QUESTION_COUNT_OPTIONS, type PlanTier } from "@/lib/constants";
import { ChoiceCards, HOST_MODES, OptionChips, SettingRow, SetupSection, SetupShell, PlayerCapRow, Toggle, TutorialRow, createRoom } from "@/components/setup/SetupParts";

export function WyrConfigForm({ planTier }: { planTier: PlanTier }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [tutorial, setTutorial] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(LIMITS[planTier].maxPlayers);
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(30);
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const max = LIMITS[planTier].maxQuestions;

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom({ maxPlayers, tutorial, gameType: "wyr", questionCount, hostMode, autoSkipSeconds, teamsEnabled });
      router.push(`/screen/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <SetupShell
      maxPlayers={maxPlayers}
      gameType="wyr"
      title="Majority Would You Rather"
      desc="Each round everyone picks their answer and predicts what the majority chose. Call it right to score. Needs at least 3 players."
      error={error}
      busy={busy}
      onLaunch={launch}
    >
      <SetupSection title="Who runs the show?">
        <ChoiceCards label="Host mode" value={hostMode} onChange={setHostMode} options={HOST_MODES} />
      </SetupSection>

      <SetupSection title="Game rules">
        <SettingRow label="Rounds">
          <OptionChips
            label="Rounds"
            value={questionCount}
            onChange={setQuestionCount}
            options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: String(n), disabled: n > max, title: n > max ? "Paid plans" : undefined }))}
          />
        </SettingRow>
        {hostMode === "virtual" && (
          <SettingRow label="Answer time" hint="How long players get to answer each round.">
            <OptionChips label="Answer time" value={autoSkipSeconds} onChange={setAutoSkipSeconds} options={AUTO_SKIP_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))} />
          </SettingRow>
        )}
        <SettingRow label="Teams" hint="Red vs Blue: predict what the other team's majority picks.">
          <Toggle label="Teams" checked={teamsEnabled} onChange={setTeamsEnabled} />
        </SettingRow>
        <TutorialRow gameType="wyr" value={tutorial} onChange={setTutorial} />
        <PlayerCapRow gameType="wyr" planTier={planTier} value={maxPlayers} onChange={setMaxPlayers} />
      </SetupSection>
    </SetupShell>
  );
}
