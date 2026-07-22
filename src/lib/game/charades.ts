// Charades engine: each round one player is the actor and sees a word on their
// phone (delivered via me.charadesWord in the state endpoint). Other players
// type guesses on their phones. First correct guess wins; actor also earns
// points if someone guesses correctly. Host can end the round early.

import { CHARADES_POINTS, LIMITS } from "@/lib/constants";
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
const ACT_SECONDS = 60;

export async function applyCharadesAction(ctx: Ctx, action: GameAction): Promise<void> {
  switch (action.type) {
    case "START_GAME":
      return handleStart(ctx);
    case "SUBMIT_CHARADES_GUESS":
      return handleGuess(ctx, action.text);
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
    throw new GameError(400, `Need at least ${MIN_PLAYERS} players for Charades`);

  const { data: rows, error } = await ctx.admin
    .from("charades_words")
    .select("word, category");
  if (error || !rows || rows.length < players.length)
    throw new GameError(500, "Not enough words available");

  const actorOrder = shuffle(players.map((p) => p.id));
  const pickedWords = shuffle(rows).slice(0, players.length);
  const charadesWords = actorOrder.map((actorId, i) => ({
    actorId,
    word: pickedWords[i].word,
    category: pickedWords[i].category,
  }));

  await ctx.admin.from("scores").insert(
    players.map((p) => ({ session_id: ctx.session.id, player_id: p.id, score: 0 }))
  );

  const first = charadesWords[0];
  const payload: PublicPayload = {
    charadesRound: {
      actorId: first.actorId,
      category: first.category,
      actStart: new Date().toISOString(),
      actSeconds: ACT_SECONDS,
    },
  };
  await updateSession(ctx, {
    current_state: "CHARADES_ACTING",
    current_question_index: 0,
    question_count: players.length,
    current_player_id: first.actorId,
    settings: { ...ctx.session.settings, charadesWords },
    started_at: new Date().toISOString(),
    public_payload: payload,
  });
  await ctx.admin.from("rooms").update({ status: "in_game" }).eq("id", ctx.room.id);
  if (ctx.session.host_mode === "virtual") {
    await trackUsage(ctx.admin, ctx.room.host_user_id, "ai_host_games", 1);
  }
}

function normalise(s: string) {
  return s.toLowerCase().trim().replace(/^(a |an |the )/i, "").trim();
}

async function handleGuess(ctx: Ctx, rawGuess: string) {
  if (ctx.actor.kind !== "player") throw new GameError(403, "Only players can guess");
  assertState(ctx.session, ["CHARADES_ACTING"]);

  const words = ctx.session.settings.charadesWords ?? [];
  const current = words[ctx.session.current_question_index];
  if (!current) throw new GameError(500, "No active round");
  if (ctx.actor.playerId === current.actorId)
    throw new GameError(403, "The actor can't guess their own word");

  const guess = String(rawGuess ?? "").trim().slice(0, LIMITS.charadesGuessMaxLength);
  if (guess.length === 0) throw new GameError(400, "Guess can't be empty");

  const isCorrect = normalise(guess) === normalise(current.word);
  if (!isCorrect) {
    // Wrong guess: bump session so phones update (guess count etc.)
    await updateSession(ctx, {});
    return;
  }

  // Correct guess, claim the REVEAL transition (race-safe)
  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "CHARADES_ACTING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  await addPoints(ctx, ctx.actor.playerId, CHARADES_POINTS.correctGuesser);
  await addPoints(ctx, current.actorId, CHARADES_POINTS.actor);

  const payload: PublicPayload = {
    charadesReveal: {
      actorId: current.actorId,
      word: current.word,
      winnerId: ctx.actor.playerId,
      guesserPoints: CHARADES_POINTS.correctGuesser,
      actorPoints: CHARADES_POINTS.actor,
    },
  };
  await ctx.admin
    .from("game_sessions")
    .update({ public_payload: payload, updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
}

async function handleForceReveal(ctx: Ctx) {
  assertHost(ctx);
  assertState(ctx.session, ["CHARADES_ACTING"]);

  const { data: claimed } = await ctx.admin
    .from("game_sessions")
    .update({ current_state: "REVEAL", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id)
    .eq("current_state", "CHARADES_ACTING")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const words = ctx.session.settings.charadesWords ?? [];
  const current = words[ctx.session.current_question_index];

  const payload: PublicPayload = {
    charadesReveal: {
      actorId: current?.actorId ?? "",
      word: current?.word ?? "",
      winnerId: null, // nobody guessed in time
      guesserPoints: CHARADES_POINTS.correctGuesser,
      actorPoints: CHARADES_POINTS.actor,
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

  const words = ctx.session.settings.charadesWords ?? [];
  const next_ = words[next];
  const payload: PublicPayload = {
    charadesRound: {
      actorId: next_.actorId,
      category: next_.category,
      actStart: new Date().toISOString(),
      actSeconds: ACT_SECONDS,
    },
  };
  await updateSession(ctx, {
    current_state: "CHARADES_ACTING",
    current_question_index: next,
    current_player_id: next_.actorId,
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
