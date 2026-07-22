import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GameError } from "@/lib/game/engine";
import { errorResponse, generateRoomCode } from "@/lib/game/roomService";
import {
  AI_HOST_FREE_BETA,
  TEAMS_FREE_BETA,
  LIMITS,
  QUESTION_COUNT_OPTIONS,
  AUTO_SKIP_OPTIONS,
  TTAL_ROUND_OPTIONS,
  TTAL_DEFAULT_ROUNDS,
  resolveTier,
} from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";
import { getUsage } from "@/lib/ai/usage";
import type { GameSettings } from "@/lib/game/types";

// POST /api/rooms, create a room + lobby game session (authenticated hosts only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new GameError(401, "Sign in to host a game");
    if (!rateLimit(`create-room:${user.id}`, 10, 60_000))
      throw new GameError(429, "Too many rooms created, slow down");

    const body = await request.json();
    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("plan_tier, day_pass_expires_at")
      .eq("id", user.id)
      .single();
    const tier = resolveTier(profile);
    const tierLimits = LIMITS[tier];

    const NEW_GAMES = ["mlt", "hol", "gtp", "tank", "charades", "num"] as const;
    const gameType = ["ttal", "wyr", ...NEW_GAMES].includes(body.gameType)
      ? body.gameType
      : "buzz_trivia";

    // validate settings against the plan (PRD §7, §8)
    let packId = "";
    let questionCount = 0;
    if (gameType === "buzz_trivia") {
      packId = String(body.packId ?? "");
      const { data: pack } = await admin
        .from("question_packs")
        .select("id, is_premium")
        .eq("id", packId)
        .maybeSingle();
      if (!pack) throw new GameError(400, "Pick a question pack");
      if (pack.is_premium && tier === "free")
        throw new GameError(403, "That pack requires a paid plan");

      questionCount = Number(body.questionCount);
      if (!QUESTION_COUNT_OPTIONS.includes(questionCount as 5))
        throw new GameError(400, "Invalid question count");
      if (questionCount > tierLimits.maxQuestions)
        throw new GameError(403, "Question count exceeds your plan");
    } else if (gameType === "wyr" || gameType === "mlt" || gameType === "gtp") {
      questionCount = Number(body.questionCount) || 10;
      if (!QUESTION_COUNT_OPTIONS.includes(questionCount as 5))
        throw new GameError(400, "Invalid question count");
      if (questionCount > tierLimits.maxQuestions)
        throw new GameError(403, "Question count exceeds your plan");
    } else if (["hol", "tank", "charades", "num"].includes(gameType)) {
      // these games set their own round count based on player count / items
      questionCount = 0;
    }

    // PRD §24: max rooms per day
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count: roomsToday } = await admin
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("host_user_id", user.id)
      .gte("created_at", dayStart.toISOString());
    if ((roomsToday ?? 0) >= tierLimits.maxRoomsPerDay)
      throw new GameError(429, "You've hit today's room limit, try again tomorrow");

    const hostMode = body.hostMode === "virtual" ? "virtual" : "self";
    if (hostMode === "virtual") {
      if (tier === "free" && !AI_HOST_FREE_BETA)
        throw new GameError(403, "Virtual AI Host requires a paid plan");
      // PRD §24: max AI host games per month
      const aiGames = await getUsage(admin, user.id, "ai_host_games");
      if (aiGames >= tierLimits.aiHostGamesPerMonth)
        throw new GameError(403, "You've used all your AI-hosted games this month");
    }

    const difficulty = ["easy", "medium", "hard", "mixed"].includes(body.difficulty)
      ? body.difficulty
      : "mixed";
    const autoSkipSeconds = AUTO_SKIP_OPTIONS.includes(Number(body.autoSkipSeconds) as 15)
      ? Number(body.autoSkipSeconds)
      : 30;

    const settings: GameSettings = {
      packId,
      questionCount,
      difficulty,
      hostMode,
      // an AI-hosted game has no human to skip a dead question, so auto skip
      // is always on in virtual mode
      autoSkip: hostMode === "virtual" ? true : Boolean(body.autoSkip),
      autoSkipSeconds,
      retriesEnabled: body.retriesEnabled !== false,
      maxRetries: Math.min(Math.max(Number(body.maxRetries) || 3, 1), LIMITS.maxRetriesCap),
      strictness: "normal",
      maxPlayers: tierLimits.maxPlayers,
      variation:
        gameType === "ttal" ? (body.variation === "two_lies" ? "two_lies" : "two_truths") : undefined,
      rounds:
        gameType === "ttal"
          ? TTAL_ROUND_OPTIONS.includes(Number(body.rounds) as 3)
            ? Number(body.rounds)
            : TTAL_DEFAULT_ROUNDS
          : undefined,
      teamsEnabled: gameType !== "ttal" && Boolean(body.teamsEnabled),
    };
    if (settings.teamsEnabled && tier === "free" && !TEAMS_FREE_BETA)
      throw new GameError(403, "Team mode requires a paid plan");

    // insert with a fresh code, retrying on the rare collision
    let room = null;
    for (let attempt = 0; attempt < 5 && !room; attempt++) {
      const { data, error } = await admin
        .from("rooms")
        .insert({
          host_user_id: user.id,
          room_code: generateRoomCode(),
          status: "lobby",
          plan_tier: tier,
          expires_at: new Date(Date.now() + tierLimits.roomTtlHours * 3600_000).toISOString(),
        })
        .select("*")
        .single();
      if (data) room = data;
      else if (error && error.code !== "23505") throw new GameError(500, error.message);
    }
    if (!room) throw new GameError(500, "Could not allocate a room code");

    const { error: sessionError } = await admin.from("game_sessions").insert({
      room_id: room.id,
      game_type: gameType,
      host_mode: hostMode,
      current_state: "LOBBY",
      settings,
    });
    if (sessionError) throw new GameError(500, sessionError.message);

    return Response.json({ roomId: room.id, code: room.room_code });
  } catch (err) {
    return errorResponse(err);
  }
}
