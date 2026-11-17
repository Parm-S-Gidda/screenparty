// PUT    /api/packs/[id]/questions/[qid]  — update a question
// DELETE /api/packs/[id]/questions/[qid]  — remove a question

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { containsBlockedWord } from "@/lib/moderation";
import { CUSTOM_QUESTION_TEXT_MAX, CUSTOM_ANSWER_MAX } from "@/lib/constants";

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

async function getOwnedQuestion(
  admin: ReturnType<typeof createAdminClient>,
  packId: string,
  qid: string,
  userId: string
) {
  const { data: pack } = await admin
    .from("custom_packs")
    .select("host_user_id")
    .eq("id", packId)
    .maybeSingle();
  if (!pack || pack.host_user_id !== userId) return null;

  const { data: q } = await admin
    .from("custom_pack_questions")
    .select("id")
    .eq("id", qid)
    .eq("pack_id", packId)
    .maybeSingle();
  return q;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id, qid } = await params;
  const admin = createAdminClient();
  const q = await getOwnedQuestion(admin, id, qid, user.id);
  if (!q) return err(404, "Question not found");

  const body = await request.json();
  const question_text = String(body.question_text ?? "").trim().slice(0, CUSTOM_QUESTION_TEXT_MAX);
  if (!question_text) return err(400, "Question text is required");
  if (containsBlockedWord(question_text)) return err(400, "Keep the question friendly");

  const correct_answer = String(body.correct_answer ?? "").trim().slice(0, CUSTOM_ANSWER_MAX);
  if (!correct_answer) return err(400, "Correct answer is required");
  if (containsBlockedWord(correct_answer)) return err(400, "Keep the answer friendly");

  const raw: unknown[] = Array.isArray(body.accepted_answers) ? body.accepted_answers : [];
  const accepted_answers = raw
    .map((a) => String(a).trim().slice(0, CUSTOM_ANSWER_MAX))
    .filter((a) => a.length > 0)
    .slice(0, 10);

  const difficulty = ["easy", "medium", "hard"].includes(String(body.difficulty))
    ? (body.difficulty as string)
    : "medium";

  const { data, error } = await admin
    .from("custom_pack_questions")
    .update({ question_text, correct_answer, accepted_answers, difficulty })
    .eq("id", qid)
    .select("id, question_text, correct_answer, accepted_answers, difficulty")
    .single();
  if (error) return err(500, error.message);

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id, qid } = await params;
  const admin = createAdminClient();
  const q = await getOwnedQuestion(admin, id, qid, user.id);
  if (!q) return err(404, "Question not found");

  await admin.from("custom_pack_questions").delete().eq("id", qid);
  return Response.json({ ok: true });
}
