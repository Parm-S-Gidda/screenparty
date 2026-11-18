"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OwnedPackOption } from "@/lib/store";
import { AUTO_SKIP_OPTIONS, LIMITS, QUESTION_COUNT_OPTIONS, type PlanTier } from "@/lib/constants";
import { AiThemeSection, ChoiceCards, OwnedPackPicker, HOST_MODES, OptionChips, SettingRow, SetupSection, SetupShell, PlayerCapRow, Toggle, TutorialRow, createRoom } from "@/components/setup/SetupParts";

type Pack = {
  id: string;
  title: string;
  topic: string;
  description: string;
  isPremium: boolean;
  questionCount: number;
};

type CustomPack = { id: string; title: string; questionCount: number };

type PackTab = "builtin" | "my-packs" | "store";

export function ConfigForm({
  packs,
  planTier,
  canAiGenerate,
  ownedPacks,
}: {
  packs: Pack[];
  planTier: PlanTier;
  canAiGenerate?: boolean;
  ownedPacks: OwnedPackOption[];
}) {
  const router = useRouter();
  const [packTab, setPackTab] = useState<PackTab>("builtin");
  const [packId, setPackId] = useState(packs[0]?.id ?? "");
  const [packSource, setPackSource] = useState<"builtin" | "custom" | "store">("builtin");
  const [customPacks, setCustomPacks] = useState<CustomPack[] | null>(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genNote, setGenNote] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [tutorial, setTutorial] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(LIMITS[planTier].maxPlayers);
  const [hostPersonality, setHostPersonality] = useState<"pro" | "neutral" | "comedian" | "unhinged">("neutral");
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoSkipSeconds, setAutoSkipSeconds] = useState(30);
  const [retriesEnabled, setRetriesEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadCustomPacks(force = false) {
    if (customPacks !== null && !force) return;
    setLoadingCustom(true);
    const res = await fetch("/api/packs");
    if (res.ok) setCustomPacks(await res.json());
    setLoadingCustom(false);
  }

  async function generateAndSelect() {
    if (!genTopic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/packs/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: genTopic.trim(), count: genCount, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Select the new pack immediately and play all of it
      setPackId(data.packId);
      setPackSource("custom");
      setPackTab("my-packs");
      setCustomPacks(null);
      void loadCustomPacks(true);
      const playable = QUESTION_COUNT_OPTIONS.filter((n) => n <= data.questionCount && n <= max);
      if (playable.length) setQuestionCount(playable[playable.length - 1]);
      setGenNote(`"${data.title}" is ready with ${data.questionCount} questions and selected below.`);
      setGenTopic("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom({ maxPlayers, tutorial,
          packId,
          packSource,
          difficulty,
          questionCount,
          hostMode,
          hostPersonality: hostMode === "virtual" ? hostPersonality : undefined,
          autoSkip,
          autoSkipSeconds,
          retriesEnabled,
          maxRetries,
          teamsEnabled,
        });
      router.push(`/screen/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const max = LIMITS[planTier].maxQuestions;
  const packCard = (key: string, selected: boolean, onClick: () => void, title: string, meta: string, desc?: string, locked?: boolean) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={locked}
      onClick={onClick}
      className="flex min-h-11 flex-col items-start gap-1 rounded-xl border-[3px] p-4 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      style={{
        borderColor: "var(--ink)",
        background: selected ? "var(--ink)" : "var(--card-white)",
        boxShadow: selected ? "0 0 0 transparent" : "3px 3px 0 rgba(0,0,0,0.35)",
        transform: selected ? "translate(2px, 2px)" : undefined,
      }}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className="font-display text-lg leading-tight" style={{ color: selected ? "var(--cream)" : "var(--ink)" }}>{title}</span>
        <span className="chip shrink-0" style={selected ? { background: "var(--mustard)", color: "var(--ink)" } : undefined}>{meta}</span>
      </span>
      {desc && <span className="font-hand text-base leading-snug" style={{ color: selected ? "var(--cream-muted)" : "var(--ink-body)" }}>{desc}</span>}
    </button>
  );

  return (
    <SetupShell
      maxPlayers={maxPlayers}
      gameType="buzz_trivia"
      title="Fact Frenzy"
      desc="Buzz-in trivia: the fastest thumb gets to answer. Pick a question pack, set the rules, and open the room."
      error={error}
      busy={busy}
      disabled={!packId}
      onLaunch={launch}
    >
      <AiThemeSection
        locked={!canAiGenerate}
        topic={genTopic}
        onTopic={setGenTopic}
        placeholder="A topic, like 90s movies or world capitals"
        hint="Type a topic and AI writes a question pack for it. It's saved to your packs and selected for this game."
        status={generating ? "Writing your questions, this takes about 10 seconds…" : genNote}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <OptionChips
            label="Questions to write"
            value={genCount}
            onChange={setGenCount}
            options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: `${n} Qs`, disabled: n > max, title: n > max ? "Bigger plans" : undefined }))}
          />
          <button
            type="button"
            onClick={generateAndSelect}
            disabled={generating || !genTopic.trim()}
            className="btn-rough px-5 py-2 text-lg"
            style={{ background: "var(--teal)" }}
          >
            {generating ? "Writing…" : "Write the pack"}
          </button>
        </div>
      </AiThemeSection>

      <SetupSection title="Question pack">
        <div role="tablist" aria-label="Pack source" className="mb-4 grid grid-cols-3 gap-1 rounded-xl border-[3px] p-1" style={{ borderColor: "var(--ink)", background: "var(--paper)" }}>
          {(["builtin", "my-packs", "store"] as PackTab[]).map((tab) => {
            const on = packTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setPackTab(tab);
                  if (tab === "my-packs") loadCustomPacks();
                }}
                className="font-score min-h-11 rounded-lg text-sm uppercase tracking-[0.1em] transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
                style={{ background: on ? "var(--ink)" : "transparent", color: on ? "var(--cream)" : "var(--ink)" }}
              >
                {tab === "builtin" ? "Built-in" : tab === "my-packs" ? "My packs" : "Store packs"}
              </button>
            );
          })}
        </div>

        {packTab === "builtin" && (
          <div role="radiogroup" aria-label="Built-in packs" className="grid gap-3 sm:grid-cols-2">
            {packs.map((pack) => {
              const locked = pack.isPremium && planTier === "free";
              return packCard(
                pack.id,
                packId === pack.id && packSource === "builtin",
                () => { setPackId(pack.id); setPackSource("builtin"); },
                pack.title,
                locked ? "Paid" : `${pack.questionCount} Qs`,
                pack.description,
                locked,
              );
            })}
          </div>
        )}

        {packTab === "my-packs" && (
          <div className="flex flex-col gap-4">
            {loadingCustom && (
              <p className="font-hand py-4 text-center text-lg" style={{ color: "var(--ink-label)" }}>Loading your packs…</p>
            )}
            {!loadingCustom && customPacks !== null && customPacks.length === 0 && (
              <div className="flex flex-col items-center gap-1 rounded-xl border-[3px] border-dashed px-4 py-6 text-center" style={{ borderColor: "rgba(34,31,48,0.35)" }}>
                <p className="font-display text-lg" style={{ color: "var(--ink)" }}>No packs of your own yet</p>
                <p className="font-hand text-base" style={{ color: "var(--ink-body)" }}>
                  Write your own questions{canAiGenerate ? ", or have AI write a pack in the AI theme panel" : ""}.
                </p>
              </div>
            )}
            {!loadingCustom && customPacks !== null && customPacks.length > 0 && (
              <div role="radiogroup" aria-label="Your packs" className="grid gap-3 sm:grid-cols-2">
                {customPacks.map((cp) =>
                  packCard(cp.id, packId === cp.id && packSource === "custom", () => { setPackId(cp.id); setPackSource("custom"); }, cp.title, `${cp.questionCount} Qs`),
                )}
              </div>
            )}
            <Link href="/dashboard/packs" className="link-label self-start" style={{ color: "var(--ink)" }}>
              Write and edit your packs →
            </Link>

          </div>
        )}

        {packTab === "store" && (
          <OwnedPackPicker
            packs={ownedPacks}
            value={packSource === "store" ? packId : ""}
            onChange={(id) => {
              // "" (standard mix) falls back to the first built-in pack
              setPackId(id || packs[0]?.id || "");
              setPackSource(id ? "store" : "builtin");
            }}
            unit="questions"
          />
        )}
      </SetupSection>

      <SetupSection title="Who runs the show?">
        <ChoiceCards label="Host mode" value={hostMode} onChange={setHostMode} options={HOST_MODES} />
        {hostMode === "virtual" && (
          <div className="mt-5 flex flex-col gap-3 border-t-2 border-dashed pt-4" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
            <p className="font-display text-lg" style={{ color: "var(--ink)" }}>Host personality</p>
            <ChoiceCards
              label="Host personality"
              columns={4}
              value={hostPersonality}
              onChange={setHostPersonality}
              options={[
                { value: "neutral", label: "Neutral", desc: "Balanced and upbeat" },
                { value: "pro", label: "Pro", desc: "Sharp and authoritative" },
                { value: "comedian", label: "Comedian", desc: "Absurd and funny" },
                { value: "unhinged", label: "Unhinged", desc: "Pure chaos" },
              ]}
            />
          </div>
        )}
      </SetupSection>

      <SetupSection title="Game rules">
        <SettingRow label="Difficulty">
          <OptionChips
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={["mixed", "easy", "medium", "hard"].map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
          />
        </SettingRow>
        <SettingRow label="Questions">
          <OptionChips
            label="Questions"
            value={questionCount}
            onChange={setQuestionCount}
            options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: String(n), disabled: n > max, title: n > max ? "Paid plans" : undefined }))}
          />
        </SettingRow>
        <SettingRow label="Auto skip" hint={hostMode === "virtual" ? "Always on with the Virtual Host." : "Move on if nobody buzzes in time."}>
          <div className="flex flex-wrap items-center gap-3">
            {(autoSkip || hostMode === "virtual") && (
              <OptionChips label="Auto skip after" value={autoSkipSeconds} onChange={setAutoSkipSeconds} options={AUTO_SKIP_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))} />
            )}
            <Toggle label="Auto skip" checked={hostMode === "virtual" ? true : autoSkip} disabled={hostMode === "virtual"} onChange={setAutoSkip} />
          </div>
        </SettingRow>
        <SettingRow label="Teams" hint="Red vs Blue. A wrong answer passes to the other team.">
          <Toggle label="Teams" checked={teamsEnabled} onChange={setTeamsEnabled} />
        </SettingRow>
        <SettingRow label="Buzz retries" hint="A wrong answer passes to the next buzzer.">
          <div className="flex flex-wrap items-center gap-3">
            {retriesEnabled && (
              <OptionChips label="Tries" value={maxRetries} onChange={setMaxRetries} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
            )}
            <Toggle label="Buzz retries" checked={retriesEnabled} onChange={setRetriesEnabled} />
          </div>
        </SettingRow>
        <TutorialRow gameType="buzz_trivia" value={tutorial} onChange={setTutorial} />
        <PlayerCapRow gameType="buzz_trivia" planTier={planTier} value={maxPlayers} onChange={setMaxPlayers} />
      </SetupSection>
    </SetupShell>
  );
}
