// POST /api/packs/[id]/questions  — add a question to a custom pack

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { containsBlockedWord } from "@/lib/moderation";
import { CUSTOM_PACK_QUESTION_MAX, CUSTOM_QUESTION_TEXT_MAX, CUSTOM_ANSWER_MAX } from "@/lib/constants";

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

type ValidatedQuestion =
  | { error: string }
  | { question_text: string; correct_answer: string; accepted_answers: string[]; difficulty: string };

function validateQuestion(body: Record<string, unknown>): ValidatedQuestion {
  const question_text = String(body.question_text ?? "").trim().slice(0, CUSTOM_QUESTION_TEXT_MAX);
  if (!question_text) return { error: "Question text is required" };
  if (containsBlockedWord(question_text)) return { error: "Keep the question friendly" };

  const correct_answer = String(body.correct_answer ?? "").trim().slice(0, CUSTOM_ANSWER_MAX);
  if (!correct_answer) return { error: "Correct answer is required" };
  if (containsBlockedWord(correct_answer)) return { error: "Keep the answer friendly" };

  const raw = Array.isArray(body.accepted_answers) ? body.accepted_answers : [];
  const accepted_answers = raw
    .map((a) => String(a).trim().slice(0, CUSTOM_ANSWER_MAX))
    .filter((a) => a.length > 0)
    .slice(0, 10);

  const difficulty = ["easy", "medium", "hard"].includes(String(body.difficulty))
    ? (body.difficulty as string)
    : "medium";

  return { question_text, correct_answer, accepted_answers, difficulty };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: pack } = await admin
    .from("custom_packs")
    .select("id, host_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!pack || pack.host_user_id !== user.id) return err(404, "Pack not found");

  const { count: existing } = await admin
    .from("custom_pack_questions")
    .select("id", { count: "exact", head: true })
    .eq("pack_id", id);
  if ((existing ?? 0) >= CUSTOM_PACK_QUESTION_MAX)
    return err(400, `Packs can have at most ${CUSTOM_PACK_QUESTION_MAX} questions`);

  const body = await request.json();
  const validated = validateQuestion(body);
  if ("error" in validated) return err(400, validated.error);

  const { data, error } = await admin
    .from("custom_pack_questions")
    .insert({ pack_id: id, ...validated })
    .select("id, question_text, correct_answer, accepted_answers, difficulty")
    .single();
  if (error) return err(500, error.message);

  return Response.json(data, { status: 201 });
}
