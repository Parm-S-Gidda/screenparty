// Guess the Player engine: each round a prompt (question or fill-in-the-blank)
// is shown and everyone submits an answer. Then each answer is revealed one at
// a time for the group to guess who wrote it. Correct guessers score; the
// writer scores per person they fooled.

import { GTP_POINTS, LIMITS } from "@/lib/constants";
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

export async function applyGtpAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_GTP_ANSWER":
      return handleSubmitAnswer(ctx, action.text);
    case "GUESS_GTP_PLAYER":
      return handleGuess(ctx, action.playerId);
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
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Guess the Player`);

  const count = Math.min(ctx.session.settings.questionCount || 5, 15);
  const { data: rows, error } = await ctx.admin
    .from("gtp_prompts")
    .select("text, mode");
  if (error || !rows || rows.length === 0) throw new GameError(500, "No prompts available");
  const prompts = shuffle(rows).slice(0, count).map((r) => ({
    text: r.text,
    mode: r.mode as "prompt" | "fill_blank",
  }));

  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const payload: PublicPayload = {
    gtpRound: {
      promptText: prompts[0].text,
      mode: prompts[0].mode,
      answerIndex: -1, // -1 = in answering phase (no answer being shown yet)
      totalAnswers: 0,
      openedAt: new Date().toISOString(),
    },
  };
  await updateSession(ctx, {
    current_state: "GTP_ANSWERING",
    current_question_index: 0,
    question_count: prompts.length,
    settings: { ...ctx.session.settings, gtpPrompts: prompts },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleSubmitAnswer(ctx: Ctx, rawText: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can answer");
  assertState(ctx.session, ["GTP_ANSWERING"]);

  const text = String(rawText ?? "").trim().slice(0, LIMITS.gtpAnswerMaxLength);
  if (text.length < 1) throw new GameError(400, "Answer can't be empty");
  if (containsBlockedWord(text)) throw new GameError(400, "Keep your answer friendly");

  const { error } = await ctx.admin.from("gtp_answers").insert({
    session_id: ctx.session.id,
    prompt_index: ctx.session.current_question_index,
    player_id: ctx.actor.playerId,
    answer_text: text,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already submitted an answer");
    throw new GameError(500, error.message);
  }

  const players = await activePlayers(ctx);
  const { data: submitted } = await ctx.admin
    .from("gtp_answers")
    .select("player_id")
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", ctx.session.current_question_index);
  const submittedIds = new Set((submitted ?? []).map((s) => s.player_id));

  if (players.every((p) => submittedIds.has(p.id))) {
    await startGuessingPhase(ctx, 0);
  } else {
    await updateSession(ctx, {});
  }
}

async function startGuessingPhase(ctx: Ctx, answerIndex: number) {
  const promptIndex = ctx.session.current_question_index;
  const { data: answers } = await ctx.admin
    .from("gtp_answers")
    .select("player_id, answer_text")
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", promptIndex);

  if (!answers || answers.length === 0) throw new GameError(500, "No answers found");

  // Shuffle once (stored in settings per prompt) or use existing order
  let answerOrder = ctx.session.settings.gtpAnswerOrder?.[promptIndex];
  if (!answerOrder) {
    answerOrder = shuffle(answers.map((a) => a.player_id));
    const existing = ctx.session.settings.gtpAnswerOrder ?? [];
    existing[promptIndex] = answerOrder;
    ctx.session.settings.gtpAnswerOrder = existing;
    await ctx.admin
      .from("game_sessions")
      .update({ settings: ctx.session.settings, updated_at: new Date().toISOString() })
      .eq("id", ctx.session.id);
  }

  const authorId = answerOrder[answerIndex];
  const answerRow = answers.find((a) => a.player_id === authorId);
  if (!answerRow) throw new GameError(500, "Answer not found for player");

  const prompts = ctx.session.settings.gtpPrompts ?? [];
  const payload: PublicPayload = {
    gtpRound: {
      promptText: prompts[promptIndex]?.text ?? "",
      mode: prompts[promptIndex]?.mode ?? "prompt",
      answerIndex,
      totalAnswers: answerOrder.length,
      openedAt: new Date().toISOString(),
    },
    gtpGuessing: { answerText: answerRow.answer_text, openedAt: new Date().toISOString() },
  };
  await updateSession(ctx, {
    current_state: "GTP_GUESSING",
    public_payload: payload,
    current_player_id: null,
  });
}

async function handleGuess(ctx: Ctx, guessedPlayerId: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can guess");
  assertState(ctx.session, ["GTP_GUESSING"]);

  const promptIndex = ctx.session.current_question_index;
  const answerIndex = ctx.session.public_payload.gtpRound?.answerIndex ?? 0;
  const answerOrder = ctx.session.settings.gtpAnswerOrder?.[promptIndex] ?? [];
  const authorId = answerOrder[answerIndex];
  if (!authorId) throw new GameError(500, "No active answer");
  if (ctx.actor.playerId === authorId) throw new GameError(403, "You can't guess your own answer");

  const players = await activePlayers(ctx);
  if (!players.some((p) => p.id === guessedPlayerId))
    throw new GameError(400, "That player isn't in the game");

  const { error } = await ctx.admin.from("gtp_guesses").insert({
    session_id: ctx.session.id,
    prompt_index: promptIndex,
    answer_player_id: authorId,
    guesser_id: ctx.actor.playerId,
    guessed_player_id: guessedPlayerId,
  });
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already guessed this answer");
    throw new GameError(500, error.message);
  }

  // How many guessers are expected (everyone except the author)
  const guessersNeeded = players.filter((p) => p.id !== authorId).length;
  const { count: guessesIn } = await ctx.admin
    .from("gtp_guesses")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", promptIndex)
    .eq("answer_player_id", authorId);

  if ((guessesIn ?? 0) >= guessersNeeded) {
    await revealAnswer(ctx, promptIndex, answerIndex, authorId);
  } else {
    await updateSession(ctx, {});
  }
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["GTP_GUESSING"]);
  const promptIndex = ctx.session.current_question_index;
  const answerIndex = ctx.session.public_payload.gtpRound?.answerIndex ?? 0;
  const answerOrder = ctx.session.settings.gtpAnswerOrder?.[promptIndex] ?? [];
  const authorId = answerOrder[answerIndex];
  if (!authorId) throw new GameError(500, "No active answer");
  await revealAnswer(ctx, promptIndex, answerIndex, authorId);
}

async function revealAnswer(
  ctx: Ctx,
  promptIndex: number,
  answerIndex: number,
  authorId: string
) {
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "GTP_GUESSING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const { data: guesses } = await ctx.admin
    .from("gtp_guesses")
    .select("guesser_id, guessed_player_id")
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", promptIndex)
    .eq("answer_player_id", authorId);

  const { data: answerRow } = await ctx.admin
    .from("gtp_answers")
    .select("answer_text")
    .eq("session_id", ctx.session.id)
    .eq("prompt_index", promptIndex)
    .eq("player_id", authorId)
    .maybeSingle();

  const rows = guesses ?? [];
  const correctGuesserIds = rows
    .filter((g) => g.guessed_player_id === authorId)
    .map((g) => g.guesser_id);
  const fooledCount = rows.filter((g) => g.guessed_player_id !== authorId).length;

  for (const guesserId of correctGuesserIds) {
    await addPoints(ctx, guesserId, GTP_POINTS.correctGuess);
  }
  if (fooledCount > 0) {
    await addPoints(ctx, authorId, fooledCount * GTP_POINTS.perFooled);
  }

  const prompts = ctx.session.settings.gtpPrompts ?? [];
  const answerOrder = ctx.session.settings.gtpAnswerOrder?.[promptIndex] ?? [];
  const payload: PublicPayload = {
    gtpRound: {
      promptText: prompts[promptIndex]?.text ?? "",
      mode: prompts[promptIndex]?.mode ?? "prompt",
      answerIndex,
      totalAnswers: answerOrder.length,
      openedAt: ctx.session.public_payload.gtpRound?.openedAt ?? new Date().toISOString(),
    },
    gtpReveal: {
      answerPlayerId: authorId,
      answerText: answerRow?.answer_text ?? "",
      guesses: rows.map((g) => ({ guesserId: g.guesser_id, guessedId: g.guessed_player_id })),
      correctGuesserIds,
      guesserPoints: GTP_POINTS.correctGuess,
      writerPoints: GTP_POINTS.perFooled,
    },
  };
  await ctx.admin
    .from("game_sessions")
    .update({ public_payload: payload, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
}

async function handleNextRound(ctx: Ctx) {
  assertHost(ctx);
  const promptIndex = ctx.session.current_question_index;

  if (ctx.session.current_state === "REVEAL") {
    const answerOrder = ctx.session.settings.gtpAnswerOrder?.[promptIndex] ?? [];
    const currentAnswerIndex = ctx.session.public_payload.gtpRound?.answerIndex ?? 0;
    const nextAnswerIndex = currentAnswerIndex + 1;

    if (nextAnswerIndex < answerOrder.length) {
      // More answers to reveal for this prompt
      await startGuessingPhase(ctx, nextAnswerIndex);
      return;
    }
    // All answers for this prompt revealed → scoreboard
    if (promptIndex + 1 >= ctx.session.question_count) {
      await endGame(ctx);
      return;
    }
    await updateSession(ctx, { current_state: "SCOREBOARD", public_payload: {} });
    return;
  }

  assertState(ctx.session, ["SCOREBOARD"]);
  const nextPrompt = promptIndex + 1;
  if (nextPrompt >= ctx.session.question_count) {
    await endGame(ctx);
    return;
  }

  const prompts = ctx.session.settings.gtpPrompts ?? [];
  const payload: PublicPayload = {
    gtpRound: {
      promptText: prompts[nextPrompt]?.text ?? "",
      mode: prompts[nextPrompt]?.mode ?? "prompt",
      answerIndex: -1,
      totalAnswers: 0,
      openedAt: new Date().toISOString(),
    },
  };
  await updateSession(ctx, {
    current_state: "GTP_ANSWERING",
    current_question_index: nextPrompt,
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
