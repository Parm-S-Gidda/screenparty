// Most Likely To engine: each round shows a "Most Likely To ___" prompt and
// every player votes for someone else. The player(s) with the most votes are
// the "winners"; people who voted for the top player get points. The top
// player also gets a small bonus for being chosen. Ties cancel points.

import { MLT_POINTS } from "@/lib/constants";
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

export async function applyMltAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "VOTE_MLT":
      return handleVote(ctx, action.targetPlayerId);
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
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Most Likely To`);

  const count = Math.min(ctx.session.settings.questionCount || 8, 30);
  const { data: rows, error } = await ctx.admin
    .from("mlt_prompts")
    .select("text");
  if (error || !rows || rows.length === 0) throw new GameError(500, "No prompts available");
  const prompts = shuffle(rows.map((r) => r.text)).slice(0, count);

  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const payload: PublicPayload = {
    mltRound: { promptText: prompts[0], openedAt: new Date().toISOString() },
  };
  await updateSession(ctx, {
    current_state: "MLT_VOTING",
    current_question_index: 0,
    question_count: prompts.length,
    settings: { ...ctx.session.settings, mltPrompts: prompts },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleVote(ctx: Ctx, targetPlayerId: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can vote");
  assertState(ctx.session, ["MLT_VOTING"]);
  const voterId = ctx.actor.playerId;
  if (voterId === targetPlayerId) throw new GameError(400, "You can't vote for yourself");

  const players = await activePlayers(ctx);
  if (!players.some((p) => p.id === targetPlayerId))
    throw new GameError(400, "That player isn't in the game");

  const { error } = await ctx.admin.from("mlt_votes").insert({
    session_id: ctx.session.id,
    prompt_index: ctx.session.current_question_index,
    voter_id: voterId,
    target_player_id: targetPlayerId,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already voted this round");
    throw new GameError(500, error.message);
  }

  // Auto-reveal once everyone who can vote has voted (everyone except self)
  const votersNeeded = players.length; // everyone votes (for someone else)
  const { count: votesIn } = await ctx.admin
    .from("mlt_votes")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", ctx.session.current_question_index);

  if ((votesIn ?? 0) >= votersNeeded) {
    await revealRound(ctx);
  } else {
    await updateSession(ctx, {});
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["MLT_VOTING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "MLT_VOTING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const { data: votes } = await ctx.admin
    .from("mlt_votes")
    .select("voter_id, target_player_id")
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", ctx.session.current_question_index);

  const rows = votes ?? [];
  const tally = new Map<string, number>();
  for (const v of rows) {
    tally.set(v.target_player_id, (tally.get(v.target_player_id) ?? 0) + 1);
  }

  const maxVotes = Math.max(0, ...tally.values());
  const topPlayerIds = maxVotes === 0 ? [] : [...tally.entries()]
    .filter(([, c]) => c === maxVotes)
    .map(([id]) => id);

  // Only award points if there is a single top player (ties = no points)
  const isTie = topPlayerIds.length !== 1;
  const winnerVoterIds = isTie ? [] : rows
    .filter((v) => v.target_player_id === topPlayerIds[0])
    .map((v) => v.voter_id);

  if (!isTie) {
    for (const voterId of winnerVoterIds) {
      await addPoints(ctx, voterId, MLT_POINTS.correctVoter);
    }
    await addPoints(ctx, topPlayerIds[0], MLT_POINTS.topPlayer);
  }

  const payload: PublicPayload = {
    mltRound: ctx.session.public_payload.mltRound,
    mltReveal: {
      votes: rows.map((v) => ({ voterId: v.voter_id, targetId: v.target_player_id })),
      topPlayerIds,
      winnerVoterIds,
      voterPoints: MLT_POINTS.correctVoter,
      topPlayerPoints: MLT_POINTS.topPlayer,
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
    // REVEAL → SCOREBOARD or next round
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
  const prompts = ctx.session.settings.mltPrompts ?? [];
  const payload: PublicPayload = {
    mltRound: { promptText: prompts[next], openedAt: new Date().toISOString() },
  };
  await updateSession(ctx, {
    current_state: "MLT_VOTING",
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
