import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfigForm } from "@/components/ConfigForm";
import { TtalConfigForm } from "@/components/TtalConfigForm";
import { WyrConfigForm } from "@/components/WyrConfigForm";
import { SimpleGameConfigForm } from "@/components/SimpleGameConfigForm";
import { resolveTier } from "@/lib/constants";

const SIMPLE_GAMES = ["mlt", "hol", "gtp", "tank", "charades", "num"] as const;

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host/new");
  const { game } = await searchParams;

  const admin = createAdminClient();

  const isSpecialGame = game === "ttal" || game === "wyr" || SIMPLE_GAMES.includes(game as typeof SIMPLE_GAMES[number]);
  if (isSpecialGame) {
    const { data: gameProfile } = await admin
      .from("profiles")
      .select("plan_tier, day_pass_expires_at")
      .eq("id", user.id)
      .single();
    const tier = resolveTier(gameProfile);
    if (game === "ttal") return <TtalConfigForm planTier={tier} />;
    if (game === "wyr") return <WyrConfigForm planTier={tier} />;
    return <SimpleGameConfigForm gameType={game!} planTier={tier} />;
  }
  const { data: packs } = await admin
    .from("question_packs")
    .select("id, title, topic, description, is_premium")
    .order("title");
  const { data: counts } = await admin.from("question_pack_counts").select("pack_id, question_count");
  const countByPack = new Map((counts ?? []).map((c) => [c.pack_id, c.question_count]));

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, day_pass_expires_at")
    .eq("id", user.id)
    .single();

  return (
    <ConfigForm
      packs={(packs ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        topic: p.topic,
        description: p.description ?? "",
        isPremium: p.is_premium,
        questionCount: countByPack.get(p.id) ?? 0,
      }))}
      planTier={resolveTier(profile)}
    />
  );
}
