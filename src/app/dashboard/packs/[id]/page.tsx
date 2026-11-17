import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Pack",
  robots: { index: false, follow: false },
};

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/cartoon/BackLink";
import { PackEditorClient } from "@/components/PackEditorClient";
import { CUSTOM_PACK_QUESTION_MAX } from "@/lib/constants";

export default async function PackEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/packs");

  const { id } = await params;
  if (id === "new") {
    // The "new" route is handled client-side via PacksClient; direct navigation
    // lands here, redirect to the list.
    redirect("/dashboard/packs");
  }

  const admin = createAdminClient();
  const [{ data: pack }, { data: questions }] = await Promise.all([
    admin.from("custom_packs").select("id, title, description, host_user_id").eq("id", id).maybeSingle(),
    admin.from("custom_pack_questions")
      .select("id, question_text, correct_answer, accepted_answers, difficulty")
      .eq("pack_id", id)
      .order("created_at"),
  ]);

  if (!pack || pack.host_user_id !== user.id) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-6">
      <BackLink href="/dashboard/packs" label="my packs" className="mb-4" />
      <PackEditorClient
        pack={{ id: pack.id, title: pack.title, description: pack.description ?? "" }}
        initialQuestions={questions ?? []}
        maxQuestions={CUSTOM_PACK_QUESTION_MAX}
      />
    </main>
  );
}
