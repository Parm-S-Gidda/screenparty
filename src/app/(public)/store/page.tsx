import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPacks } from "@/lib/store";
import { StoreClient } from "@/components/store/StoreClient";

export const metadata: Metadata = {
  title: "Pack Store: Themed Packs for Every Game | ScreenParty",
  description: "Themed packs that work in every ScreenParty game. Halloween, holidays, 90s throwbacks and more: one pack brings trivia, would-you-rathers, charades and more.",
};

export default async function StorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const packs = await loadPacks(createAdminClient(), user?.id ?? null);
  return <StoreClient packs={packs} signedIn={Boolean(user)} />;
}
