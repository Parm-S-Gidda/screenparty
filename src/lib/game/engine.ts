import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTEMPT_POINTS, LIMITS, MAX_LLM_JUDGMENTS_PER_GAME } from "@/lib/constants";
import { judgeAnswer } from "./judge";
import { trackUsage } from "@/lib/ai/usage";
import type {
  Actor,
  GameAction,
  GameSettings,
  PodiumEntry,
  PublicPayload,
  SessionState,
} from "./types";

export class GameError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type SessionRow = {
  id: string;
  room_id: string;
  game_type: "buzz_trivia" | "ttal" | "wyr";
  host_mode: "self" | "virtual";
  current_state: SessionState;
  current_question_index: number;
  current_player_id: string | null;
  question_count: number;
  settings: GameSettings;
  public_payload: PublicPayload;
};

export type RoomRow = {
  id: string;
  host_user_id: string;
  room_code: string;
  status: string;
  plan_tier: string;
  expires_at: string;
};

export type Ctx = {
  admin: SupabaseClient;
  room: RoomRow;
  session: SessionRow;
  actor: Actor;
};

const HOST_ACTIONS: GameAction["type"][] = [
  "DISPLAY_QUESTION",
  "OPEN_ANSWER",
  "MARK_CORRECT",
  "MARK_INCORRECT",
  "SKIP_QUESTION",
  "SHOW_SCOREBOARD",
  "NEXT_QUESTION",
];
const ACCOUNT_HOST_ACTIONS: GameAction["type"][] = [
  "SELECT_HOST",
  "START_GAME",
  "END_GAME",
];

// Fisher-Yates. Never use sort(() => Math.random() - 0.5): it's heavily
// biased (elements tend to keep their original position), which leaks the
// TTAL odd statement's fixed slot.
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function isHostActor(actor: Actor): boolean {
  return actor.kind === "account_host" || (actor.kind === "player" && actor.isHost);
}

function assertAuthorized(actor: Actor, action: GameAction) {
  if (action.type === "BUZZ_IN" || action.type === "SUBMIT_ANSWER") {
    if (actor.kind !== "player") throw new GameError(403, "Only players can do that");
    return;
  }
  if (ACCOUNT_HOST_ACTIONS.includes(action.type)) {
    if (actor.kind !== "account_host")
      throw new GameError(403, "Only the room owner can do that");
    return;
  }
  if (HOST_ACTIONS.includes(action.type)) {
    if (!isHostActor(actor)) throw new GameError(403, "Only the host can do that");
    return;
  }
  throw new GameError(400, "Unknown action");
}

export function assertState(session: SessionRow, allowed: SessionState[]) {
  if (!allowed.includes(session.current_state)) {
    throw new GameError(409, `Not allowed in state ${session.current_state}`);
  }
}

export async function updateSession(
  ctx: Ctx,
  patch: Partial<{
    current_state: SessionState;
    current_question_index: number;
    current_player_id: string | null;
    question_count: number;
    settings: GameSettings;
    public_payload: PublicPayload;
    started_at: string;
    ended_at: string;
  }>
) {
  const { error } = await ctx.admin
    .from("game_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    // optimistic concurrency: two racing actions can't both advance the machine
    .eq("current_state", ctx.session.current_state);
  if (error) throw new GameError(500, error.message);
}

async function currentQuestion(ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("game_questions")
    .select("id, question_index, question_text, correct_answer, accepted_answers, difficulty")
    .eq("session_id", ctx.session.id)
    .eq("question_index", ctx.session.current_question_index)
    .single();
  if (error || !data) throw new GameError(500, "Question not found");
  return data;
}

export async function activePlayers(ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("room_players")
    .select("id, username, avatar_id, is_host, team")
    .eq("room_id", ctx.room.id)
    .eq("is_kicked", false);
  if (error) throw new GameError(500, error.message);
  return data ?? [];
}

// Team mode is shared across games: assignment happens in the lobby, and both
// teams must be populated before a team game can start.
export async function handleSetTeam(ctx: Ctx, playerId: string, team: "red" | "blue") {
  if (ctx.actor.kind !== "account_host")
    throw new GameError(403, "Only the room owner can move players");
  assertState(ctx.session, ["LOBBY"]);
  if (!ctx.session.settings.teamsEnabled) throw new GameError(400, "Teams are off for this game");
  if (!["red", "blue"].includes(team)) throw new GameError(400, "Unknown team");
  const { error } = await ctx.admin
    .from("room_players")
    .update({ team })
    .eq("id", playerId)
    .eq("room_id", ctx.room.id);
  if (error) throw new GameError(500, error.message);
  await updateSession(ctx, {}); // bump for realtime
}

export function assertTeamsReady(
  players: { id: string; team: string | null }[],
  teamsEnabled: boolean | undefined
) {
  if (!teamsEnabled) return;
  const red = players.filter((p) => p.team === "red").length;
  const blue = players.filter((p) => p.team === "blue").length;
  if (red === 0 || blue === 0)
    throw new GameError(400, "Both teams need at least one player");
}

async function usedAttemptCount(ctx: Ctx, questionId: string) {
  const { count, error } = await ctx.admin
    .from("buzzes")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId)
    .eq("used_attempt", true);
  if (error) throw new GameError(500, error.message);
  return count ?? 0;
}

