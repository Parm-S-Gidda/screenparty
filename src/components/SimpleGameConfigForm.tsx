"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnedPackOption } from "@/lib/store";
import { AUTO_SKIP_OPTIONS, LIMITS, QUESTION_COUNT_OPTIONS, type PlanTier } from "@/lib/constants";
import { AiThemeSection, ChoiceCards, OwnedPackPicker, HOST_MODES, OptionChips, SettingRow, SetupSection, SetupShell, PlayerCapRow, TutorialRow, createRoom } from "@/components/setup/SetupParts";

// AI host time limit: one setting (autoSkipSeconds) per game; `scale` mirrors
// the multiplier phaseTimer / the engine applies so the chips show real seconds.
type TimerMeta = { label: string; hint: string; scale: number };

// what AI writes per game, for the AI theme panel
type AiMeta = { things: string; placeholder: string };

const GAME_META: Record<string, { title: string; desc: string; hasRoundCount: boolean; timer: TimerMeta; ai: AiMeta }> = {
  mlt: {
    title: "Most Likely To",
    desc: "A prompt appears and everyone votes for who is most likely. Voters who pick the top choice score. Needs at least 3 players.",
    hasRoundCount: true,
    timer: { label: "Voting time", hint: "How long players get to vote each round.", scale: 1 },
    ai: { things: "prompts", placeholder: "A theme, like office life or road trips" },
  },
  hol: {
    title: "Higher or Lower",
    desc: "Two items are shown without their values. Vote whether the right one is higher or lower than the left. Correct voters score, then the chain continues.",
    hasRoundCount: false,
    timer: { label: "Voting time", hint: "How long players get to call higher or lower.", scale: 1 },
    ai: { things: "comparisons", placeholder: "A theme, like space or the human body" },
  },
  gtp: {
    title: "Guess the Player",
    desc: "Everyone answers a question or fill-in-the-blank. Then each answer is shown anonymously, can you guess who wrote it? Needs at least 3 players.",
    hasRoundCount: true,
    timer: { label: "Guessing time", hint: "Per answer. Writing answers gets twice as long.", scale: 1 },
    ai: { things: "questions", placeholder: "A theme, like childhood or food" },
  },
  tank: {
    title: "Shark Tank",
    desc: "Everyone gets a random product to pitch. Others vote invest or pass. The more investors the pitcher attracts, the more points they earn.",
    hasRoundCount: false,
    timer: { label: "Investing time", hint: "How long investors get to decide. Pitches get twice as long.", scale: 1 },
    ai: { things: "products", placeholder: "A theme, like pets or the kitchen" },
  },
  charades: {
    title: "Charades",
    desc: "One player acts out a word (no speaking!) while others type guesses on their phones. First correct guess wins; the actor earns points too.",
    hasRoundCount: false,
    timer: { label: "Acting time", hint: "How long each actor gets.", scale: 2 },
    ai: { things: "words", placeholder: "A theme, like Disney movies or sports" },
  },
  num: {
    title: "Number Crunch",
    desc: "One player is the guesser, they see a theme but no number. Everyone else gets a number 1–10 and submits an example. The guesser assigns numbers. Closest wins.",
    hasRoundCount: false,
    timer: { label: "Phase time", hint: "For writing examples, and again for placing them.", scale: 2 },
    ai: { things: "rating themes", placeholder: "A theme, like 90s pop culture or travel" },
  },
};

export function SimpleGameConfigForm({ gameType, planTier, ownedPacks }: { gameType: string; planTier: PlanTier; ownedPacks: OwnedPackOption[] }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [tutorial, setTutorial] = useState(true);
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(30);
  const [aiTopic, setAiTopic] = useState("");
  const [storePackId, setStorePackId] = useState("");
  const aiLocked = LIMITS[planTier].aiPackGenPerMonth === 0;
  const [maxPlayers, setMaxPlayers] = useState<number>(LIMITS[planTier].maxPlayers);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const meta = GAME_META[gameType];
  const max = LIMITS[planTier].maxQuestions;

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom({ maxPlayers, tutorial, gameType, questionCount, hostMode, autoSkipSeconds, storePackId: storePackId || undefined, aiTopic: aiLocked ? undefined : aiTopic.trim() || undefined });
      router.push(`/screen/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <SetupShell
      maxPlayers={maxPlayers} gameType={gameType} title={meta.title} desc={meta.desc} error={error} busy={busy} onLaunch={launch}
      busyLabel={aiTopic.trim() && !aiLocked ? "AI is writing…" : undefined}>
      <SetupSection title="Who runs the show?">
        <ChoiceCards label="Host mode" value={hostMode} onChange={setHostMode} options={HOST_MODES} />
      </SetupSection>

      <SetupSection title="Themed pack" hint="Packs from the store work in every game.">
        <OwnedPackPicker packs={ownedPacks} value={storePackId} onChange={setStorePackId} unit={meta.ai.things} />
      </SetupSection>

      <AiThemeSection
        locked={aiLocked}
        topic={aiTopic}
        onTopic={setAiTopic}
        placeholder={meta.ai.placeholder}
        hint={`Type a theme and AI writes the ${meta.ai.things} around it. Leave it blank for the usual mix.`}
        status={aiTopic.trim() ? "AI writes it when you open the room, about 10 seconds." : undefined}
      />

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
        {hostMode === "virtual" && (
          <SettingRow label={meta.timer.label} hint={meta.timer.hint}>
            <OptionChips
              label={meta.timer.label}
              value={autoSkipSeconds}
              onChange={setAutoSkipSeconds}
              options={AUTO_SKIP_OPTIONS.map((s) => ({ value: s, label: `${s * meta.timer.scale}s` }))}
            />
          </SettingRow>
        )}
        <TutorialRow gameType={gameType} value={tutorial} onChange={setTutorial} />
        <PlayerCapRow gameType={gameType} planTier={planTier} value={maxPlayers} onChange={setMaxPlayers} />
      </SetupSection>
    </SetupShell>
  );
}
