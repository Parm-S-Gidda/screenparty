import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignOutButton } from "@/components/SignOutButton";
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

  const planName = hasDayPass ? "Party Pass" : PLAN_LABELS[effectiveTier];
  const status =
    hasDayPass && profile?.day_pass_expires_at
      ? `Active until ${new Date(profile.day_pass_expires_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`
      : subscribedTier !== "free" && sub?.current_period_end
        ? `${sub.status === "past_due" ? "Payment retrying, next try" : "Renews"} ${new Date(sub.current_period_end).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`
        : "Free forever. Upgrade any time.";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-5 md:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="font-display text-2xl uppercase leading-none md:text-3xl" aria-label={`${BRAND_NAME} home`}>
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>
        <nav aria-label="Account" className="flex flex-wrap items-center gap-x-6">
          <Link href="/dashboard" className="link-label" style={{ color: "var(--cream)" }}>
            Dashboard
          </Link>
          <Link href="/join" className="link-label" style={{ color: "var(--cream)" }}>
            Join a game
          </Link>
          <SignOutButton />
        </nav>
      </header>

      {billing === "success" && <BillingNotice kind="success" />}
      {billing === "cancelled" && <BillingNotice kind="cancelled" />}

      <section aria-labelledby="account-heading" className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="account-heading" className="font-display text-[clamp(2rem,5vw,3rem)] uppercase leading-[0.95]" style={{ color: "var(--cream)" }}>
            You&apos;re on <span style={{ color: "var(--mustard)" }}>{planName}</span>
          </h1>
          <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>
            {status}
          </p>
        </div>
        <dl className="flex flex-col md:items-end">
          <dt className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
            Signed in as
          </dt>
          <dd className="font-hand text-lg" style={{ color: "var(--cream)" }}>
            {user.email}
          </dd>
        </dl>
      </section>

      <section aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="font-display mb-6 text-2xl uppercase" style={{ color: "var(--cream)" }}>
          Plans
        </h2>
        <AccountPlans
          subscribedTier={subscribedTier}
          dayPassUntil={profile?.day_pass_expires_at ?? null}
          passActive={hasDayPass}
        />
      </section>
    </main>
  );
}
