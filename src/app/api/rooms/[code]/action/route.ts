import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { applyAction, GameError, handleSetTeam } from "@/lib/game/engine";
import { applyTtalAction } from "@/lib/game/ttal";
import { applyWyrAction } from "@/lib/game/wyr";
import { applyMltAction } from "@/lib/game/mlt";
import { applyHolAction } from "@/lib/game/hol";
import { applyGtpAction } from "@/lib/game/gtp";
import { applyTankAction } from "@/lib/game/tank";
import { applyCharadesAction } from "@/lib/game/charades";
import { applyNumAction } from "@/lib/game/num";
import {
  errorResponse,
  getRoomByCode,
  getSessionForRoom,
  resolveActor,
} from "@/lib/game/roomService";
import { rateLimit } from "@/lib/rateLimit";
import type { GameAction } from "@/lib/game/types";

const ACTION_TYPES = [
  "SELECT_HOST",
  "START_GAME",
  "DISPLAY_QUESTION",
  "BUZZ_IN",
  "MARK_CORRECT",
  "MARK_INCORRECT",
  "OPEN_ANSWER",
  "SUBMIT_ANSWER",
  "SKIP_QUESTION",
  "SHOW_SCOREBOARD",
  "NEXT_QUESTION",
  "END_GAME",
  // two truths and a lie
  "SUBMIT_STATEMENTS",
  "CAST_VOTE",
  "REVEAL_ROUND",
  "NEXT_ROUND",
  // majority would you rather
  "SUBMIT_WYR",
  // team mode (shared)
  "SET_TEAM",
  // most likely to
  "VOTE_MLT",
  // higher or lower
  "VOTE_HOL",
  // guess the player
  "SUBMIT_GTP_ANSWER",
  "GUESS_GTP_PLAYER",
  // shark tank
  "SUBMIT_TANK_INVESTMENT",
  // charades
  "SUBMIT_CHARADES_GUESS",
  // number rating game
  "SUBMIT_NUM_EXAMPLE",
  "SUBMIT_NUM_GUESSES",
] as const;

// POST /api/rooms/[code]/action, the single entry point for every game
// action (PRD §10). Validated server-side against state + actor role.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const action = body.action as GameAction;
    if (!action || !ACTION_TYPES.includes(action.type)) {
      throw new GameError(400, "Unknown action");
    }

    const playerToken = request.headers.get("x-player-token") ?? undefined;
    const limitKey = `action:${playerToken ?? request.headers.get("x-forwarded-for") ?? "local"}`;
    if (!rateLimit(limitKey, 30, 10_000)) throw new GameError(429, "Slow down");

    const admin = createAdminClient();
    const room = await getRoomByCode(admin, code);
    const session = await getSessionForRoom(admin, room.id);

    let userId: string | undefined;
    if (!playerToken) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    }
    const actor = await resolveActor(admin, room, { playerToken, userId });

    const ctx = { admin, room, session, actor };
    if (action.type === "SET_TEAM") {
      // game-agnostic lobby action
      await handleSetTeam(ctx, action.playerId, action.team);
      return Response.json({ ok: true });
    }
    if (session.game_type === "ttal") {
      await applyTtalAction(ctx, action);
    } else if (session.game_type === "wyr") {
      await applyWyrAction(ctx, action);
    } else if (session.game_type === "mlt") {
      await applyMltAction(ctx, action);
    } else if (session.game_type === "hol") {
      await applyHolAction(ctx, action);
    } else if (session.game_type === "gtp") {
      await applyGtpAction(ctx, action);
    } else if (session.game_type === "tank") {
      await applyTankAction(ctx, action);
    } else if (session.game_type === "charades") {
      await applyCharadesAction(ctx, action);
    } else if (session.game_type === "num") {
      await applyNumAction(ctx, action);
    } else {
      await applyAction(ctx, action);
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
