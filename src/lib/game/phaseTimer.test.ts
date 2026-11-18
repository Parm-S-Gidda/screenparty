// Run with: node --test src/lib/game/phaseTimer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { phaseTimer } from "./phaseTimer.ts";

const at = "2026-01-01T00:00:00.000Z";
const session = (state: string, hostMode: "self" | "virtual", payload: object, settings: object = {}) =>
  ({ state, hostMode, payload, settings: { autoSkip: false, autoSkipSeconds: 30, ...settings } }) as never;

test("AI host times every waiting phase with the room's answer time", () => {
  assert.deepEqual(phaseTimer(session("WYR_CHOOSING", "virtual", { wyrRound: { openedAt: at } })), {
    openedAt: at, seconds: 30, onExpire: { type: "REVEAL_ROUND" },
  });
  assert.equal(phaseTimer(session("HOL_VOTING", "virtual", { holRound: { openedAt: at } }, { autoSkipSeconds: 45 }))?.seconds, 45);
  assert.equal(phaseTimer(session("TANK_INVESTING", "virtual", { tankRound: { investStart: at } }))?.seconds, 30);
});

test("writing phases get twice the answer time", () => {
  assert.equal(phaseTimer(session("GTP_ANSWERING", "virtual", { gtpRound: { openedAt: at } }))?.seconds, 60);
  assert.equal(phaseTimer(session("NUM_SUBMITTING", "virtual", { numRound: { openedAt: at } }))?.seconds, 60);
});

test("self-hosted games only show the timers they always had", () => {
  assert.equal(phaseTimer(session("WYR_CHOOSING", "self", { wyrRound: { openedAt: at } })), null);
  assert.equal(phaseTimer(session("MLT_VOTING", "self", { mltRound: { openedAt: at } }))?.seconds, 30);
  assert.equal(phaseTimer(session("BUZZ_OPEN", "self", { buzzOpenedAt: at })), null);
  assert.equal(phaseTimer(session("BUZZ_OPEN", "self", { buzzOpenedAt: at }, { autoSkip: true }))?.onExpire, null);
});

test("phase-specific clocks and actions", () => {
  assert.deepEqual(phaseTimer(session("COLLECTING", "virtual", { collectingOpenedAt: at }, { collectingSeconds: 90 })), {
    openedAt: at, seconds: 90, onExpire: { type: "FORCE_COLLECT_DONE" },
  });
  assert.equal(phaseTimer(session("CHARADES_ACTING", "virtual", { charadesRound: { actStart: at, actSeconds: 60 } }))?.seconds, 60);
  assert.equal(phaseTimer(session("REVEAL", "virtual", {})), null);
  assert.equal(phaseTimer(session("HOL_VOTING", "virtual", {})), null); // no openedAt yet
});
