import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, getRoomByCode, getSessionForRoom } from "@/lib/game/roomService";
import type { GameType, RoomStateResponse } from "@/lib/game/types";

const ALL_GAME_TYPES: GameType[] = ["buzz_trivia", "ttal", "wyr", "mlt", "hol", "gtp", "tank", "charades", "num"];

// GET /api/rooms/[code]/state, consolidated public game state.
// Clients call this on load and re-call whenever a realtime event fires,
// so everything they render always comes from official server state.
// Never includes correct answers: the engine only copies the answer into
// public_payload at SHOW_ANSWER.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const admin = createAdminClient();
    const room = await getRoomByCode(admin, code);
    const session = await getSessionForRoom(admin, room.id);

    const { data: players } = await admin
      .from("room_players")
      .select("id, username, avatar_id, is_host, is_kicked, team")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    const { data: scores } = await admin
      .from("scores")
      .select("player_id, score")
      .eq("session_id", session.id);

    // buzzes for the current question only (trivia)
    let buzzes: { playerId: string; buzzOrder: number; usedAttempt: boolean }[] = [];
    if (session.game_type === "buzz_trivia") {
      const { data: question } = await admin
        .from("game_questions")
        .select("id")
        .eq("session_id", session.id)
        .eq("question_index", session.current_question_index)
        .maybeSingle();
      if (question) {
        const { data } = await admin
          .from("buzzes")
          .select("player_id, buzz_order, used_attempt")
          .eq("question_id", question.id)
          .order("buzz_order", { ascending: true });
        buzzes = (data ?? []).map((b) => ({
          playerId: b.player_id,
          buzzOrder: b.buzz_order,
          usedAttempt: b.used_attempt,
        }));
      }
    }

    // New-game progress fields
    let mlt: RoomStateResponse["mlt"] = null;
    let hol: RoomStateResponse["hol"] = null;
    let gtp: RoomStateResponse["gtp"] = null;
    let tank: RoomStateResponse["tank"] = null;
    const charades: RoomStateResponse["charades"] = null;
    let num: RoomStateResponse["num"] = null;

    if (session.game_type === "mlt") {
      const { data: votes } = await admin
        .from("mlt_votes")
        .select("voter_id")
        .eq("session_id", session.id)
        .eq("prompt_index", session.current_question_index);
      mlt = { submittedVoterIds: (votes ?? []).map((v) => v.voter_id) };
    }
    if (session.game_type === "hol") {
      const { data: votes } = await admin
        .from("hol_votes")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("question_index", session.current_question_index);
      hol = { submittedVoterIds: (votes ?? []).map((v) => v.player_id) };
    }
    if (session.game_type === "gtp") {
      const promptIndex = session.current_question_index;
      const { data: answers } = await admin
        .from("gtp_answers")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("prompt_index", promptIndex);
      const submittedPlayerIds = (answers ?? []).map((a) => a.player_id);

      const answerOrder = session.settings?.gtpAnswerOrder?.[promptIndex] ?? [];
      const answerIndex = session.public_payload?.gtpRound?.answerIndex ?? -1;
      const authorId = answerIndex >= 0 ? answerOrder[answerIndex] : null;
      let guessesIn = 0;
      let guessersNeeded = 0;
      if (authorId && (session.current_state === "GTP_GUESSING" || session.current_state === "REVEAL")) {
        const activePls = (players ?? []).filter((p) => !p.is_kicked);
        guessersNeeded = activePls.filter((p) => p.id !== authorId).length;
        const { count } = await admin
          .from("gtp_guesses")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id)
          .eq("prompt_index", promptIndex)
          .eq("answer_player_id", authorId);
        guessesIn = count ?? 0;
      }
      gtp = { submittedPlayerIds, guessesIn, guessersNeeded };
    }
    if (session.game_type === "tank") {
      const products = session.settings?.tankProducts ?? [];
      const pitcher = products[session.current_question_index];
      const activePls = (players ?? []).filter((p) => !p.is_kicked);
      const investorsNeeded = pitcher ? activePls.filter((p) => p.id !== pitcher.pitcherId).length : 0;
      const { count } = await admin
        .from("tank_investments")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("round_index", session.current_question_index);
      tank = { investmentsIn: count ?? 0, investorsNeeded };
    }
    if (session.game_type === "num") {
      const { data: examples } = await admin
        .from("num_examples")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("round_index", session.current_question_index);
      num = { submittedExampleIds: (examples ?? []).map((e) => e.player_id) };
    }

    // WYR progress: who has answered this round, ids only, choices stay hidden
    let wyr: RoomStateResponse["wyr"] = null;
    let wyrSubmittedIds = new Set<string>();
    if (session.game_type === "wyr") {
      const { data: answered } = await admin
        .from("wyr_answers")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("question_index", session.current_question_index);
      wyrSubmittedIds = new Set((answered ?? []).map((a) => a.player_id));
      wyr = { submittedPlayerIds: [...wyrSubmittedIds] };
    }

    // TTAL progress: who has submitted, how many votes are in, counts and
    // ids only, never statement content or vote targets before reveal
    let ttal: RoomStateResponse["ttal"] = null;
    let ttalSubmittedIds = new Set<string>();
    let ttalMyVote: string | null = null;
    // one round = one full pass through subjectOrder; statements/votes are
    // per-round, so progress queries must be scoped to the current round
    const ttalOrderLen = (session.settings?.subjectOrder ?? []).length;
    const ttalRoundNumber =
      ttalOrderLen > 0 ? Math.floor(session.current_question_index / ttalOrderLen) : 0;
    if (session.game_type === "ttal") {
      const { data: submitted } = await admin
        .from("ttal_statements")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("round_number", ttalRoundNumber);
      ttalSubmittedIds = new Set((submitted ?? []).map((s) => s.player_id));

      let votesIn = 0;
      const subjectId = session.public_payload?.ttalRound?.subjectId;
      if (subjectId) {
        const { count } = await admin
          .from("ttal_votes")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id)
          .eq("subject_player_id", subjectId)
          .eq("round_number", ttalRoundNumber);
        votesIn = count ?? 0;
      }
      const activeCount = (players ?? []).filter((p) => !p.is_kicked).length;
      ttal = {
        submittedPlayerIds: [...ttalSubmittedIds],
        votesIn,
        votersNeeded: subjectId ? Math.max(activeCount - 1, 0) : 0,
      };
    }

    // optional player identity (token via header so it never lands in logs/URLs)
    let me: RoomStateResponse["me"] = null;
    const token = request.headers.get("x-player-token");
    if (token) {
      const { data } = await admin
        .from("player_secrets")
        .select("player_id, room_players!inner(id, room_id, is_kicked, is_host)")
        .eq("session_token", token)
        .maybeSingle();
      const player = data?.room_players as unknown as
        | { id: string; room_id: string; is_kicked: boolean; is_host: boolean }
        | undefined;
      if (player && player.room_id === room.id) {
        if (session.game_type === "ttal") {
          const subjectId = session.public_payload?.ttalRound?.subjectId;
          if (subjectId) {
            const { data: vote } = await admin
              .from("ttal_votes")
              .select("statement_id")
              .eq("session_id", session.id)
              .eq("subject_player_id", subjectId)
              .eq("voter_player_id", player.id)
              .eq("round_number", ttalRoundNumber)
              .maybeSingle();
            ttalMyVote = vote?.statement_id ?? null;
          }
        }
        // Charades: deliver the word only to the current actor
        let charadesWord: string | null = null;
        if (
          session.game_type === "charades" &&
          session.current_state === "CHARADES_ACTING" &&
          player.id === session.current_player_id
        ) {
          const words = session.settings?.charadesWords ?? [];
          const current = words[session.current_question_index];
          charadesWord = current?.word ?? null;
        }

        // Num: deliver the player's assigned number during NUM_SUBMITTING
        let myNumAssignment: number | null = null;
        if (session.game_type === "num" && session.current_state === "NUM_SUBMITTING") {
          const assignments = session.settings?.numNumberAssignments?.[session.current_question_index] ?? [];
          const assignment = assignments.find((a: { playerId: string; number: number }) => a.playerId === player.id);
          myNumAssignment = assignment?.number ?? null;
        }

        // MLT: who this player voted for
        let myMltVoteTarget: string | null = null;
        if (session.game_type === "mlt") {
          const { data: myVote } = await admin
            .from("mlt_votes")
            .select("target_player_id")
            .eq("session_id", session.id)
            .eq("prompt_index", session.current_question_index)
            .eq("voter_id", player.id)
            .maybeSingle();
          myMltVoteTarget = myVote?.target_player_id ?? null;
        }

        // HOL: which way this player voted
        let myHolVote: "higher" | "lower" | null = null;
        if (session.game_type === "hol") {
          const { data: myVote } = await admin
            .from("hol_votes")
            .select("vote")
            .eq("session_id", session.id)
            .eq("question_index", session.current_question_index)
            .eq("player_id", player.id)
            .maybeSingle();
          myHolVote = (myVote?.vote as "higher" | "lower") ?? null;
        }

        // GTP: who this player guessed for the current answer
        let myGtpGuess: string | null = null;
        if (session.game_type === "gtp" && session.current_state === "GTP_GUESSING") {
          const answerOrder = session.settings?.gtpAnswerOrder?.[session.current_question_index] ?? [];
          const answerIndex = session.public_payload?.gtpRound?.answerIndex ?? 0;
          const authorId = answerOrder[answerIndex];
          if (authorId) {
            const { data: myGuess } = await admin
              .from("gtp_guesses")
              .select("guessed_player_id")
              .eq("session_id", session.id)
              .eq("prompt_index", session.current_question_index)
              .eq("answer_player_id", authorId)
              .eq("guesser_id", player.id)
              .maybeSingle();
            myGtpGuess = myGuess?.guessed_player_id ?? null;
          }
        }

        // Tank: how this player voted this round
        let myTankInvestment: boolean | null = null;
        if (session.game_type === "tank") {
          const { data: myInv } = await admin
            .from("tank_investments")
            .select("invested")
            .eq("session_id", session.id)
            .eq("round_index", session.current_question_index)
            .eq("investor_id", player.id)
            .maybeSingle();
          myTankInvestment = myInv?.invested ?? null;
        }

        me = {
          playerId: player.id,
          isHost: player.is_host,
          kicked: player.is_kicked,
          buzzOrder: buzzes.find((b) => b.playerId === player.id)?.buzzOrder ?? null,
          hasSubmitted:
            session.game_type === "ttal"
              ? ttalSubmittedIds.has(player.id)
              : session.game_type === "wyr"
                ? wyrSubmittedIds.has(player.id)
                : session.game_type === "gtp" && session.current_state === "GTP_ANSWERING"
                  ? (gtp?.submittedPlayerIds ?? []).includes(player.id)
                  : session.game_type === "num" && session.current_state === "NUM_SUBMITTING"
                    ? (num?.submittedExampleIds ?? []).includes(player.id)
                    : undefined,
          myVoteStatementId: session.game_type === "ttal" ? ttalMyVote : undefined,
          myMltVoteTarget,
          myHolVote,
          myGtpGuess,
          myTankInvestment,
          charadesWord,
          myNumAssignment,
        };
      }
    }

    const response: RoomStateResponse = {
      room: {
        id: room.id,
        code: room.room_code,
        status: room.status,
        expiresAt: room.expires_at,
      },
      players: (players ?? [])
        .filter((p) => !p.is_kicked)
        .map((p) => ({
          id: p.id,
          username: p.username,
          avatarId: p.avatar_id,
          isHost: p.is_host,
          team: p.team ?? null,
        })),
      session: {
        id: session.id,
        gameType: (ALL_GAME_TYPES.includes(session.game_type as GameType) ? session.game_type : "buzz_trivia") as GameType,
        state: session.current_state,
        hostMode: session.host_mode,
        questionIndex: session.current_question_index,
        questionCount: session.question_count,
        currentPlayerId: session.current_player_id,
        payload: session.public_payload ?? {},
        settings: {
          autoSkip: session.settings?.autoSkip ?? false,
          autoSkipSeconds: session.settings?.autoSkipSeconds ?? 30,
          retriesEnabled: session.settings?.retriesEnabled ?? true,
          maxRetries: session.settings?.maxRetries ?? 3,
          questionCount: session.settings?.questionCount ?? 0,
          variation: session.settings?.variation,
          rounds: session.settings?.rounds,
          teamsEnabled: session.settings?.teamsEnabled ?? false,
          tankPitchSeconds: session.settings?.tankPitchSeconds,
        },
      },
      scores: (scores ?? []).map((s) => ({ playerId: s.player_id, score: s.score })),
      buzzes,
      ttal,
      wyr,
      mlt,
      hol,
      gtp,
      tank,
      charades,
      num,
      me,
    };

    return Response.json(response);
  } catch (err) {
    return errorResponse(err);
  }
}
