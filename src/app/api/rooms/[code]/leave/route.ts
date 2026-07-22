import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GameError } from "@/lib/game/engine";
import { errorResponse, getRoomByCode, resolveActor } from "@/lib/game/roomService";

// POST /api/rooms/[code]/leave, player voluntarily leaves the room.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const token = request.headers.get("x-player-token");
    if (!token) throw new GameError(401, "Missing player session");

    const admin = createAdminClient();
    const room = await getRoomByCode(admin, code);
    const actor = await resolveActor(admin, room, { playerToken: token });
    if (actor.kind !== "player") throw new GameError(400, "Not a player");

    const { error } = await admin
      .from("room_players")
      .delete()
      .eq("id", actor.playerId)
      .eq("room_id", room.id);
    if (error) throw new GameError(500, error.message);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
