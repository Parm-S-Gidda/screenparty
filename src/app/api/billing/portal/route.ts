import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GameError } from "@/lib/game/engine";
import { errorResponse } from "@/lib/game/roomService";
import { getStripe, siteUrl, stripeConfigured } from "@/lib/billing/stripe";

// POST /api/billing/portal, Stripe customer portal (manage/cancel plan).
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new GameError(401, "Sign in first");
    if (!stripeConfigured())
      throw new GameError(503, "Billing isn't configured yet (missing Stripe keys)");

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!sub?.stripe_customer_id) throw new GameError(404, "No billing account yet");

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl()}/dashboard`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return errorResponse(err);
  }
}
