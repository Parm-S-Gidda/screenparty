import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPacks, testCheckoutEnabled } from "@/lib/store";
import { CheckoutClient } from "@/components/store/CheckoutClient";

export const metadata: Metadata = { title: "Checkout | ScreenParty Store", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/store/${slug}/checkout`);
  const [pack] = await loadPacks(createAdminClient(), user.id, slug);
  if (!pack || pack.isDemo) notFound();
  if (pack.owned) redirect("/store/library");
  return <CheckoutClient pack={pack} email={user.email ?? ""} testMode={testCheckoutEnabled()} />;
}
