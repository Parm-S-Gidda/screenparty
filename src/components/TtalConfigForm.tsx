"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTO_SKIP_OPTIONS,
  LIMITS,
  TTAL_COLLECT_SECOND_OPTIONS,
  TTAL_DEFAULT_COLLECT_SECONDS,
  TTAL_DEFAULT_ROUNDS,
  TTAL_ROUND_OPTIONS,
  type PlanTier,
} from "@/lib/constants";
import { ChoiceCards, HOST_MODES, OptionChips, SettingRow, SetupSection, SetupShell, PlayerCapRow, TutorialRow, createRoom } from "@/components/setup/SetupParts";

export function TtalConfigForm({ planTier }: { planTier: PlanTier }) {
  const router = useRouter();
  const [variation, setVariation] = useState<"two_truths" | "two_lies">("two_truths");
  const [rounds, setRounds] = useState(TTAL_DEFAULT_ROUNDS);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [tutorial, setTutorial] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(LIMITS[planTier].maxPlayers);
  const [collectingSeconds, setCollectingSeconds] = useState(TTAL_DEFAULT_COLLECT_SECONDS);
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom({ maxPlayers, tutorial, gameType: "ttal", variation, rounds, hostMode, collectingSeconds, autoSkipSeconds });
      router.push(`/screen/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <SetupShell
      maxPlayers={maxPlayers}
      gameType="ttal"
      title="Two Truths and a Lie"
      desc="Everyone writes three statements about themselves, then you take turns spotting each other's odd one out. Needs at least 3 players."
      error={error}
      busy={busy}
      onLaunch={launch}
    >
      <SetupSection title="Pick the twist">
        <ChoiceCards
          label="Variation"
          value={variation}
          onChange={setVariation}
          options={[
            { value: "two_truths", label: "2 truths, 1 lie", desc: "Spot the lie among three statements." },
            { value: "two_lies", label: "2 lies, 1 truth", desc: "Harder: find the one thing that's true." },
          ]}
        />
      </SetupSection>

      <SetupSection title="Who runs the show?">
        <ChoiceCards label="Host mode" value={hostMode} onChange={setHostMode} options={HOST_MODES} />
      </SetupSection>

      <SetupSection title="Game rules">
        <SettingRow label="Rounds" hint="Everyone takes a turn in the hot seat each round.">
          <OptionChips label="Rounds" value={rounds} onChange={setRounds} options={TTAL_ROUND_OPTIONS.map((r) => ({ value: r, label: String(r) }))} />
        </SettingRow>
        <SettingRow label="Writing time" hint="How long players get to write their statements.">
          <OptionChips
            label="Writing time"
            value={collectingSeconds}
            onChange={setCollectingSeconds}
            options={TTAL_COLLECT_SECOND_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))}
          />
        </SettingRow>
        {hostMode === "virtual" && (
          <SettingRow label="Voting time" hint="How long players get to vote each round.">
            <OptionChips label="Voting time" value={autoSkipSeconds} onChange={setAutoSkipSeconds} options={AUTO_SKIP_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))} />
          </SettingRow>
        )}
        <TutorialRow gameType="ttal" value={tutorial} onChange={setTutorial} />
        <PlayerCapRow gameType="ttal" planTier={planTier} value={maxPlayers} onChange={setMaxPlayers} />
      </SetupSection>
    </SetupShell>
  );
}
