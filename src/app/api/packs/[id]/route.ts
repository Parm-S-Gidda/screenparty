// GET    /api/packs/[id]  — pack + all its questions (for the editor)
// PUT    /api/packs/[id]  — update title / description
// DELETE /api/packs/[id]  — delete pack + questions (cascade)

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { containsBlockedWord } from "@/lib/moderation";
import { CUSTOM_PACK_TITLE_MAX } from "@/lib/constants";

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

async function getOwnedPack(admin: ReturnType<typeof createAdminClient>, packId: string, userId: string) {
  const { data } = await admin
    .from("custom_packs")
    .select("id, host_user_id")
    .eq("id", packId)
    .maybeSingle();
  if (!data) return null;
  if (data.host_user_id !== userId) return null;
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id } = await params;
  const admin = createAdminClient();
  const pack = await getOwnedPack(admin, id, user.id);
  if (!pack) return err(404, "Pack not found");

  const [{ data: packRow }, { data: questions }] = await Promise.all([
    admin.from("custom_packs").select("id, title, description, created_at").eq("id", id).single(),
    admin.from("custom_pack_questions")
      .select("id, question_text, correct_answer, accepted_answers, difficulty")
      .eq("pack_id", id)
      .order("created_at"),
  ]);

  return Response.json({ ...packRow, questions: questions ?? [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id } = await params;
  const admin = createAdminClient();
  const pack = await getOwnedPack(admin, id, user.id);
  if (!pack) return err(404, "Pack not found");

  const body = await request.json();
  const title = String(body.title ?? "").trim().slice(0, CUSTOM_PACK_TITLE_MAX);
  if (!title) return err(400, "Pack needs a title");
  if (containsBlockedWord(title)) return err(400, "Keep the title friendly");
  const description = String(body.description ?? "").trim().slice(0, 200) || null;

  const { data, error } = await admin
    .from("custom_packs")
    .update({ title, description })
    .eq("id", id)
    .select("id, title, description, created_at")
    .single();
  if (error) return err(500, error.message);

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");

  const { id } = await params;
  const admin = createAdminClient();
  const pack = await getOwnedPack(admin, id, user.id);
  if (!pack) return err(404, "Pack not found");

  await admin.from("custom_packs").delete().eq("id", id);
  return Response.json({ ok: true });
}
