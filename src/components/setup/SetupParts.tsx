"use client";

// Shared building blocks for the game setup screens (host/new). One shell,
// one launch bar, and three controls: choice cards, option chips and toggles.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BackLink } from "@/components/cartoon/BackLink";
import { GamePreview } from "@/components/public/GamePreview";
import { GAMES } from "@/lib/games";
import { LIMITS, PLAN_LABELS, type PlanTier } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { playerRange } from "@/lib/playerRange";
import { TUTORIALS } from "@/lib/tutorials";
import { PackArt } from "@/components/store/PackArt";
import type { OwnedPackOption } from "@/lib/store";

export function SetupShell({
  gameType,
  title,
  desc,
  error,
  busy,
  busyLabel = "Opening room…",
  disabled,
  onLaunch,
  maxPlayers,
  children,
}: {
  gameType: string;
  title: string;
  desc: React.ReactNode;
  error: string | null;
  busy: boolean;
  busyLabel?: string;
  disabled?: boolean;
  onLaunch: () => void;
  maxPlayers: number;
  children: React.ReactNode;
}) {
  const game = GAMES.find((g) => g.gameType === gameType);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-5">
      <BackLink href="/dashboard" label="dashboard" className="mb-5" />

      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        {game && (
          <div
            aria-hidden
            className="panel-paper relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden sm:w-44"
            style={{ background: game.color }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1.6px)", backgroundSize: "10px 10px" }}
            />
            <div className="relative">
              <GamePreview slug={game.slug} />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-balance text-[clamp(2rem,6vw,2.75rem)] uppercase leading-[0.95]" style={{ color: "var(--cream)" }}>
            {title}
          </h1>
          <p className="font-hand max-w-[52ch] text-lg leading-snug" style={{ color: "var(--cream-muted)" }}>
            {desc}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6">{children}</div>

      {/* launch stays in reach on a phone while the settings scroll */}
      <div className="sticky bottom-0 z-20 -mx-5 mt-8 flex flex-col gap-3 px-5 pb-5 pt-3" style={{ background: "var(--stage-bg)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-6" style={{ background: "linear-gradient(to top, var(--stage-bg), transparent)" }} />
        {error && (
          <p role="alert" className="font-hand rounded-lg border-[3px] px-3 py-2 text-center text-lg leading-snug" style={{ borderColor: "var(--ink)", background: "var(--cream)", color: "var(--error-red)" }}>
            {error}
          </p>
        )}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-score order-2 text-center text-xs uppercase tracking-[0.16em] sm:order-1 sm:text-left" style={{ color: "var(--cream-muted)" }}>
            Room for {maxPlayers} {maxPlayers === 1 ? "player" : "players"}
          </p>
          <button type="button" onClick={onLaunch} disabled={busy || disabled} className="btn-rough order-1 px-10 py-3.5 text-2xl sm:order-2">
            {busy ? busyLabel : "Open the room"}
          </button>
        </div>
      </div>
    </main>
  );
}

/** One paper panel per group of settings. */
export function SetupSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel-paper panel-grain p-5 md:p-6" aria-label={title}>
      <div className="mb-4">
        <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        {hint && (
          <p className="font-hand text-base leading-snug" style={{ color: "var(--ink-label)" }}>
            {hint}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

/**
 * "AI theme" panel: type a topic and AI writes the game's content around it.
 * Paid only: on the free plan it stays visible but greyed, with a way to the
 * plans. `children` holds game-specific extras (trivia's count + write button).
 */
export function AiThemeSection({
  locked,
  topic,
  onTopic,
  placeholder,
  hint,
  status,
  children,
}: {
  locked: boolean;
  topic: string;
  onTopic: (v: string) => void;
  placeholder: string;
  hint: string;
  status?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="panel-paper panel-grain p-5 md:p-6" aria-label="AI theme">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
            AI theme
          </h2>
          <p className="font-hand text-base leading-snug" style={{ color: "var(--ink-label)" }}>
            {hint}
          </p>
        </div>
        <span className="chip shrink-0" style={locked ? undefined : { background: "var(--mustard)", color: "var(--ink)" }}>
          {locked ? "Paid plans" : "✦ AI"}
        </span>
      </div>
      <div className={cn("flex flex-col gap-3", locked && "pointer-events-none select-none opacity-45")} inert={locked}>
        <input
          aria-label="Theme"
          className="font-hand h-12 w-full rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-lg text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/35 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
          placeholder={placeholder}
          value={topic}
          onChange={(e) => onTopic(e.target.value)}
          maxLength={100}
          disabled={locked}
        />
        {children}
      </div>
      {locked ? (
        <a href="/account#plans-heading" className="link-label mt-2" style={{ color: "var(--ink)" }}>
          Upgrade to unlock AI themes →
        </a>
      ) : (
        status && (
          <p role="status" className="font-hand mt-2 text-base" style={{ color: "var(--ink-label)" }}>
            {status}
          </p>
        )
      )}
    </section>
  );
}

/** Owned packs from the store as radio cards; "" means the standard mix. */
export function OwnedPackPicker({
  packs,
  value,
  onChange,
  unit,
}: {
  packs: OwnedPackOption[];
  value: string;
  onChange: (id: string) => void;
  unit: string;
}) {
  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border-[3px] border-dashed px-4 py-6 text-center" style={{ borderColor: "rgba(34,31,48,0.35)" }}>
        <p className="font-display text-lg" style={{ color: "var(--ink)" }}>No store packs yet</p>
        <p className="font-hand max-w-sm text-base" style={{ color: "var(--ink-body)" }}>
          Themed packs like Halloween or 90s Throwback work in every game.
        </p>
        <Link href="/store" className="link-label" style={{ color: "var(--ink)" }}>Browse the pack store →</Link>
      </div>
    );
  }
  const options = [{ id: "", title: "Standard mix", count: 0 } as const, ...packs];
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Pack" className="grid gap-3 sm:grid-cols-2">
        {options.map((p) => {
          const on = value === p.id;
          return (
            <button
              key={p.id || "standard"}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(p.id)}
              className="flex min-h-16 items-center gap-3 overflow-hidden rounded-xl border-[3px] p-2 pr-4 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
              style={{
                borderColor: "var(--ink)",
                background: on ? "var(--ink)" : "var(--card-white)",
                boxShadow: on ? "none" : "3px 3px 0 rgba(0,0,0,0.35)",
                transform: on ? "translate(2px, 2px)" : undefined,
              }}
            >
              {"art" in p ? (
                <PackArt art={p.art} color={p.color} accent={p.accent} className="h-12 w-12 shrink-0 rounded-lg border-2 border-[var(--ink)]" />
              ) : (
                <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-xl" style={{ borderColor: on ? "var(--cream)" : "var(--ink)", color: on ? "var(--cream)" : "var(--ink)" }}>
                  ★
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="font-display truncate text-lg leading-tight" style={{ color: on ? "var(--cream)" : "var(--ink)" }}>{p.title}</span>
                <span className="font-score text-xs uppercase tracking-[0.12em]" style={{ color: on ? "var(--cream-muted)" : "var(--ink-label)" }}>
                  {p.id ? `${p.count} ${unit}` : "Our built-in content"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Link href="/store" className="link-label self-start" style={{ color: "var(--ink)" }}>Get more packs in the store →</Link>
    </div>
  );
}

/** A labelled setting inside a section; rows are split by dashed rules. */
export function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-dashed py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between [&:not(:first-child)]:border-t-2" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight" style={{ color: "var(--ink)" }}>
          {label}
        </p>
        {hint && (
          <p className="font-hand text-base leading-snug" style={{ color: "var(--ink-body)" }}>
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

type Choice<T extends string> = { value: T; label: string; desc?: string; disabled?: boolean; note?: string };

/** Big radio cards: the selected one turns mustard and sinks into the paper. */
export function ChoiceCards<T extends string>({
  label,
  value,
  onChange,
  options,
  columns = 2,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Choice<T>[];
  columns?: 2 | 4;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-3", columns === 4 ? "grid-cols-2 md:grid-cols-4" : "sm:grid-cols-2")}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className="flex min-h-11 flex-col items-start gap-1 rounded-xl border-[3px] p-4 text-left transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              borderColor: "var(--ink)",
              background: on ? "var(--ink)" : "var(--card-white)",
              boxShadow: on ? "0 0 0 transparent" : "3px 3px 0 rgba(0,0,0,0.35)",
              transform: on ? "translate(2px, 2px)" : undefined,
            }}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="font-display text-lg leading-tight" style={{ color: on ? "var(--cream)" : "var(--ink)" }}>
                {o.label}
              </span>
              {o.note && <span className="chip shrink-0">{o.note}</span>}
            </span>
            {o.desc && (
              <span className="font-hand text-base leading-snug" style={{ color: on ? "var(--cream-muted)" : "var(--ink-body)" }}>
                {o.desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Short option lists (counts, seconds) as one row of chips. */
export function OptionChips<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            className="font-score min-h-11 min-w-12 rounded-lg border-[3px] px-3 text-base tabular-nums transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)] disabled:cursor-not-allowed disabled:line-through disabled:opacity-45"
            style={{
              borderColor: "var(--ink)",
              background: on ? "var(--ink)" : "var(--card-white)",
              color: on ? "var(--cream)" : "var(--ink)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Large on/off switch with a real 44px target. */
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={cn("flex h-8 w-14 items-center rounded-full border-[3px] p-0.5", checked ? "justify-end" : "justify-start")}
        style={{ borderColor: "var(--ink)", background: checked ? "var(--teal)" : "var(--paper)" }}
      >
        <motion.span
          layout={!reduce}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className="block h-5 w-5 rounded-full border-[3px]"
          style={{ borderColor: "var(--ink)", background: "var(--cream)" }}
        />
      </span>
    </button>
  );
}

/** "How to play" row: on by default; greyed out until a game has a tutorial. */
export function TutorialRow({ gameType, value, onChange }: { gameType: string; value: boolean; onChange: (v: boolean) => void }) {
  const has = Boolean(TUTORIALS[gameType]);
  return (
    <SettingRow
      label="How to play"
      hint={has ? "A one-minute voiced demo on the big screen before round 1. Skippable." : "Tutorial coming soon for this game."}
    >
      <Toggle label="How to play" checked={has && value} disabled={!has} onChange={onChange} />
    </SettingRow>
  );
}

export const HOST_MODES = [
  { value: "self" as const, label: "You host", desc: "Run each round from the big screen yourself." },
  { value: "virtual" as const, label: "Virtual Host", desc: "It reads every question out loud and reacts, so you can play too." },
];

/** Shared helper for the room create call every setup form makes. */
export async function createRoom(body: Record<string, unknown>): Promise<string> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not create room");
  return data.code;
}

/** "Max players" row for a Game rules panel: a compact slider capped by the plan. */
export function PlayerCapRow({
  gameType,
  planTier,
  value,
  onChange,
}: {
  gameType: string;
  planTier: PlanTier;
  value: number;
  onChange: (n: number) => void;
}) {
  const planMax = LIMITS[planTier].maxPlayers;
  const { min, max } = playerRange(GAMES.find((g) => g.gameType === gameType)?.minPlayers ?? 1, planMax);
  const locked = min === max;
  const frac = locked ? 1 : (value - min) / (max - min);
  // knob centre travels from one radius in to one radius short of the end, so the fill always meets it
  const at = `calc(11px + (100% - 22px) * ${frac})`;
  return (
    <SettingRow
      label="Max players"
      hint={`Your ${PLAN_LABELS[planTier]} plan allows up to ${planMax}. The room closes once it's full.`}
    >
      <div className="flex w-full items-center gap-3 sm:w-72">
        <span className="font-score w-8 text-right text-xs tabular-nums" style={{ color: "var(--ink-label)" }} aria-hidden>
          {min}
        </span>
        <div className="relative h-11 flex-1">
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full border-[3px]" style={{ borderColor: "var(--ink)", background: "var(--card-white)" }}>
            <div className="h-full" style={{ width: at, background: "var(--ink)" }} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
            style={{ left: at, borderColor: "var(--ink)", background: "var(--cream)", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
          />
          {/* the real control sits on top, invisible, so keyboard, touch and screen readers work natively */}
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            disabled={locked}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Max players"
            aria-valuetext={`${value} players`}
            className="cap-slider absolute inset-0 h-full w-full"
          />
        </div>
        <output
          className="font-score flex h-11 min-w-12 items-center justify-center rounded-lg border-[3px] px-2 text-base tabular-nums"
          style={{ borderColor: "var(--ink)", background: "var(--ink)", color: "var(--cream)" }}
        >
          {value}
        </output>
      </div>
    </SettingRow>
  );
}
