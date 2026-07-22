// Number Rating Game: each round one player is "the guesser", they see a
// theme but no number. Everyone else secretly gets a number 1–10 and submits
// an example that represents that position on the scale. Once all examples are
// in, the guesser sees them (authors hidden) and assigns a number to each.
// Points are awarded based on how close the guesser's number is to the actual.

import { NUM_POINTS, LIMITS } from "@/lib/constants";
import { containsBlockedWord } from "@/lib/moderation";
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

export async function applyNumAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_NUM_EXAMPLE":
      return handleSubmitExample(ctx, action.text);
    case "SUBMIT_NUM_GUESSES":
      return handleSubmitGuesses(ctx, action.guesses);
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

function distributeNumbers(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [5];
  const step = 9 / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(1 + i * step));
}

async function handleStart(ctx: Ctx) {
  if (ctx.actor.kind !== "account_host")
    throw new GameError(403, "Only the room owner can do that");
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (players.length < MIN_PLAYERS)
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Number Rating`);

  const { data: rows, error } = await ctx.admin
    .from("num_themes")
    .select("theme, scale_low, scale_high");
  if (error || !rows || rows.length === 0) throw new GameError(500, "No themes available");

  const count = players.length; // one round per player (each is guesser once)
  const themes = shuffle(rows).slice(0, count).map((r) => ({
    theme: r.theme,
    scaleLow: r.scale_low,
    scaleHigh: r.scale_high,
  }));

  const guesserOrder = shuffle(players.map((p) => p.id));

  // Pre-assign numbers for each round
  const numNumberAssignments = guesserOrder.map((guesserId) => {
    const exampleGivers = players.filter((p) => p.id !== guesserId);
    const numbers = distributeNumbers(exampleGivers.length);
    return shuffle(exampleGivers).map((p, i) => ({ playerId: p.id, number: numbers[i] }));
  });

  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const firstGuesser = guesserOrder[0];
  const payload: PublicPayload = {
    numRound: {
      guesserPlayerId: firstGuesser,
      theme: themes[0].theme,
      scaleLow: themes[0].scaleLow,
      scaleHigh: themes[0].scaleHigh,
      openedAt: new Date().toISOString(),
    },
  };
  await updateSession(ctx, {
    current_state: "NUM_SUBMITTING",
    current_question_index: 0,
    question_count: count,
    current_player_id: firstGuesser,
    settings: {
      ...ctx.session.settings,
      numThemes: themes,
      numGuesserOrder: guesserOrder,
      numNumberAssignments,
    },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleSubmitExample(ctx: Ctx, rawText: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can submit examples");
  const playerId = ctx.actor.playerId;
  assertState(ctx.session, ["NUM_SUBMITTING"]);

  const guesserOrder = ctx.session.settings.numGuesserOrder ?? [];
  const guesserPlayerId = guesserOrder[ctx.session.current_question_index];
  if (playerId === guesserPlayerId)
    throw new GameError(403, "The guesser doesn't submit an example");

  const text = String(rawText ?? "").trim().slice(0, LIMITS.numExampleMaxLength);
  if (text.length < 1) throw new GameError(400, "Example can't be empty");
  if (containsBlockedWord(text)) throw new GameError(400, "Keep your example friendly");

  // Find this player's assigned number
  const assignments = ctx.session.settings.numNumberAssignments?.[ctx.session.current_question_index] ?? [];
  const myAssignment = assignments.find((a) => a.playerId === playerId);
  if (!myAssignment) throw new GameError(400, "You don't have a number assignment this round");

  const { error } = await ctx.admin.from("num_examples").insert({
    session_id: ctx.session.id,
    round_index: ctx.session.current_question_index,
    player_id: playerId,
    example_text: text,
    actual_number: myAssignment.number,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already submitted an example");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const exampleGiversNeeded = players.filter((p) => p.id !== guesserPlayerId).length;
  const { count: submitted } = await ctx.admin
    .from("num_examples")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index);

  if ((submitted ?? 0) >= exampleGiversNeeded) {
    await startGuessingPhase(ctx);
  } else {
    await updateSession(ctx, {});
  }
}

async function startGuessingPhase(ctx: Ctx) {
  const { data: examples } = await ctx.admin
    .from("num_examples")
    .select("player_id, example_text")
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index);

  const shuffledExamples = shuffle(examples ?? []).map((e) => ({
    playerId: e.player_id,
    exampleText: e.example_text,
  }));

  const round = ctx.session.public_payload.numRound;
  const payload: PublicPayload = {
    numRound: round,
    numGuessing: { examples: shuffledExamples, openedAt: new Date().toISOString() },
  };
  await updateSession(ctx, { current_state: "NUM_GUESSING", public_payload: payload });
}

async function handleSubmitGuesses(
  ctx: Ctx,
  guesses: { playerId: string; number: number }[]
) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can submit guesses");
  const playerId = ctx.actor.playerId;
  assertState(ctx.session, ["NUM_GUESSING"]);

  const guesserOrder = ctx.session.settings.numGuesserOrder ?? [];
  const guesserPlayerId = guesserOrder[ctx.session.current_question_index];
  if (playerId !== guesserPlayerId)
    throw new GameError(403, "Only the guesser submits guesses this round");

  const examples = ctx.session.public_payload.numGuessing?.examples ?? [];
  if (guesses.length !== examples.length)
    throw new GameError(400, "Submit a guess for every example");

  for (const g of guesses) {
    if (!Number.isInteger(g.number) || g.number < 1 || g.number > 10)
      throw new GameError(400, "Numbers must be integers 1–10");
    if (!examples.some((e) => e.playerId === g.playerId))
      throw new GameError(400, "Unknown player in guesses");
  }

  // Insert all guesses
  const insertRows = guesses.map((g) => ({
    session_id: ctx.session.id,
    round_index: ctx.session.current_question_index,
    guesser_id: playerId,
    example_player_id: g.playerId,
    guessed_number: g.number,
  }));
  const { error } = await ctx.admin.from("num_guesses").insert(insertRows);
  if (error) {
    if (error.code === "23505") throw new GameError(409, "Guesses already submitted");
    throw new GameError(500, error.message);
  }

  await revealRound(ctx);
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["NUM_GUESSING"]);
  await revealRound(ctx);
}

async function revealRound(ctx: Ctx) {
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "NUM_GUESSING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const round = ctx.session.public_payload.numRound;
  const { data: examples } = await ctx.admin
    .from("num_examples")
    .select("player_id, example_text, actual_number")
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index);

  const guesserOrder = ctx.session.settings.numGuesserOrder ?? [];
  const guesserPlayerId = guesserOrder[ctx.session.current_question_index];

  const { data: guessRows } = await ctx.admin
    .from("num_guesses")
    .select("example_player_id, guessed_number")
    .eq("session_id", ctx.session.id)
    .eq("round_index", ctx.session.current_question_index)
    .eq("guesser_id", guesserPlayerId);

  const guessMap = new Map((guessRows ?? []).map((g) => [g.example_player_id, g.guessed_number]));

  const enriched = (examples ?? []).map((e) => {
    const guessedNumber = guessMap.get(e.player_id) ?? null;
    const diff = guessedNumber !== null ? Math.abs(e.actual_number - guessedNumber) : 9;
    let points = 0;
    if (diff === 0) points = NUM_POINTS.exactMatch;
    else if (diff <= 1) points = NUM_POINTS.close;
    else if (diff <= 2) points = NUM_POINTS.near;

    return {
      playerId: e.player_id,
      exampleText: e.example_text,
      actualNumber: e.actual_number,
      guessedNumber,
      points,
    };
  });

  for (const ex of enriched) {
    if (ex.points > 0) await addPoints(ctx, ex.playerId, ex.points);
  }

  // Guesser earns based on average accuracy
  const diffs = enriched.map((e) =>
    e.guessedNumber !== null ? Math.abs(e.actualNumber - e.guessedNumber) : 9
  );
  const avgDiff = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 9;
  const accuracy = Math.max(0, 1 - avgDiff / 9);
  const guesserPoints = Math.round(NUM_POINTS.guesserBase * accuracy);
  if (guesserPoints > 0) await addPoints(ctx, guesserPlayerId, guesserPoints);

  const payload: PublicPayload = {
    numReveal: {
      guesserPlayerId,
      theme: round?.theme ?? "",
      scaleLow: round?.scaleLow ?? "Worst",
      scaleHigh: round?.scaleHigh ?? "Best",
      examples: enriched,
      guesserPoints,
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

  const guesserOrder = ctx.session.settings.numGuesserOrder ?? [];
  const themes = ctx.session.settings.numThemes ?? [];
  const nextGuesser = guesserOrder[next];
  const payload: PublicPayload = {
    numRound: {
      guesserPlayerId: nextGuesser,
      theme: themes[next]?.theme ?? "",
      scaleLow: themes[next]?.scaleLow ?? "Worst",
      scaleHigh: themes[next]?.scaleHigh ?? "Best",
      openedAt: new Date().toISOString(),
    },
  };
  await updateSession(ctx, {
    current_state: "NUM_SUBMITTING",
    current_question_index: next,
    current_player_id: nextGuesser,
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