async function computePodium(ctx: Ctx): Promise<PodiumEntry[]> {
  const { data, error } = await ctx.admin
    .from("scores")
    .select("player_id, score")
    .eq("session_id", ctx.session.id)
    .order("score", { ascending: false });
  if (error) throw new GameError(500, error.message);
  const byScore = new Map<number, string[]>();
  for (const row of data ?? []) {
    byScore.set(row.score, [...(byScore.get(row.score) ?? []), row.player_id]);
  }
  const podium: PodiumEntry[] = [];
  let place = 1;
  for (const [score, playerIds] of byScore) {
    if (place > 3) break;
    podium.push({ place, playerIds, score });
    place += playerIds.length;
  }
  return podium;
}

export async function endGame(ctx: Ctx) {
  const podium = await computePodium(ctx);
  const payload: PublicPayload = { podium };

  // freeze names/avatars/scores into the payload so the results screen stays
  // intact no matter who leaves the room afterwards
  const players = await activePlayers(ctx);
  const { data: scores } = await ctx.admin
    .from("scores")
    .select("player_id, score")
    .eq("session_id", ctx.session.id);
  const scoreOf = new Map((scores ?? []).map((s) => [s.player_id, s.score]));
  payload.finalStandings = players.map((p) => ({
    playerId: p.id,
    username: p.username,
    avatarId: p.avatar_id,
    team: (p.team as "red" | "blue" | null) ?? null,
    score: scoreOf.get(p.id) ?? 0,
  }));

  if (ctx.session.settings.teamsEnabled) {
    const teamOf = new Map<string, string | null>(players.map((p) => [p.id, p.team ?? null]));
    const totals: Record<"red" | "blue", number> = { red: 0, blue: 0 };
    for (const row of scores ?? []) {
      const team = teamOf.get(row.player_id);
      if (team === "red" || team === "blue") totals[team] += row.score;
    }
    payload.teamResult = {
      totals,
      winner: totals.red > totals.blue ? "red" : totals.blue > totals.red ? "blue" : "tie",
    };
  }

  await updateSession(ctx, {
    current_state: "GAME_OVER",
    current_player_id: null,
    ended_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "ended" }).eq("id", ctx.room.id);
}

