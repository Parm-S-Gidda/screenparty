// AI theme content for the party games: one topic in, a pool of rows in the
// exact shape each game's own table uses, so the engines can draw from it
// before (and instead of) their built-in pools. Trivia packs live in
// /api/packs/generate; Two Truths and a Lie has no content (players write it).

import { chatComplete } from "./openai";
import { containsBlockedWord } from "../moderation";

export type AiRow = Record<string, string | number>;

type Spec = {
  // what one item is, the JSON fields it has, and how to clean one
  describe: string;
  fields: string;
  clean: (o: Record<string, unknown>) => AiRow | null;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const SPECS: Record<string, Spec> = {
  wyr: {
    describe: "funny, family-friendly 'Would you rather' dilemmas where both options are roughly equally tempting",
    fields: `"a" (string, max 90 chars, first option without "would you rather"), "b" (string, max 90 chars, second option)`,
    clean: (o) => {
      const a = str(o.a, 120), b = str(o.b, 120);
      return a && b ? { option_a: a, option_b: b } : null;
    },
  },
  mlt: {
    describe: `"Who is most likely to…" prompts for a group of friends, light teasing, never cruel`,
    fields: `"text" (string, max 80 chars, finishes the sentence "Who is most likely to…", lowercase start, no question mark)`,
    clean: (o) => {
      const text = str(o.text, 120).replace(/^who('s| is) most likely to\s*/i, "").replace(/[?.]$/, "");
      return text ? { text } : null;
    },
  },
  hol: {
    describe: "real, well-known facts that each have a single number, for a higher-or-lower guessing chain; values should vary widely",
    fields: `"label" (string, max 70 chars, what is being measured, e.g. "Height of the Eiffel Tower"), "value" (number, accurate), "unit" (string, max 20 chars, e.g. "meters"), "category" (string, one word)`,
    clean: (o) => {
      const label = str(o.label, 100), unit = str(o.unit, 30), category = str(o.category, 30) || "fact";
      const value = Number(o.value);
      return label && unit && Number.isFinite(value) ? { label, value, unit, category } : null;
    },
  },
  gtp: {
    describe: "personal questions or fill-in-the-blanks that everyone answers about themselves, so friends can guess who wrote each answer",
    fields: `"text" (string, max 100 chars; a fill-in-the-blank uses ___ for the blank), "mode" ("prompt" or "fill_blank")`,
    clean: (o) => {
      const text = str(o.text, 140);
      if (!text) return null;
      return { text, mode: text.includes("___") ? "fill_blank" : "prompt" };
    },
  },
  tank: {
    describe: "absurd but harmless invention ideas that a player has to pitch to investors",
    fields: `"name" (string, max 40 chars, catchy product name), "tagline" (string, max 100 chars, what it does)`,
    clean: (o) => {
      const name = str(o.name, 60), tagline = str(o.tagline, 140);
      return name && tagline ? { name, tagline } : null;
    },
  },
  charades: {
    describe: "things that can be acted out silently in charades, one to three words each, recognisable to most people",
    fields: `"word" (string, max 30 chars), "category" (string, max 20 chars, e.g. "movies", "animals", "actions")`,
    clean: (o) => {
      const word = str(o.word, 40), category = str(o.category, 30) || "things";
      return word ? { word, category } : null;
    },
  },
  num: {
    describe: "rating themes where players give an example of something that fits a secret number on a 1 to 10 scale",
    fields: `"theme" (string, max 40 chars, a category of things), "low" (string, max 30 chars, what 1 means), "high" (string, max 30 chars, what 10 means)`,
    clean: (o) => {
      const theme = str(o.theme, 60);
      return theme ? { theme, scale_low: str(o.low, 40) || "Worst", scale_high: str(o.high, 40) || "Best" } : null;
    },
  },
};

export const AI_THEME_GAMES = Object.keys(SPECS);

/** Parse the model's JSON array reply into clean, moderated rows for a game. */
export function parseGameContent(gameType: string, raw: string, count: number): AiRow[] {
  const spec = SPECS[gameType];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
  } catch {
    return [];
  }
  if (!spec || !Array.isArray(parsed)) return [];
  const rows: AiRow[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (rows.length >= count) break;
    if (typeof item !== "object" || item === null) continue;
    const row = spec.clean(item as Record<string, unknown>);
    if (!row) continue;
    const text = Object.values(row).join(" ");
    const key = text.toLowerCase();
    if (seen.has(key) || containsBlockedWord(text)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

/** Ask the model for `count` themed items; [] when AI is off or the reply is unusable. */
export async function generateGameContent(gameType: string, topic: string, count: number): Promise<AiRow[]> {
  const spec = SPECS[gameType];
  if (!spec) return [];
  const raw = await chatComplete({
    system: `You write content for a party game. Output ONLY a JSON array of ${count} objects, no prose.
Each object has exactly these fields: ${spec.fields}.
Items are ${spec.describe}.
Every item must fit the user's theme. No offensive content, slurs, or graphic material. No duplicates.`,
    user: `Theme: ${topic}`,
    maxTokens: count * 70 + 200,
    temperature: 0.9,
    timeoutMs: 30_000,
  });
  return raw ? parseGameContent(gameType, raw, count) : [];
}
