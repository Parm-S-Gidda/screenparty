import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { AccountPlans } from "@/components/AccountPlans";
import { BillingNotice } from "@/components/BillingNotice";
import {
  BRAND_NAME,
  PLAN_LABELS,
  dayPassActive,
  resolveTier,
  tierFromString,
} from "@/lib/constants";

// Account & plan management: what you're on, what's included, upgrade or
// downgrade. Actual payment changes happen in Stripe (checkout / portal).
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { billing } = await searchParams;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, day_pass_expires_at")
    .eq("id", user.id)
    .single();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscribedTier = tierFromString(profile?.plan_tier);
  const effectiveTier = resolveTier(profile);
  const hasDayPass = dayPassActive(profile) && subscribedTier === "free";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground">
          ← Dashboard
        </Link>
        <Link href="/" className="font-display text-2xl uppercase tracking-wide">
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>
      </div>

      {billing === "success" && <BillingNotice kind="success" />}
      {billing === "cancelled" && <BillingNotice kind="cancelled" />}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Your account</h1>
        <Badge variant={effectiveTier === "free" ? "secondary" : "default"}>
          {hasDayPass ? "Party Pass" : PLAN_LABELS[effectiveTier]}
        </Badge>
        {hasDayPass && profile?.day_pass_expires_at && (
          <span className="text-sm text-foreground/80">
            active until {new Date(profile.day_pass_expires_at).toLocaleString()}
          </span>
        )}
        {subscribedTier !== "free" && sub?.current_period_end && (
          <span className="text-sm text-foreground/80">
            {sub.status === "past_due" ? "payment retrying · " : "renews "}
            {new Date(sub.current_period_end).toLocaleDateString()}
          </span>
        )}
        <span className="ml-auto text-sm text-foreground/70">{user.email}</span>
      </div>

      <AccountPlans
        subscribedTier={subscribedTier}
        dayPassUntil={profile?.day_pass_expires_at ?? null}
        passActive={hasDayPass}
      />
    </main>
  );
}
