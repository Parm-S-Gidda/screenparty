import type { SupabaseClient } from "@supabase/supabase-js";
import { GameError } from "./engine";
import type { Actor } from "./types";

// Unambiguous alphabet (no O/0, I/1, etc.)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function getRoomByCode(admin: SupabaseClient, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const { data: room, error } = await admin
    .from("rooms")
    .select("*")
    .eq("room_code", code)
    .in("status", ["lobby", "in_game", "ended"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new GameError(500, error.message);
  if (!room) throw new GameError(404, "Room not found");

  // lazy expiry (PRD: room codes expire)
  if (room.status !== "ended" && new Date(room.expires_at) < new Date()) {
    await admin.from("rooms").update({ status: "expired" }).eq("id", room.id);
    throw new GameError(410, "This room has expired");
  }
  return room;
}

export async function getSessionForRoom(admin: SupabaseClient, roomId: string) {
  const { data: session, error } = await admin
    .from("game_sessions")
    .select("*")
    .eq("room_id", roomId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new GameError(500, error.message);
  if (!session) throw new GameError(404, "Game session not found");
  return session;
}

// Resolve who is performing an action: the authenticated account host
// (cookie session) or an anonymous player (session token).
export async function resolveActor(
  admin: SupabaseClient,
  room: { id: string; host_user_id: string },
  opts: { playerToken?: string; userId?: string }
): Promise<Actor> {
  if (opts.playerToken) {
    const { data, error } = await admin
      .from("player_secrets")
      .select("player_id, room_players!inner(id, room_id, is_kicked, is_host)")
      .eq("session_token", opts.playerToken)
      .maybeSingle();
    if (error) throw new GameError(500, error.message);
    const player = data?.room_players as unknown as
      | { id: string; room_id: string; is_kicked: boolean; is_host: boolean }
      | undefined;
    if (!player || player.room_id !== room.id) throw new GameError(401, "Invalid player session");
    if (player.is_kicked) throw new GameError(403, "You were removed from this room");
    return { kind: "player", playerId: player.id, isHost: player.is_host };
  }
  if (opts.userId && opts.userId === room.host_user_id) {
    return { kind: "account_host" };
  }
  throw new GameError(401, "Not authorized for this room");
}

export function errorResponse(err: unknown): Response {
  if (err instanceof GameError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
