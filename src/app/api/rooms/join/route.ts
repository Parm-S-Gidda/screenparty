import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GameError } from "@/lib/game/engine";
import { errorResponse, getRoomByCode, getSessionForRoom } from "@/lib/game/roomService";
import { validateUsername } from "@/lib/moderation";
import { AVATARS } from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";

// POST /api/rooms/join, anonymous player joins by room code
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(`join:${ip}`, 20, 60_000))
      throw new GameError(429, "Too many join attempts, slow down");

    const body = await request.json();
    const admin = createAdminClient();
    const room = await getRoomByCode(admin, String(body.code ?? ""));
    if (room.status === "ended") throw new GameError(410, "This game has ended");

    const session = await getSessionForRoom(admin, room.id);
    if (session.current_state !== "LOBBY")
      throw new GameError(409, "This game has already started");

    const nameCheck = validateUsername(String(body.username ?? ""));
    if (!nameCheck.ok) throw new GameError(400, nameCheck.error);

    const avatarId = String(body.avatarId ?? "");
    if (!AVATARS.some((a) => a.id === avatarId))
      throw new GameError(400, "Pick an avatar");

    const { data: existing } = await admin
      .from("room_players")
      .select("id, username, is_kicked, team")
      .eq("room_id", room.id);
    const active = (existing ?? []).filter((p) => !p.is_kicked);
    if (active.length >= (session.settings?.maxPlayers ?? 5))
      throw new GameError(403, "This room is full");
    if (active.some((p) => p.username.toLowerCase() === nameCheck.username.toLowerCase()))
      throw new GameError(409, "That name is taken in this room");

    // team mode: auto-balance new joiners onto the smaller team
    let team: "red" | "blue" | null = null;
    if (session.settings?.teamsEnabled) {
      const red = active.filter((p) => p.team === "red").length;
      const blue = active.filter((p) => p.team === "blue").length;
      team = red <= blue ? "red" : "blue";
    }

    const { data: player, error } = await admin
      .from("room_players")
      .insert({ room_id: room.id, username: nameCheck.username, avatar_id: avatarId, team })
      .select("id")
      .single();
    if (error || !player) throw new GameError(500, error?.message ?? "Join failed");

    const { data: secret, error: secretError } = await admin
      .from("player_secrets")
      .insert({ player_id: player.id })
      .select("session_token")
      .single();
    if (secretError || !secret) throw new GameError(500, "Join failed");

    return Response.json({
      playerId: player.id,
      token: secret.session_token,
      roomCode: room.room_code,
      roomId: room.id,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
