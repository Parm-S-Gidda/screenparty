"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LIMITS, QUESTION_COUNT_OPTIONS, type PlanTier } from "@/lib/constants";
import { ChoiceCards, HOST_MODES, OptionChips, SettingRow, SetupSection, SetupShell, PlayerCapRow, TutorialRow, createRoom } from "@/components/setup/SetupParts";

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
    title: "Number Crunch",
    desc: "One player is the guesser, they see a theme but no number. Everyone else gets a number 1–10 and submits an example. The guesser assigns numbers. Closest wins.",
    hasRoundCount: false,
  },
};

export function SimpleGameConfigForm({ gameType, planTier }: { gameType: string; planTier: PlanTier }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [tutorial, setTutorial] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(LIMITS[planTier].maxPlayers);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const meta = GAME_META[gameType];
  const max = LIMITS[planTier].maxQuestions;

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom({ maxPlayers, tutorial, gameType, questionCount, hostMode });
      router.push(`/screen/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <SetupShell
      maxPlayers={maxPlayers} gameType={gameType} title={meta.title} desc={meta.desc} error={error} busy={busy} onLaunch={launch}>
      <SetupSection title="Who runs the show?">
        <ChoiceCards label="Host mode" value={hostMode} onChange={setHostMode} options={HOST_MODES} />
      </SetupSection>

      <SetupSection title="Game rules">
        {meta.hasRoundCount && (
          <SettingRow label="Rounds">
            <OptionChips
              label="Rounds"
              value={questionCount}
              onChange={setQuestionCount}
              options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: String(n), disabled: n > max, title: n > max ? "Paid plans" : undefined }))}
            />
          </SettingRow>
        )}
        <TutorialRow gameType={gameType} value={tutorial} onChange={setTutorial} />
        <PlayerCapRow gameType={gameType} planTier={planTier} value={maxPlayers} onChange={setMaxPlayers} />
      </SetupSection>
    </SetupShell>
  );
}
