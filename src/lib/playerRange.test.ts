// Run with: node --test src/lib/playerRange.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { clampMaxPlayers, playerRange } from "./playerRange.ts";

test("range runs from the game minimum to the plan maximum", () => {
  assert.deepEqual(playerRange(3, 20), { min: 3, max: 20 });
  assert.deepEqual(playerRange(1, 5), { min: 1, max: 5 });
});

test("a game minimum above the plan maximum collapses to the plan maximum", () => {
  assert.deepEqual(playerRange(8, 5), { min: 5, max: 5 });
});

test("requests are clamped into range", () => {
  assert.equal(clampMaxPlayers(12, 3, 20), 12);
  assert.equal(clampMaxPlayers(99, 3, 20), 20);
  assert.equal(clampMaxPlayers(2, 3, 20), 3);
  assert.equal(clampMaxPlayers(7.6, 3, 20), 8);
});

test("missing or junk requests fall back to the plan maximum", () => {
  assert.equal(clampMaxPlayers(undefined, 3, 20), 20);
  assert.equal(clampMaxPlayers("lots", 3, 20), 20);
  assert.equal(clampMaxPlayers(0, 3, 20), 20);
});
