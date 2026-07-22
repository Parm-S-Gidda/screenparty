// Shark Tank engine: each player gets a random product/business to pitch.
// One person pitches at a time (the main screen shows a countdown timer).
// After the pitch, others vote INVEST or PASS. The pitcher earns points per
// investor.

import { TANK_POINTS } from "@/lib/constants";
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

const MIN_PLAYERS = 3;
const DEFAULT_PITCH_SECONDS = 60;

export async function applyTankAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_TANK_INVESTMENT":
      return handleInvestment(ctx, action.invest);
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
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Shark Tank`);

  const { data: rows, error } = await ctx.admin
    .from("tank_products")
    .select("name, tagline");
  if (error || !rows || rows.length < players.length)
    throw new GameError(500, "Not enough products available");

  const shuffledPlayers = shuffle(players);
  const shuffledProducts = shuffle(rows);
  const tankProducts = shuffledPlayers.map((p, i) => ({
    pitcherId: p.id,
    productName: shuffledProducts[i].name,
    tagline: shuffledProducts[i].tagline,
  }));

  const pitchSeconds = DEFAULT_PITCH_SECONDS;
  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const first = tankProducts[0];
  const payload: PublicPayload = {
    tankRound: {
      pitcherId: first.pitcherId,
      productName: first.productName,
      tagline: first.tagline,
      pitchStart: new Date().toISOString(),
      pitchSeconds,
    },
  };
  await updateSession(ctx, {
    current_state: "TANK_PITCHING",
    current_question_index: 0,
    question_count: players.length,
    current_player_id: first.pitcherId,
    settings: { ...ctx.session.settings, tankProducts, tankPitchSeconds: pitchSeconds },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleInvestment(ctx: Ctx, invest: boolean) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can invest");
  assertState(ctx.session, ["TANK_INVESTING"]);

  const products = ctx.session.settings.tankProducts ?? [];
  const pitcher = products[ctx.session.current_question_index];
  if (!pitcher) throw new GameError(500, "No active pitch");
  if (ctx.actor.playerId === pitcher.pitcherId)
    throw new GameError(403, "You can't invest in your own pitch");

  const { error } = await ctx.admin.from("tank_investments").insert({
    session_id: ctx.session.id,
    round_index: ctx.session.current_question_index,
    investor_id: ctx.actor.playerId,
    invested: invest,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already voted this round");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const investorsNeeded = players.filter((p) => p.id !== pitcher.pitcherId).length;
  const { count: investmentsIn } = await ctx.admin
    .from("tank_investments")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index);

  if ((investmentsIn ?? 0) >= investorsNeeded) {
    await revealRound(ctx);
  } else {
    await updateSession(ctx, {});
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  // Force reveal from either pitching (pitch cut short) or investing (time's up)
  if (ctx.session.current_state === "TANK_PITCHING") {
    const products = ctx.session.settings.tankProducts ?? [];
    const pitcher = products[ctx.session.current_question_index];
    if (!pitcher) throw new GameError(500, "No active pitch");
    const payload: PublicPayload = {
      tankRound: ctx.session.public_payload.tankRound,
    };
    await updateSession(ctx, { current_state: "TANK_INVESTING", public_payload: payload });
    return;
  }
  assertState(ctx.session, ["TANK_INVESTING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "TANK_INVESTING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const products = ctx.session.settings.tankProducts ?? [];
  const pitcher = products[ctx.session.current_question_index];
  const { data: investments } = await ctx.admin
    .from("tank_investments")
    .select("investor_id, invested")
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index);

  const rows = investments ?? [];
  const investorCount = rows.filter((r) => r.invested).length;
  const pitcherPoints = investorCount * TANK_POINTS.perInvestor;
  if (pitcherPoints > 0) await addPoints(ctx, pitcher.pitcherId, pitcherPoints);

  const payload: PublicPayload = {
    tankReveal: {
      pitcherId: pitcher.pitcherId,
      productName: pitcher.productName,
      tagline: pitcher.tagline,
      investments: rows.map((r) => ({ investorId: r.investor_id, invested: r.invested })),
      investorCount,
      pitcherPoints,
    },
  };
  await ctx.admin
    .from("game_sessions")
    .update({ public_payload: payload, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
}

async function handleNextRound(ctx: Ctx) {
  assertHost(ctx);
  const next = ctx.session.current_question_index + 1;

  if (ctx.session.current_state === "REVEAL") {
    if (next >= ctx.session.question_count) {
      await endGame(ctx);
      return;
    }
    await updateSession(ctx, { current_state: "SCOREBOARD", public_payload: {} });
    return;
  }

  assertState(ctx.session, ["SCOREBOARD"]);
  if (next >= ctx.session.question_count) {
    await endGame(ctx);
    return;
  }

  const products = ctx.session.settings.tankProducts ?? [];
  const pitcher = products[next];
  const pitchSeconds = ctx.session.settings.tankPitchSeconds ?? DEFAULT_PITCH_SECONDS;
  const payload: PublicPayload = {
    tankRound: {
      pitcherId: pitcher.pitcherId,
      productName: pitcher.productName,
      tagline: pitcher.tagline,
      pitchStart: new Date().toISOString(),
      pitchSeconds,
    },
  };
  await updateSession(ctx, {
    current_state: "TANK_PITCHING",
    current_question_index: next,
    current_player_id: pitcher.pitcherId,
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
