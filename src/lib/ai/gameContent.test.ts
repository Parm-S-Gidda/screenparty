// Run with: node --import jiti/register --test src/lib/ai/gameContent.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGameContent } from "./gameContent";

test("rows come out in the game's own table shape", () => {
  assert.deepEqual(parseGameContent("wyr", '[{"a":"Fly","b":"Be invisible"}]', 5), [{ option_a: "Fly", option_b: "Be invisible" }]);
  assert.deepEqual(parseGameContent("num", '[{"theme":"Pizza toppings","low":"Gross","high":"Perfect"}]', 5), [
    { theme: "Pizza toppings", scale_low: "Gross", scale_high: "Perfect" },
  ]);
  assert.deepEqual(parseGameContent("hol", '[{"label":"Eiffel Tower height","value":"330","unit":"meters","category":"size"}]', 5), [
    { label: "Eiffel Tower height", value: 330, unit: "meters", category: "size" },
  ]);
});

test("markdown fences, junk, duplicates and blocked words are dropped", () => {
  const raw = '```json\n[{"text":"Who is most likely to sleep in?"},{"text":"sleep in"},{"text":""},{"text":"say shit"},"x",{"text":"win a bake off"}]\n```';
  assert.deepEqual(parseGameContent("mlt", raw, 10), [{ text: "sleep in" }, { text: "win a bake off" }]);
});

test("gtp mode follows the blank, count caps the pool, bad replies give nothing", () => {
  assert.deepEqual(parseGameContent("gtp", '[{"text":"My hidden talent is ___","mode":"prompt"},{"text":"Best trip?"}]', 1), [
    { text: "My hidden talent is ___", mode: "fill_blank" },
  ]);
  assert.deepEqual(parseGameContent("hol", '[{"label":"x","value":"lots","unit":"y"}]', 5), []);
  assert.deepEqual(parseGameContent("mlt", "sorry, I can't", 5), []);
  assert.deepEqual(parseGameContent("ttal", '[{"text":"hi"}]', 5), []);
});
