import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Question Packs",
  robots: { index: false, follow: false },
};

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/cartoon/BackLink";
import { PacksClient } from "@/components/PacksClient";
import { LIMITS, resolveTier } from "@/lib/constants";

export default async function PacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/packs");

  const admin = createAdminClient();
  const [{ data: profile }, { data: packs }, { data: counts }] = await Promise.all([
    admin.from("profiles").select("plan_tier, day_pass_expires_at").eq("id", user.id).single(),
    admin.from("custom_packs")
      .select("id, title, description, created_at")
      .eq("host_user_id", user.id)
      .order("created_at", { ascending: false }),
    admin.from("custom_pack_counts").select("pack_id, question_count"),
  ]);

  const tier = resolveTier(profile);
  const tierLimits = LIMITS[tier];
  const countOf = new Map((counts ?? []).map((c) => [c.pack_id, c.question_count]));
  const packsWithCounts = (packs ?? []).map((p) => ({
    ...p,
    questionCount: countOf.get(p.id) ?? 0,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-6">
      <BackLink href="/dashboard" label="dashboard" className="mb-4" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide">My Packs</h1>
          <p className="mt-1 text-sm opacity-60">
            {packsWithCounts.length} / {tierLimits.customPacksMax} packs
          </p>
        </div>
        <Link href="/dashboard/packs/new" className="btn-rough px-4 py-2 text-sm font-semibold">
          + New Pack
        </Link>
      </div>

      <PacksClient
        packs={packsWithCounts}
        canCreate={packsWithCounts.length < tierLimits.customPacksMax}
        canAiGenerate={tierLimits.aiPackGenPerMonth > 0}
      />
    </main>
  );
}
