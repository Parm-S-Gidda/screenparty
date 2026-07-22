import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GameError } from "@/lib/game/engine";
import { errorResponse, getRoomByCode } from "@/lib/game/roomService";

// POST /api/rooms/[code]/kick, account host removes a player.
// Kicked players keep their row (is_kicked) so their session token can
// never rejoin (PRD §24).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new GameError(401, "Sign in first");

    const admin = createAdminClient();
    const room = await getRoomByCode(admin, code);
    if (room.host_user_id !== user.id)
      throw new GameError(403, "Only the room owner can kick players");

    const { playerId } = await request.json();
    const { error } = await admin
      .from("room_players")
      .update({ is_kicked: true, is_host: false })
      .eq("id", String(playerId))
      .eq("room_id", room.id);
    if (error) throw new GameError(500, error.message);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
