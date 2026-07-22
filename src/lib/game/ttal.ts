// Two Truths and a Lie engine (PRD §29). Same server-authoritative pattern as
// trivia: this module is the only writer of game state, statements' odd flags
// and live votes stay server-side until the engine reveals them in
// public_payload. Supports the "Two Lies and a Truth" variation, the odd
// statement is the truth instead; mechanics are identical.
//
// The game runs `settings.rounds` full cycles (default 3): each cycle every
// player writes a fresh set of statements (COLLECTING), then everyone takes a
// turn as the subject. Statement slots are fixed, truths first, the lie last
// (or the truth first in the two-lies variation), so the odd index is derived
// server-side from the variation, and the statements are shuffled when shown.

import { TTAL_POINTS, LIMITS } from "@/lib/constants";
import { trackUsage } from "@/lib/ai/usage";
import { containsBlockedWord } from "@/lib/moderation";
import {
  activePlayers,
  assertState,
  endGame,
  GameError,
  handleSelectHost,
  isHostActor,
  shuffle,
  updateSession,
  type Ctx,
} from "./engine";
import type { GameAction, PublicPayload } from "./types";

const MIN_PLAYERS = 3; // a subject plus at least two voters

export async function applyTtalAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "SELECT_HOST":
      // optional in TTAL: a player-host plays normally but paces the rounds
      // from their phone instead of the main screen
      if (ctx.actor.kind !== "account_host")
        throw new GameError(403, "Only the room owner can do that");
      return handleSelectHost(ctx, action.playerId);
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_STATEMENTS":
      return handleSubmitStatements(ctx, action.statements);
    case "CAST_VOTE":
      return handleCastVote(ctx, action.statementId);
    case "REVEAL_ROUND":
      return handleForceReveal(ctx);
    case "SHOW_SCOREBOARD":
      return handleShowScoreboard(ctx);
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

function assertPlayer(ctx: Ctx): string {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can do that");
  return ctx.actor.playerId;
}

// current_question_index walks the flattened turn list: cycle * len + position
function orderInfo(ctx: Ctx) {
  const order = ctx.session.settings.subjectOrder ?? [];
  const rounds = Math.max(Number(ctx.session.settings.rounds) || 1, 1);
  return { order, rounds, len: order.length };
}

function currentCycle(ctx: Ctx): number {
  const { len } = orderInfo(ctx);
  return len > 0 ? Math.floor(ctx.session.current_question_index / len) : 0;
}

// ---------------------------------------------------------------------------

