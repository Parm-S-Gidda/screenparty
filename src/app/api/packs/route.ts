// GET  /api/packs  — list the signed-in user's custom packs
// POST /api/packs  — create a new empty custom pack

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { containsBlockedWord } from "@/lib/moderation";
import { rateLimit } from "@/lib/rateLimit";
import {
  CUSTOM_PACK_TITLE_MAX,
  LIMITS,
  resolveTier,
} from "@/lib/constants";

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return err(401, "Sign in first");

  const admin = createAdminClient();
  const { data: packs } = await admin
    .from("custom_packs")
    .select("id, title, description, created_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: counts } = await admin
    .from("custom_pack_counts")
    .select("pack_id, question_count");
  const countOf = new Map((counts ?? []).map((c) => [c.pack_id, c.question_count]));

  return Response.json(
    (packs ?? []).map((p) => ({
      ...p,
      questionCount: countOf.get(p.id) ?? 0,
    }))
  );
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return err(401, "Sign in first");
  if (!await rateLimit(`pack-create:${user.id}`, 10, 60_000)) return err(429, "Slow down");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, day_pass_expires_at")
    .eq("id", user.id)
    .single();
  const tier = resolveTier(profile);
  const tierLimits = LIMITS[tier];

  const { count: existing } = await admin
    .from("custom_packs")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", user.id);
  if ((existing ?? 0) >= tierLimits.customPacksMax)
    return err(403, `Your plan allows up to ${tierLimits.customPacksMax} custom packs`);

  const body = await request.json();
  const title = String(body.title ?? "").trim().slice(0, CUSTOM_PACK_TITLE_MAX);
  if (!title) return err(400, "Pack needs a title");
  if (containsBlockedWord(title)) return err(400, "Keep the title friendly");

  const description = String(body.description ?? "").trim().slice(0, 200) || null;

  const { data, error } = await admin
    .from("custom_packs")
    .insert({ host_user_id: user.id, title, description })
    .select("id, title, description, created_at")
    .single();
  if (error) return err(500, error.message);

  return Response.json({ ...data, questionCount: 0 }, { status: 201 });
}
