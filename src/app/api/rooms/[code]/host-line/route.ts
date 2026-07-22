import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GameError } from "@/lib/game/engine";
import { errorResponse, getRoomByCode, getSessionForRoom } from "@/lib/game/roomService";
import {
  generateHostLine,
  HOST_MOMENTS,
  type HostLineContext,
  type HostMoment,
} from "@/lib/ai/hostLines";
import { getVoiceClip } from "@/lib/ai/voice";
import { getUsage, trackUsage } from "@/lib/ai/usage";
import { LIMITS, tierFromString } from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";

// POST /api/rooms/[code]/host-line, generate (or fetch cached) an AI host
// line + voice clip for a controlled moment (PRD §12). Only the room owner's
// main screen calls this; context is built server-side from official state so
// a client can never trick the host into reading out a hidden answer.
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
    if (room.host_user_id !== user.id) throw new GameError(403, "Owner only");
    const session = await getSessionForRoom(admin, room.id);
    if (session.host_mode !== "virtual")
      throw new GameError(409, "This room is not AI-hosted");

    if (!rateLimit(`host-line:${session.id}`, 20, 10_000)) throw new GameError(429, "Slow down");

    const { moment, statementId } = (await request.json()) as {
      moment: HostMoment;
      statementId?: string;
    };
    if (!HOST_MOMENTS.includes(moment)) throw new GameError(400, "Unknown moment");

    const context = await buildContext(admin, room.id, session, moment, statementId);
    const line = await generateHostLine(moment, context);
    if (line.source === "llm") {
      await trackUsage(admin, user.id, "llm_host_lines", 1);
    }

    // PRD §24: max ElevenLabs characters per month, over the cap the host
    // keeps talking via captions, we just stop generating audio.
    const tier = tierFromString(room.plan_tier);
    const charsUsed = await getUsage(admin, user.id, "elevenlabs_chars");
    const underVoiceCap = charsUsed + line.text.length <= LIMITS[tier].elevenLabsCharsPerMonth;

    const voice = underVoiceCap ? await getVoiceClip(admin, line.text) : null;
    if (voice && voice.characters > 0) {
      await trackUsage(admin, user.id, "elevenlabs_chars", voice.characters);
    }

    const { data: clipRow } = voice
      ? await admin.from("voice_clips").select("id").eq("audio_url", voice.audioUrl).maybeSingle()
      : { data: null };
    await admin.from("ai_events").insert({
      session_id: session.id,
      moment,
      input_payload: context,
      output_text: line.text,
      moderation_status: "passed",
      voice_clip_id: clipRow?.id ?? null,
    });

    return Response.json({ text: line.text, audioUrl: voice?.audioUrl ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}

type SessionRow = {
  id: string;
  game_type: string;
  current_state: string;
  current_question_index: number;
  question_count: number;
  settings?: { variation?: string };
  public_payload: {
    question?: { text: string };
    buzz?: { playerId: string };
    lastResult?: { playerId: string; points: number; answerText?: string };
    answer?: { text: string };
    podium?: { place: number; playerIds: string[] }[];
    ttalRound?: { subjectId: string; statements: { id: string; text: string }[] };
    ttalReveal?: { oddStatementId: string; correctVoterIds: string[]; fooledVoterIds: string[] };
    wyrRound?: { optionA: string; optionB: string };
    wyrReveal?: { majority: "a" | "b" | "tie"; correctPredictorIds: string[] };
    // most likely to
    mltRound?: { prompt: string; round: number };
    mltReveal?: { topPlayerIds: string[]; votesByPlayerId: Record<string, number>; voterPoints: number; winnerVoterIds: string[] };
    // higher or lower
    holRound?: { leftLabel: string; leftUnit: string; leftValue: number | null; rightLabel: string; rightUnit: string };
    holReveal?: { leftValue: number; rightValue: number; correctAnswer: "higher" | "lower"; majority: string; correctVoterIds: string[]; voterPoints: number };
    // guess the player
    gtpRound?: { promptText: string; mode: string; answerIndex: number; totalAnswers: number };
    gtpGuessing?: { answerText: string };
    gtpReveal?: { answerPlayerId: string; answerText: string; correctGuesserIds: string[]; guesserPoints: number };
    // shark tank
    tankRound?: { pitcherId: string; productName: string; tagline: string; pitchStart: string; pitchSeconds: number };
    tankReveal?: { pitcherId: string; productName: string; investorCount: number; pitcherPoints: number };
    // charades
    charadesRound?: { actorId: string; category: string; actStart: string; actSeconds: number };
    charadesReveal?: { actorId: string; word: string; winnerId: string | null; guesserPoints: number; actorPoints: number };
    // number rating
    numRound?: { guesserPlayerId: string; theme: string; scaleLow: string; scaleHigh: string };
    numReveal?: { guesserPlayerId: string; theme: string; scaleLow: string; scaleHigh: string; guesserPoints: number };
  };
};

async function buildContext(
  admin: ReturnType<typeof createAdminClient>,
  roomId: string,
  session: SessionRow,
  moment: HostMoment,
  statementId?: string
): Promise<HostLineContext> {
  const { data: players } = await admin
    .from("room_players")
    .select("id, username")
    .eq("room_id", roomId);
  const nameOf = (id?: string | null) => players?.find((p) => p.id === id)?.username;

  const payload = session.public_payload ?? {};
  const NEW_GAME_KINDS = ["mlt", "hol", "gtp", "tank", "charades", "num"] as const;
  type NewKind = typeof NEW_GAME_KINDS[number];
  const context: HostLineContext = {
    gameKind:
      session.game_type === "ttal" ? "ttal"
      : session.game_type === "wyr" ? "wyr"
      : NEW_GAME_KINDS.includes(session.game_type as NewKind)
        ? (session.game_type as NewKind)
        : "trivia",
    questionNumber: session.current_question_index + 1,
    questionCount: session.question_count,
  };
  // set for every TTAL moment (shared ones like game_intro need it too)
  if (session.game_type === "ttal") {
    context.variationWord = session.settings?.variation === "two_lies" ? "truth" : "lie";
  }

  switch (moment) {
    case "read_question":
      // the engine only puts the question in the public payload once it is
      // displayed, so this can never leak an upcoming question
      context.questionText = payload.question?.text;
      break;
    case "buzz_received":
    case "retry_next_player":
      context.playerName = nameOf(payload.buzz?.playerId);
      break;
    case "answer_correct":
    case "answer_wrong":
      context.playerName = nameOf(payload.lastResult?.playerId);
      context.points = payload.lastResult?.points;
      // the typed answer is public once judged; the correct answer stays out
      // of context until SHOW_ANSWER so the host can't spoil retries
      context.submittedAnswer = payload.lastResult?.answerText;
      // what actually happens after a miss depends on the state we're in -
      // spell it out so the host never announces the wrong transition
      if (moment === "answer_wrong") {
        if (session.current_state === "BUZZ_OPEN") {
          context.situationHint =
            "The SAME question is still on screen and buzzing just reopened, anyone else can buzz in and steal it. Invite the others to buzz. Do not say we're moving on or mention a next question.";
        } else if (session.current_state === "PLAYER_BUZZED") {
          context.situationHint =
            "Another player already buzzed and gets to steal this same question next. Do not mention a next question.";
        } else {
          context.situationHint = "Nobody else gets a try; the correct answer is revealed next.";
        }
      }
      break;
    case "show_answer":
      // only ever exposed once the engine has publicly revealed it
      if (session.current_state === "SHOW_ANSWER" || session.current_state === "GAME_OVER") {
        context.revealedAnswer = payload.answer?.text;
      }
      break;
    case "scoreboard_reveal": {
      const { data: top } = await admin
        .from("scores")
        .select("player_id, score")
        .eq("session_id", session.id)
        .order("score", { ascending: false })
        .limit(2);
      if (top && top.length > 0 && top[0].score > 0) {
        // a tied top score has no single leader, never crown one at random
        if (top.length > 1 && top[1].score === top[0].score) {
          context.isTie = true;
        } else {
          context.leaderName = nameOf(top[0].player_id);
        }
      }
      break;
    }
    case "game_over_winner":
    case "game_over_tie": {
      const winners = payload.podium?.find((e) => e.place === 1);
      context.winnerNames = (winners?.playerIds ?? [])
        .map((id) => nameOf(id))
        .filter((n): n is string => Boolean(n));
      break;
    }
    case "wyr_question_intro":
    case "wyr_reveal": {
      context.optionA = payload.wyrRound?.optionA;
      context.optionB = payload.wyrRound?.optionB;
      if (moment === "wyr_reveal" && session.current_state === "REVEAL" && payload.wyrReveal) {
        const { majority, correctPredictorIds } = payload.wyrReveal;
        context.isTie = majority === "tie";
        context.majorityOption =
          majority === "a" ? payload.wyrRound?.optionA : majority === "b" ? payload.wyrRound?.optionB : undefined;
        context.caughtCount = correctPredictorIds.length;
      }
      break;
    }
    case "ttal_statement_read": {
      // statements are public once the round is on screen; the letter matches
      // the display order. No verdict here, voting is still open.
      const statements = payload.ttalRound?.statements ?? [];
      const index = statements.findIndex((s) => s.id === statementId);
      if (index >= 0) {
        context.statementText = statements[index].text;
        context.statementLabel = ["A", "B", "C"][index];
      }
      break;
    }
    case "ttal_collect_intro":
    case "ttal_subject_intro":
    case "ttal_reveal": {
      context.playerName = nameOf(payload.ttalRound?.subjectId);
      // reveal details only once the engine has made them public
      if (moment === "ttal_reveal" && session.current_state === "REVEAL" && payload.ttalReveal) {
        context.caughtCount = payload.ttalReveal.correctVoterIds.length;
        context.fooledCount = payload.ttalReveal.fooledVoterIds.length;
        context.revealedStatement = payload.ttalRound?.statements.find(
          (s) => s.id === payload.ttalReveal!.oddStatementId
        )?.text;
      }
      break;
    }
    // Most Likely To
    case "mlt_round_intro":
      context.mltPrompt = payload.mltRound?.prompt;
      break;
    case "mlt_reveal":
      if (payload.mltReveal) {
        const { topPlayerIds, votesByPlayerId } = payload.mltReveal;
        context.mltPrompt = payload.mltRound?.prompt;
        if (topPlayerIds.length === 1) {
          context.mltTopPlayerName = nameOf(topPlayerIds[0]);
          context.mltVoteCount = votesByPlayerId[topPlayerIds[0]] ?? 0;
        }
      }
      break;
    // Higher or Lower
    case "hol_round_intro":
      if (payload.holRound) {
        const r = payload.holRound;
        context.holLeftLabel = r.leftLabel;
        context.holLeftUnit = r.leftUnit;
        context.holLeftValue = r.leftValue;
        context.holRightLabel = r.rightLabel;
        context.holRightUnit = r.rightUnit;
      }
      break;
    case "hol_reveal":
      if (payload.holReveal) {
        const r = payload.holReveal;
        context.holLeftLabel = payload.holRound?.leftLabel;
        context.holLeftUnit = payload.holRound?.leftUnit;
        context.holRightLabel = payload.holRound?.rightLabel;
        context.holRightUnit = payload.holRound?.rightUnit;
        context.holRightValue = r.rightValue;
        context.holCorrectAnswer = r.correctAnswer;
        context.holCorrectVoterCount = r.correctVoterIds.length;
      }
      break;
    // Guess the Player
    case "gtp_answering_intro":
      context.gtpPromptText = payload.gtpRound?.promptText;
      break;
    case "gtp_guessing":
      context.gtpAnswerText = payload.gtpGuessing?.answerText;
      context.gtpPromptText = payload.gtpRound?.promptText;
      break;
    case "gtp_answer_reveal":
      if (payload.gtpReveal) {
        context.gtpAnswerText = payload.gtpReveal.answerText;
        context.gtpAuthorName = nameOf(payload.gtpReveal.answerPlayerId);
        context.gtpCorrectGuesserCount = payload.gtpReveal.correctGuesserIds.length;
      }
      break;
    // Shark Tank
    case "tank_pitch_intro":
    case "tank_invest":
      if (payload.tankRound) {
        context.tankPitcherName = nameOf(payload.tankRound.pitcherId);
        context.tankProductName = payload.tankRound.productName;
        context.tankTagline = payload.tankRound.tagline;
      }
      break;
    case "tank_reveal":
      if (payload.tankReveal) {
        context.tankPitcherName = nameOf(payload.tankReveal.pitcherId);
        context.tankProductName = payload.tankReveal.productName;
        context.tankInvestorCount = payload.tankReveal.investorCount;
        context.tankPitcherPoints = payload.tankReveal.pitcherPoints;
      }
      break;
    // Charades
    case "charades_round_intro":
      if (payload.charadesRound) {
        context.charadesActorName = nameOf(payload.charadesRound.actorId);
        context.charadesCategory = payload.charadesRound.category;
      }
      break;
    case "charades_reveal":
      if (payload.charadesReveal) {
        context.charadesActorName = nameOf(payload.charadesReveal.actorId);
        context.charadesWord = payload.charadesReveal.word;
        context.charadesWinnerName = nameOf(payload.charadesReveal.winnerId ?? undefined);
      }
      break;
    // Number Rating
    case "num_round_intro":
    case "num_guessing":
      if (payload.numRound) {
        context.numGuesserName = nameOf(payload.numRound.guesserPlayerId);
        context.numTheme = payload.numRound.theme;
        context.numScaleLow = payload.numRound.scaleLow;
        context.numScaleHigh = payload.numRound.scaleHigh;
      }
      break;
    case "num_reveal":
      if (payload.numReveal) {
        context.numGuesserName = nameOf(payload.numReveal.guesserPlayerId);
        context.numTheme = payload.numReveal.theme;
        context.numScaleLow = payload.numReveal.scaleLow;
        context.numScaleHigh = payload.numReveal.scaleHigh;
        context.numGuesserPoints = payload.numReveal.guesserPoints;
      }
      break;
  }
  return context;
}
