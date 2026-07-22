import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanTier } from "@/lib/constants";

// Purchasable plans: two subscriptions and a one-time 24h day pass.
export type PurchasePlan = "party_pass" | "party_plus" | "pro_host";

export const DAY_PASS_HOURS = 24;

export function priceIdFor(plan: PurchasePlan): string | undefined {
  switch (plan) {
    case "party_pass":
      return process.env.STRIPE_PRICE_PARTY_PASS;
    case "party_plus":
      return process.env.STRIPE_PRICE_PARTY_PLUS;
    case "pro_host":
      return process.env.STRIPE_PRICE_PRO_HOST;
  }
}

// Map a Stripe price back to the subscription tier it grants. Unknown prices
// (e.g. a grandfathered price after a price change) default to party_plus.
export function tierForPrice(priceId: string | null): Exclude<PlanTier, "free"> {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO_HOST) return "pro_host";
  return "party_plus";
}

// Stripe is optional in local dev: billing endpoints report "not configured"
// instead of crashing, and the rest of the app works on the free tier.
export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PARTY_PASS &&
      process.env.STRIPE_PRICE_PARTY_PLUS &&
      process.env.STRIPE_PRICE_PRO_HOST
  );
}

export function getStripe(): Stripe {
  // Webhook signature verification works without a real key, so fall back to
  // a placeholder rather than throwing when only STRIPE_WEBHOOK_SECRET is set.
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Reflect a Stripe subscription into our tables. Called only from the webhook
// with payload data, no Stripe API round-trips, so it's fully testable
// offline with signed synthetic events.
export async function applySubscription(
  admin: SupabaseClient,
  userId: string,
  sub: {
    id: string;
    customer: string;
    status: string;
    priceId: string | null;
    currentPeriodEnd: number | null;
    eventCreated: number; // event.created, guards out-of-order delivery
  }
): Promise<void> {
  // past_due keeps access: Smart Retries + dunning emails are still trying to
  // recover the payment. Access drops on canceled/unpaid/incomplete_expired.
  const paid =
    sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  const tier: PlanTier = paid ? tierForPrice(sub.priceId) : "free";
  const eventAt = new Date(sub.eventCreated * 1000).toISOString();

  // Stripe doesn't guarantee event order: never let a delayed older event
  // overwrite state written by a newer one.
  const { data: existing } = await admin
    .from("subscriptions")
    .select("latest_event_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.latest_event_at && existing.latest_event_at > eventAt) return;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.priceId,
      current_period_end: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd * 1000).toISOString()
        : null,
      latest_event_at: eventAt,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);

  await admin.from("profiles").update({ plan_tier: tier }).eq("id", userId);
}

// One-time 24h Party Pass: extend from the current expiry when one is still
// running, otherwise from now.
export async function applyDayPass(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("day_pass_expires_at")
    .eq("id", userId)
    .maybeSingle();
  const current = profile?.day_pass_expires_at
    ? new Date(profile.day_pass_expires_at).getTime()
    : 0;
  const base = Math.max(current, Date.now());
  const expires = new Date(base + DAY_PASS_HOURS * 3600_000).toISOString();

  const { error } = await admin
    .from("profiles")
    .update({ day_pass_expires_at: expires })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
