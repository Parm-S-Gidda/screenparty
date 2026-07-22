// Higher or Lower engine: two items are shown (label + unit, value hidden).
// Players vote whether the right item's value is HIGHER or LOWER than the
// left item's value. Majority vote is taken; correct voters score points.
// After the reveal the right item becomes the new left (its value is now
// known), and a fresh right item comes in, building a chain.

import { HOL_POINTS } from "@/lib/constants";
import { trackUsage } from "@/lib/ai/usage";
import {
  activePlayers,
  assertState,
  endGame,
  GameError,
  isHostActor,
  shuffle,
  updateSession,
  type Ctx,
} from "./engine";
import type { GameAction, PublicPayload } from "./types";

const MIN_PLAYERS = 2;
const CHAIN_LENGTH = 10; // rounds per game (needs 11 items)

export async function applyHolAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "VOTE_HOL":
      return handleVote(ctx, action.vote);
    case "REVEAL_ROUND":
      return handleForceReveal(ctx);
    case "NEXT_ROUND":
      return handleNextRound(ctx);
    case "END_GAME":
      if (ctx.actor.kind !== "account_host")
        throw new GameError(403, "Only the room owner can do that");
      return endGame(ctx);
    default:
      throw new GameError(400, `${action.type} isn't part of this game`);
  }
}

function assertHost(ctx: Ctx) {
  if (!isHostActor(ctx.actor)) throw new GameError(403, "Only the host can do that");
}

async function handleStart(ctx: Ctx) {
  if (ctx.actor.kind !== "account_host")
    throw new GameError(403, "Only the room owner can do that");
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (players.length < MIN_PLAYERS)
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Higher or Lower`);

  const { data: rows, error } = await ctx.admin.from("hol_items").select("label, value, unit");
  if (error || !rows || rows.length < CHAIN_LENGTH + 1)
    throw new GameError(500, "Not enough items available");

  const picked = shuffle(rows).slice(0, CHAIN_LENGTH + 1).map((r) => ({
    label: r.label,
    value: Number(r.value),
    unit: r.unit,
  }));

  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const payload = roundPayload(picked, 0, null);
  await updateSession(ctx, {
    current_state: "HOL_VOTING",
    current_question_index: 0,
    question_count: CHAIN_LENGTH,
    settings: { ...ctx.session.settings, holItems: picked },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

function roundPayload(
  items: { label: string; value: number; unit: string }[],
  index: number,
  knownLeftValue: number | null
): PublicPayload {
  const left = items[index];
  const right = items[index + 1];
  return {
    holRound: {
      leftLabel: left.label,
      leftUnit: left.unit,
      leftValue: knownLeftValue, // null = first round (both hidden)
      rightLabel: right.label,
      rightUnit: right.unit,
      openedAt: new Date().toISOString(),
    },
  };
}

async function handleVote(ctx: Ctx, vote: "higher" | "lower") {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can vote");
  assertState(ctx.session, ["HOL_VOTING"]);

  const { error } = await ctx.admin.from("hol_votes").insert({
    session_id: ctx.session.id,
    question_index: ctx.session.current_question_index,
    player_id: ctx.actor.playerId,
    vote,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already voted this round");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const { count: votesIn } = await ctx.admin
    .from("hol_votes")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("question_index", ctx.session.current_question_index);

  if ((votesIn ?? 0) >= players.length) {
    await revealRound(ctx);
  } else {
    await updateSession(ctx, {});
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["HOL_VOTING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "HOL_REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "HOL_VOTING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const index = ctx.session.current_question_index;
  const items = ctx.session.settings.holItems ?? [];
  const leftValue = items[index]?.value ?? 0;
  const rightValue = items[index + 1]?.value ?? 0;
  const correctAnswer: "higher" | "lower" = rightValue > leftValue ? "higher" : "lower";

  const { data: votes } = await ctx.admin
    .from("hol_votes")
    .select("player_id, vote")
    .eq("session_id", ctx.session.id)
    .eq("question_index", index);

  const rows = votes ?? [];
  const countHigher = rows.filter((r) => r.vote === "higher").length;
  const countLower = rows.filter((r) => r.vote === "lower").length;
  const majority: "higher" | "lower" | "tie" =
    countHigher > countLower ? "higher" : countLower > countHigher ? "lower" : "tie";
  const correct = majority !== "tie" && majority === correctAnswer;
  const correctVoterIds = correct
    ? rows.filter((r) => r.vote === majority).map((r) => r.player_id)
    : [];

  for (const playerId of correctVoterIds) {
    await addPoints(ctx, playerId, HOL_POINTS.correctVoter);
  }

  const payload: PublicPayload = {
    holRound: ctx.session.public_payload.holRound,
    holReveal: {
      leftValue,
      rightValue,
      correctAnswer,
      majority,
      votes: rows.map((r) => ({ playerId: r.player_id, vote: r.vote as "higher" | "lower" })),
      correctVoterIds,
      voterPoints: HOL_POINTS.correctVoter,
    },
  };
  await ctx.admin
    .from("game_sessions")
    .update({ public_payload: payload, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
}

async function handleNextRound(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["HOL_REVEAL"]);
  const next = ctx.session.current_question_index + 1;
  if (next >= ctx.session.question_count) {
    await endGame(ctx);
    return;
  }
  const items = ctx.session.settings.holItems ?? [];
  // The right item from the current round (now revealed) becomes the left
  const knownLeftValue = items[next]?.value ?? null;
  const payload = roundPayload(items, next, knownLeftValue);
  await updateSession(ctx, {
    current_state: "HOL_VOTING",
    current_question_index: next,
    public_payload: payload,
  });
}

async function addPoints(ctx: Ctx, playerId: string, points: number) {
  const { data: row } = await ctx.admin
    .from("scores")
    .select("id, score")
    .eq("session_id", ctx.session.id)
    .eq("player_id", playerId)
    .maybeSingle();
  if (row) {
    await ctx.admin
      .from("scores")
      .update({ score: row.score + points, updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }
}
