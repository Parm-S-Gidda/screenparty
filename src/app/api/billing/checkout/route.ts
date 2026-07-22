import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GameError } from "@/lib/game/engine";
import { errorResponse } from "@/lib/game/roomService";
import { dayPassActive } from "@/lib/constants";
import {
  getStripe,
  priceIdFor,
  siteUrl,
  stripeConfigured,
  type PurchasePlan,
} from "@/lib/billing/stripe";

// POST /api/billing/checkout, start a Stripe Checkout session for a plan:
// the one-time 24h Party Pass (payment mode) or a monthly subscription
// (Party+ / Pro Host). metadata.user_id rides along so the webhook can map
// Stripe events back to our user without extra API calls.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new GameError(401, "Sign in first");
    if (!stripeConfigured())
      throw new GameError(503, "Billing isn't configured yet (missing Stripe keys)");

    const body = await request.json().catch(() => ({}));
    const plan: PurchasePlan = ["party_pass", "party_plus", "pro_host"].includes(body.plan)
      ? body.plan
      : "party_plus";
    const priceId = priceIdFor(plan);
    if (!priceId) throw new GameError(503, "That plan isn't configured yet");

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    const subscribed =
      existing?.status === "active" ||
      existing?.status === "trialing" ||
      existing?.status === "past_due";
    // subscribers change plans via the customer portal, not a new checkout
    if (subscribed)
      throw new GameError(409, "You already have a subscription, manage it from billing");
    if (plan === "party_pass") {
      const { data: profile } = await admin
        .from("profiles")
        .select("day_pass_expires_at")
        .eq("id", user.id)
        .maybeSingle();
      if (dayPassActive(profile))
        throw new GameError(409, "Your Party Pass is still active");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: plan === "party_pass" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existing?.stripe_customer_id ?? undefined,
      customer_email: existing?.stripe_customer_id ? undefined : (user.email ?? undefined),
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      ...(plan === "party_pass"
        ? {}
        : { subscription_data: { metadata: { user_id: user.id } } }),
      success_url: `${siteUrl()}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/dashboard?billing=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return errorResponse(err);
  }
}