async function revealAnswer(ctx: Ctx, opts: { lastResult?: PublicPayload["lastResult"]; skipped?: boolean }) {
  const question = await currentQuestion(ctx);
  const payload: PublicPayload = {
    question: ctx.session.public_payload.question ?? {
      index: question.question_index,
      text: question.question_text,
      difficulty: question.difficulty,
    },
    answer: { text: question.correct_answer },
    lastResult: opts.lastResult,
    skipped: opts.skipped,
  };
  await updateSession(ctx, {
    current_state: "SHOW_ANSWER",
    current_player_id: null,
    public_payload: payload,
  });
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

// exported: TTAL reuses host selection so a player's phone can pace the rounds
export async function handleSelectHost(ctx: Ctx, playerId: string) {
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (!players.some((p) => p.id === playerId)) throw new GameError(404, "Player not in room");
  await ctx.admin.from("room_players").update({ is_host: false }).eq("room_id", ctx.room.id);
  await ctx.admin.from("room_players").update({ is_host: true }).eq("id", playerId);
}

async function handleStartGame(ctx: Ctx) {
  assertState(ctx.session, ["LOBBY"]);
  const players = await activePlayers(ctx);
  if (players.length < 1) throw new GameError(400, "Need at least one player to start");
  if (ctx.session.host_mode === "self" && !players.some((p) => p.is_host)) {
    throw new GameError(400, "Select a player to host first");
  }
  assertTeamsReady(players, ctx.session.settings.teamsEnabled);

  const settings = ctx.session.settings;
  let query = ctx.admin
    .from("pack_questions")
    .select("question_text, correct_answer, accepted_answers, difficulty")
    .eq("pack_id", settings.packId);
  if (settings.difficulty !== "mixed") query = query.eq("difficulty", settings.difficulty);
  const { data: pool, error } = await query;
  if (error) throw new GameError(500, error.message);
  if (!pool || pool.length === 0) throw new GameError(400, "No questions available for these settings");

  // random sample without replacement
  const shuffled = shuffle(pool);
  const chosen = shuffled.slice(0, Math.min(settings.questionCount, shuffled.length));

  const { error: qErr } = await ctx.admin.from("game_questions").insert(
    chosen.map((q, i) => ({
      session_id: ctx.session.id,
      question_index: i,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      accepted_answers: q.accepted_answers,
      difficulty: q.difficulty,
      source: "pack",
    }))
  );
  if (qErr) throw new GameError(500, qErr.message);

  const { error: sErr } = await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );
  if (sErr) throw new GameError(500, sErr.message);

  await updateSession(ctx, {
    current_state: "QUESTION_PREVIEW",
    current_question_index: 0,
    question_count: chosen.length,
    started_at: new Date().toISOString(),
    public_payload: {},
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

async function handleDisplayQuestion(ctx: Ctx) {
  assertState(ctx.session, ["QUESTION_PREVIEW"]);
  const question = await currentQuestion(ctx);
  await updateSession(ctx, {
    current_state: "BUZZ_OPEN",
    current_player_id: null,
    public_payload: {
      question: {
        index: question.question_index,
        text: question.question_text,
        difficulty: question.difficulty,
      },
      buzzOpenedAt: new Date().toISOString(),
    },
  });
}

async function handleBuzzIn(ctx: Ctx) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can buzz");
  assertState(ctx.session, ["BUZZ_OPEN", "PLAYER_BUZZED"]);
  const question = await currentQuestion(ctx);

  const { data: buzz, error } = await ctx.admin
    .from("buzzes")
    .insert({
      session_id: ctx.session.id,
      question_id: question.id,
      player_id: ctx.actor.playerId,
    })
    .select("buzz_order")
    .single();
  if (error) {
    if (error.code === "23505") throw new GameError(409, "You already buzzed");
    throw new GameError(500, error.message);
  }

  // First buzz (or first after a wrong answer reopened buzzing) grabs the floor.
  if (ctx.session.current_state === "BUZZ_OPEN") {
    const attempts = await usedAttemptCount(ctx, question.id);
    await updateSession(ctx, {
      current_state: "PLAYER_BUZZED",
      current_player_id: ctx.actor.playerId,
      public_payload: {
        ...ctx.session.public_payload,
        buzz: {
          playerId: ctx.actor.playerId,
          buzzOrder: buzz.buzz_order,
          attempt: attempts + 1,
        },
      },
    });
  }
}

async function handleMark(ctx: Ctx, correct: boolean) {
  assertState(ctx.session, ["PLAYER_BUZZED"]);
  await resolveAnswer(ctx, {
    correct,
    judgedBy: "manual_host",
    confidence: 1,
    submittedText: null, // spoken aloud in self-host mode
  });
}

// Shared by manual marking (self host) and typed-answer judging (virtual
// host): consumes the buzz attempt, records the answer, awards points, and
// advances the machine (reveal / pass to next buzzer / reopen buzzing).
async function resolveAnswer(
  ctx: Ctx,
  verdict: {
    correct: boolean;
    judgedBy: "manual_host" | "local_exact" | "local_accepted_answer" | "local_fuzzy" | "llm";
    confidence: number;
    submittedText: string | null;
  }
) {
  const { correct } = verdict;
  const playerId = ctx.session.current_player_id;
  if (!playerId) throw new GameError(409, "No player is answering");
  const question = await currentQuestion(ctx);
  const settings = ctx.session.settings;

  // consume this player's buzz attempt
  await ctx.admin
    .from("buzzes")
    .update({ used_attempt: true })
    .eq("question_id", question.id)
    .eq("player_id", playerId);
  const attempt = await usedAttemptCount(ctx, question.id); // includes the one just used

  const attemptPoints = ATTEMPT_POINTS[Math.min(attempt, ATTEMPT_POINTS.length) - 1];

  await ctx.admin.from("answers").insert({
    session_id: ctx.session.id,
    question_id: question.id,
    player_id: playerId,
    submitted_answer: verdict.submittedText,
    is_correct: correct,
    judged_by: verdict.judgedBy,
    confidence: verdict.confidence,
  });

  // A wrong answer costs the same points it would have earned, but a score
  // can never drop below zero; lastResult.points carries the real delta.
  const { data: scoreRow } = await ctx.admin
    .from("scores")
    .select("id, score")
    .eq("session_id", ctx.session.id)
    .eq("player_id", playerId)
    .single();
  const points = correct ? attemptPoints : -Math.min(attemptPoints, scoreRow?.score ?? 0);
  if (scoreRow && points !== 0) {
    await ctx.admin
      .from("scores")
      .update({ score: scoreRow.score + points, updated_at: new Date().toISOString() })
      .eq("id", scoreRow.id);
  }

  const lastResult = {
    playerId,
    correct,
    points,
    at: new Date().toISOString(),
    answerText: verdict.submittedText ?? undefined,
    judgedBy: verdict.judgedBy,
  };

  if (correct) {
    await revealAnswer(ctx, { lastResult });
    return;
  }

  // Wrong answer: retries per PRD §15
  const retriesLeft = settings.retriesEnabled && attempt < Math.min(settings.maxRetries, 5);
  if (!retriesLeft) {
    await revealAnswer(ctx, { lastResult });
    return;
  }

  const { data: unusedBuzzes } = await ctx.admin
    .from("buzzes")
    .select("player_id, buzz_order")
    .eq("question_id", question.id)
    .eq("used_attempt", false)
    .order("buzz_order", { ascending: true });

  // Team mode steal rule: the chance passes to the other team's next buzzer,
  // not a teammate of whoever just missed. Free-for-all: next buzzer, period.
  let nextBuzz: { player_id: string; buzz_order: number } | null =
    (unusedBuzzes ?? [])[0] ?? null;
  if (settings.teamsEnabled && nextBuzz) {
    const players = await activePlayers(ctx);
    const teamOf = new Map(players.map((p) => [p.id, p.team]));
    const wrongTeam = teamOf.get(playerId);
    nextBuzz =
      (unusedBuzzes ?? []).find((b) => teamOf.get(b.player_id) !== wrongTeam) ?? null;
  }

  if (nextBuzz) {
    await updateSession(ctx, {
      current_player_id: nextBuzz.player_id,
      public_payload: {
        ...ctx.session.public_payload,
        buzz: {
          playerId: nextBuzz.player_id,
          buzzOrder: nextBuzz.buzz_order,
          attempt: attempt + 1,
        },
        lastResult,
      },
    });
  } else {
    // nobody else has buzzed yet, reopen buzzing for remaining players
    await updateSession(ctx, {
      current_state: "BUZZ_OPEN",
      current_player_id: null,
      public_payload: {
        ...ctx.session.public_payload,
        buzz: undefined,
        lastResult,
        buzzOpenedAt: new Date().toISOString(),
      },
    });
  }
}

// Virtual host mode (PRD §9): the buzzed player types their answer and the
// server judges it, locally first, LLM only when ambiguous (PRD §14).
// The virtual host announces the buzz before typing opens; the driver sends
// this once the spoken line finishes so nobody answers over the host.
async function handleOpenAnswer(ctx: Ctx) {
  assertState(ctx.session, ["PLAYER_BUZZED"]);
  const buzz = ctx.session.public_payload.buzz;
  if (!buzz || buzz.answerOpen) return;
  await updateSession(ctx, {
    public_payload: {
      ...ctx.session.public_payload,
      buzz: { ...buzz, answerOpen: true },
    },
  });
}

async function handleSubmitAnswer(ctx: Ctx, rawText: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can answer");
  assertState(ctx.session, ["PLAYER_BUZZED"]);
  if (ctx.session.host_mode !== "virtual")
    throw new GameError(409, "Typed answers are only used in Virtual Host mode");
  if (ctx.session.current_player_id !== ctx.actor.playerId)
    throw new GameError(403, "It's not your turn to answer");
  if (!ctx.session.public_payload.buzz?.answerOpen)
    throw new GameError(409, "Wait for the host to finish!");

  const text = String(rawText ?? "").slice(0, LIMITS.answerMaxLength).trim();
  if (!text) throw new GameError(400, "Type an answer first");

  const question = await currentQuestion(ctx);

  // PRD §24: cap LLM judgments per game
  const { count: llmUsed } = await ctx.admin
    .from("answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("judged_by", "llm");
  const allowLlm = (llmUsed ?? 0) < MAX_LLM_JUDGMENTS_PER_GAME;

  const judgement = await judgeAnswer({
    question: question.question_text,
    correctAnswer: question.correct_answer,
    acceptedAnswers: Array.isArray(question.accepted_answers)
      ? (question.accepted_answers as string[])
      : [],
    submitted: text,
    allowLlm,
  });

  if (judgement.usedLlm) {
    await ctx.admin.from("ai_events").insert({
      session_id: ctx.session.id,
      moment: "answer_judge",
      input_payload: { question_id: question.id, submitted: text },
      output_text: judgement.correct ? "correct" : "incorrect",
      moderation_status: "n/a",
    });
    await trackUsage(ctx.admin, ctx.room.host_user_id, "llm_judgments", 1);
  }

  await resolveAnswer(ctx, {
    correct: judgement.correct,
    judgedBy: judgement.judgedBy,
    confidence: judgement.confidence,
    submittedText: text,
  });
}

async function handleSkip(ctx: Ctx) {
  assertState(ctx.session, ["QUESTION_PREVIEW", "BUZZ_OPEN", "PLAYER_BUZZED"]);
  if (ctx.session.current_state === "QUESTION_PREVIEW") {
    // skipped before anyone saw it: jump straight to the next question
    await advanceQuestion(ctx);
    return;
  }
  await revealAnswer(ctx, { skipped: true });
}

async function advanceQuestion(ctx: Ctx) {
  const nextIndex = ctx.session.current_question_index + 1;
  if (nextIndex >= ctx.session.question_count) {
    await endGame(ctx);
    return;
  }
  await updateSession(ctx, {
    current_state: "QUESTION_PREVIEW",
    current_question_index: nextIndex,
    current_player_id: null,
    public_payload: {},
  });
}

async function handleShowScoreboard(ctx: Ctx) {
  assertState(ctx.session, ["SHOW_ANSWER"]);
  const isLast = ctx.session.current_question_index + 1 >= ctx.session.question_count;
  if (isLast) {
    await endGame(ctx);
    return;
  }
  await updateSession(ctx, {
    current_state: "SCOREBOARD",
    public_payload: { question: ctx.session.public_payload.question },
  });
}

async function handleNextQuestion(ctx: Ctx) {
  assertState(ctx.session, ["SCOREBOARD"]);
  await advanceQuestion(ctx);
}

// ---------------------------------------------------------------------------

export async function applyAction(ctx: Ctx, action: GameAction): Promise<void> {
  assertAuthorized(ctx.actor, action);

  switch (action.type) {
    case "SELECT_HOST":
      return handleSelectHost(ctx, action.playerId);
    case "START_GAME":
      return handleStartGame(ctx);
    case "DISPLAY_QUESTION":
      return handleDisplayQuestion(ctx);
    case "BUZZ_IN":
      return handleBuzzIn(ctx);
    case "MARK_CORRECT":
      return handleMark(ctx, true);
    case "MARK_INCORRECT":
      return handleMark(ctx, false);
    case "OPEN_ANSWER":
      return handleOpenAnswer(ctx);
    case "SUBMIT_ANSWER":
      return handleSubmitAnswer(ctx, action.text);
    case "SKIP_QUESTION":
      return handleSkip(ctx);
    case "SHOW_SCOREBOARD":
      return handleShowScoreboard(ctx);
    case "NEXT_QUESTION":
      return handleNextQuestion(ctx);
    case "END_GAME":
      return endGame(ctx);
  }
}
