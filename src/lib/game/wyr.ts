// Majority Would You Rather engine (PRD §29): each round everyone privately
// picks their own answer AND predicts what the majority picked. Correct
// majority predictions score; ties score nothing. Choices and predictions
// live in wyr_answers (service-role only) until the engine reveals them.

import { WYR_POINTS } from "@/lib/constants";
import { trackUsage } from "@/lib/ai/usage";
import {
  activePlayers,
  assertState,
  assertTeamsReady,
  endGame,
  GameError,
  isHostActor,
  shuffle,
  updateSession,
  type Ctx,
} from "./engine";
import type { GameAction, PublicPayload, TeamId } from "./types";

const MIN_PLAYERS = 3; // a "majority" needs at least three opinions

export async function applyWyrAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_WYR":
      return handleSubmit(ctx, action.choice, action.prediction);
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

// ---------------------------------------------------------------------------

async function handleStart(ctx: Ctx) {
  if (ctx.actor.kind !== "account_host")
    throw new GameError(403, "Only the room owner can do that");
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (players.length < MIN_PLAYERS)
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for this game`);
  assertTeamsReady(players, ctx.session.settings.teamsEnabled);

  const { data: pool, error } = await ctx.admin
    .from("wyr_questions")
    .select("option_a, option_b");
  if (error || !pool || pool.length === 0)
    throw new GameError(500, "No questions available");

  const count = Math.min(ctx.session.settings.questionCount || 10, pool.length);
  const questions = shuffle(pool)
    .slice(0, count)
    .map((q) => ({ a: q.option_a, b: q.option_b }));

  const { error: sErr } = await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );
  if (sErr) throw new GameError(500, sErr.message);

  await updateSession(ctx, {
    current_state: "WYR_CHOOSING",
    current_question_index: 0,
    question_count: questions.length,
    settings: { ...ctx.session.settings, wyrQuestions: questions },
    started_at: new Date().toISOString(),
    public_payload: roundPayload(questions, 0),
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

function roundPayload(questions: { a: string; b: string }[], index: number): PublicPayload {
  const q = questions[index];
  return {
    wyrRound: { optionA: q.a, optionB: q.b, openedAt: new Date().toISOString() },
  };
}

async function handleSubmit(ctx: Ctx, choice: "a" | "b", prediction: "a" | "b") {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can answer");
  assertState(ctx.session, ["WYR_CHOOSING"]);
  if (!["a", "b"].includes(choice) || !["a", "b"].includes(prediction))
    throw new GameError(400, "Pick an option and a prediction");

  const { error } = await ctx.admin.from("wyr_answers").insert({
    session_id: ctx.session.id,
    question_index: ctx.session.current_question_index,
    player_id: ctx.actor.playerId,
    choice,
    prediction,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already answered this round");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const { count: answersIn } = await ctx.admin
    .from("wyr_answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("question_index", ctx.session.current_question_index);

  if ((answersIn ?? 0) >= players.length) {
    await revealRound(ctx);
  } else {
    await updateSession(ctx, {}); // bump so screens update the answered counter
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["WYR_CHOOSING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const round = ctx.session.public_payload.wyrRound;
  if (!round) throw new GameError(500, "No active round");

  // claim the transition so racing last-submissions can't double-score
  const { data: claimed, error: claimError } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "WYR_CHOOSING")
    .select("id");
  if (claimError) throw new GameError(500, claimError.message);
  if (!claimed || claimed.length === 0) return;

  const { data: answers } = await ctx.admin
    .from("wyr_answers")
    .select("player_id, choice, prediction")
    .eq("session_id", ctx.session.id)
    .eq("question_index", ctx.session.current_question_index);

  const rows = answers ?? [];
  const countA = rows.filter((r) => r.choice === "a").length;
  const countB = rows.filter((r) => r.choice === "b").length;
  const majority: "a" | "b" | "tie" = countA > countB ? "a" : countB > countA ? "b" : "tie";

  let correctPredictorIds: string[];
  let teamMajorities: Record<TeamId, "a" | "b" | "tie"> | undefined;

  if (ctx.session.settings.teamsEnabled) {
    // PRD §29 team rule: you predict what the OTHER team's majority picks
    const players = await activePlayers(ctx);
    const teamOf = new Map(players.map((p) => [p.id, p.team as TeamId | null]));
    const majorityOfTeam = (team: TeamId): "a" | "b" | "tie" => {
      const picks = rows.filter((r) => teamOf.get(r.player_id) === team);
      const a = picks.filter((r) => r.choice === "a").length;
      const b = picks.filter((r) => r.choice === "b").length;
      return a > b ? "a" : b > a ? "b" : "tie";
    };
    teamMajorities = { red: majorityOfTeam("red"), blue: majorityOfTeam("blue") };
    correctPredictorIds = rows
      .filter((r) => {
        const myTeam = teamOf.get(r.player_id);
        if (myTeam !== "red" && myTeam !== "blue") return false;
        const target = teamMajorities![myTeam === "red" ? "blue" : "red"];
        return target !== "tie" && r.prediction === target;
      })
      .map((r) => r.player_id);
  } else {
    correctPredictorIds =
      majority === "tie" ? [] : rows.filter((r) => r.prediction === majority).map((r) => r.player_id);
  }

  for (const playerId of correctPredictorIds) {
    await addPoints(ctx, playerId, WYR_POINTS.correctPrediction);
  }

  const payload: PublicPayload = {
    wyrRound: round,
    wyrReveal: {
      countA,
      countB,
      majority,
      choices: rows.map((r) => ({ playerId: r.player_id, choice: r.choice as "a" | "b" })),
      correctPredictorIds,
      predictorPoints: WYR_POINTS.correctPrediction,
      teamMajorities,
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
  const questions = ctx.session.settings.wyrQuestions ?? [];
  const nextIndex = ctx.session.current_question_index + 1;
  if (nextIndex >= questions.length) {
    await endGame(ctx);
    return;
  }
  await updateSession(ctx, {
    current_state: "WYR_CHOOSING",
    current_question_index: nextIndex,
    public_payload: roundPayload(questions, nextIndex),
  });
}
