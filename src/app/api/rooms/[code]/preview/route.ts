import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GameError } from "@/lib/game/engine";
import {
  errorResponse,
  getRoomByCode,
  getSessionForRoom,
  resolveActor,
} from "@/lib/game/roomService";

// GET /api/rooms/[code]/preview, the upcoming question, host controller only.
// Kept out of the public state payload so players/main screen never see the
// question (or anything else) before DISPLAY_QUESTION. The answer is included
// for the self-host controller, who judges spoken answers (PRD §9).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const admin = createAdminClient();
    const room = await getRoomByCode(admin, code);
    const session = await getSessionForRoom(admin, room.id);

    const playerToken = request.headers.get("x-player-token") ?? undefined;
    let userId: string | undefined;
    if (!playerToken) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    }
    const actor = await resolveActor(admin, room, { playerToken, userId });
    const isHostActor =
      actor.kind === "account_host" || (actor.kind === "player" && actor.isHost);
    if (!isHostActor) throw new GameError(403, "Host only");

    const { data: question } = await admin
      .from("game_questions")
      .select("question_index, question_text, correct_answer, difficulty")
      .eq("session_id", session.id)
      .eq("question_index", session.current_question_index)
      .maybeSingle();
    if (!question) throw new GameError(404, "No question at this index");

    return Response.json({
      index: question.question_index,
      total: session.question_count,
      text: question.question_text,
      answer: question.correct_answer,
      difficulty: question.difficulty,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