async function handleStart(ctx: Ctx) {
  if (ctx.actor.kind !== "account_host")
    throw new GameError(403, "Only the room owner can do that");
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (players.length < MIN_PLAYERS)
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for this game`);
  // self mode: a player-host paces the rounds from their phone (they still play)
  if (ctx.session.host_mode === "self" && !players.some((p) => p.is_host)) {
    throw new GameError(400, "Select a player to host first");
  }

  const subjectOrder = shuffle(players.map((p) => p.id));
  const rounds = Math.max(Number(ctx.session.settings.rounds) || 1, 1);

  const { error } = await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );
  if (error) throw new GameError(500, error.message);

  await updateSession(ctx, {
    current_state: "COLLECTING",
    current_question_index: 0,
    question_count: subjectOrder.length * rounds,
    settings: { ...ctx.session.settings, subjectOrder, rounds },
    started_at: new Date().toISOString(),
    public_payload: {},
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleSubmitStatements(ctx: Ctx, rawStatements: string[]) {
  const playerId = assertPlayer(ctx);
  assertState(ctx.session, ["COLLECTING"]);
  const cycle = currentCycle(ctx);

  if (!Array.isArray(rawStatements) || rawStatements.length !== 3)
    throw new GameError(400, "Submit exactly three statements");
  // fixed slots: two_truths = truth, truth, lie, two_lies = truth, lie, lie
  const oddIndex = ctx.session.settings.variation === "two_lies" ? 0 : 2;

  const statements = rawStatements.map((s) =>
    String(s ?? "").replace(/\s+/g, " ").trim().slice(0, LIMITS.statementMaxLength)
  );
  for (const s of statements) {
    if (s.length < 3) throw new GameError(400, "Each statement needs at least a few words");
    if (containsBlockedWord(s)) throw new GameError(400, "Keep your statements friendly");
  }
  const distinct = new Set(statements.map((s) => s.toLowerCase()));
  if (distinct.size !== 3) throw new GameError(400, "Your statements must all be different");

  const { count: already } = await ctx.admin
    .from("ttal_statements")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("player_id", playerId)
    .eq("round_number", cycle);
  if ((already ?? 0) > 0) throw new GameError(409, "You already submitted your statements");

  const { error } = await ctx.admin.from("ttal_statements").insert(
    statements.map((text, i) => ({
      session_id: ctx.session.id,
      player_id: playerId,
      round_number: cycle,
      statement_index: i,
      text,
      is_odd: i === oddIndex,
    }))
  );
  if (error) throw new GameError(500, error.message);

  // everyone in? → first turn of this cycle. Otherwise just bump so screens refresh.
  const players = await activePlayers(ctx);
  const { data: submitted } = await ctx.admin
    .from("ttal_statements")
    .select("player_id")
    .eq("session_id", ctx.session.id)
    .eq("round_number", cycle);
  const submittedIds = new Set((submitted ?? []).map((s) => s.player_id));
  const allIn = players.every((p) => submittedIds.has(p.id));

  if (allIn) {
    await startTurn(ctx, ctx.session.current_question_index, "COLLECTING");
  } else {
    await updateSession(ctx, {});
  }
}

// Move to turn `index`, skipping subjects who left or never submitted. If the
// cycle is exhausted, either collect fresh statements for the next round or
// end the game.
async function startTurn(ctx: Ctx, index: number, fromState: "COLLECTING" | "SCOREBOARD") {
  const { order, len } = orderInfo(ctx);
  const players = await activePlayers(ctx);
  const activeIds = new Set(players.map((p) => p.id));
  const cycle = len > 0 ? Math.floor(index / len) : 0;
  const cycleEnd = (cycle + 1) * len;

  let subjectId: string | null = null;
  let i = index;
  for (; i < cycleEnd; i++) {
    const pid = order[i % len];
    if (!activeIds.has(pid)) continue;
    const { count } = await ctx.admin
      .from("ttal_statements")
      .select("id", { count: "exact", head: true })
      .eq("session_id", ctx.session.id)
      .eq("player_id", pid)
      .eq("round_number", cycle);
    if ((count ?? 0) === 3) {
      subjectId = pid;
      break;
    }
  }
  if (!subjectId) {
    await startCollecting(ctx, cycleEnd, fromState);
    return;
  }

  const { data: statements, error } = await ctx.admin
    .from("ttal_statements")
    .select("id, text")
    .eq("session_id", ctx.session.id)
    .eq("player_id", subjectId)
    .eq("round_number", cycle);
  if (error || !statements) throw new GameError(500, "Could not load statements");

  const shuffled = shuffle(statements);
  const payload: PublicPayload = {
    ttalRound: {
      subjectId,
      statements: shuffled.map((s) => ({ id: s.id, text: s.text })),
      votingOpenedAt: new Date().toISOString(),
    },
  };

  // guarded transition (assertState covers the single-action path; the eq()
  // in updateSession covers races)
  assertState(ctx.session, [fromState]);
  await updateSession(ctx, {
    current_state: "VOTING",
    current_question_index: i,
    current_player_id: subjectId,
    public_payload: payload,
  });
}

// Enter COLLECTING for the cycle starting at `index`, everyone writes a fresh
// set of statements, or end the game when all rounds are played.
async function startCollecting(
  ctx: Ctx,
  index: number,
  fromState: "COLLECTING" | "SCOREBOARD"
) {
  const { rounds, len } = orderInfo(ctx);
  if (len === 0 || index >= len * rounds) {
    await endGame(ctx);
    return;
  }
  assertState(ctx.session, [fromState]);
  await updateSession(ctx, {
    current_state: "COLLECTING",
    current_question_index: index,
    current_player_id: null,
    public_payload: {},
  });
}

async function handleCastVote(ctx: Ctx, statementId: string) {
  const voterId = assertPlayer(ctx);
  assertState(ctx.session, ["VOTING"]);
  const cycle = currentCycle(ctx);
  const round = ctx.session.public_payload.ttalRound;
  if (!round) throw new GameError(500, "No active round");
  if (voterId === round.subjectId)
    throw new GameError(403, "You can't vote on your own statements");
  if (!round.statements.some((s) => s.id === statementId))
    throw new GameError(400, "That statement isn't part of this round");

  const { error } = await ctx.admin.from("ttal_votes").insert({
    session_id: ctx.session.id,
    subject_player_id: round.subjectId,
    voter_player_id: voterId,
    statement_id: statementId,
    round_number: cycle,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already voted this round");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const votersNeeded = players.filter((p) => p.id !== round.subjectId).length;
  const { count: votesIn } = await ctx.admin
    .from("ttal_votes")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("subject_player_id", round.subjectId)
    .eq("round_number", cycle);

  if ((votesIn ?? 0) >= votersNeeded) {
    await revealRound(ctx);
  } else {
    await updateSession(ctx, {}); // bump so screens update the votes-in counter
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["VOTING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const round = ctx.session.public_payload.ttalRound;
  if (!round) throw new GameError(500, "No active round");
  const cycle = currentCycle(ctx);

  // Claim the transition first: with several last-votes racing, only one
  // caller gets to score the round.
  const { data: claimed, error: claimError } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "VOTING")
    .select("id");
  if (claimError) throw new GameError(500, claimError.message);
  if (!claimed || claimed.length === 0) return; // someone else got there first

  const { data: statements } = await ctx.admin
    .from("ttal_statements")
    .select("id, is_odd")
    .eq("session_id", ctx.session.id)
    .eq("player_id", round.subjectId)
    .eq("round_number", cycle);
  const odd = statements?.find((s) => s.is_odd);
  if (!odd) throw new GameError(500, "Round has no odd statement");

  const { data: votes } = await ctx.admin
    .from("ttal_votes")
    .select("voter_player_id, statement_id")
    .eq("session_id", ctx.session.id)
    .eq("subject_player_id", round.subjectId)
    .eq("round_number", cycle);

  const correctVoterIds: string[] = [];
  const fooledVoterIds: string[] = [];
  for (const vote of votes ?? []) {
    (vote.statement_id === odd.id ? correctVoterIds : fooledVoterIds).push(vote.voter_player_id);
  }

  for (const voterId of correctVoterIds) {
    await addPoints(ctx, voterId, TTAL_POINTS.correctGuess);
  }
  const subjectPoints = fooledVoterIds.length * TTAL_POINTS.perFooled;
  if (subjectPoints > 0) await addPoints(ctx, round.subjectId, subjectPoints);

  const payload: PublicPayload = {
    ttalRound: round,
    ttalReveal: {
      oddStatementId: odd.id,
      votes: (votes ?? []).map((v) => ({ voterId: v.voter_player_id, statementId: v.statement_id })),
      correctVoterIds,
      fooledVoterIds,
      subjectPoints,
      guesserPoints: TTAL_POINTS.correctGuess,
    },
  };
  const { error } = await ctx.admin
    .from("game_sessions")
    .update({ public_payload: payload, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
  if (error) throw new GameError(500, error.message);
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

async function handleShowScoreboard(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["REVEAL"]);
  const isLast = ctx.session.current_question_index + 1 >= ctx.session.question_count;
  if (isLast) {
    await endGame(ctx);
    return;
  }
  await updateSession(ctx, { current_state: "SCOREBOARD", public_payload: {} });
}

async function handleNextRound(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["SCOREBOARD"]);
  const { rounds, len } = orderInfo(ctx);
  const next = ctx.session.current_question_index + 1;
  if (len === 0 || next >= len * rounds) {
    await endGame(ctx);
    return;
  }
  if (next % len === 0) {
    // cycle finished: everyone writes new statements for the next round
    await startCollecting(ctx, next, "SCOREBOARD");
    return;
  }
  await startTurn(ctx, next, "SCOREBOARD");
}
