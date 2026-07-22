import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyDayPass, applySubscription, getStripe } from "@/lib/billing/stripe";

// POST /api/billing/webhook, Stripe events. Signature-verified; plan changes
// come exclusively from subscription lifecycle events, which carry the full
// subscription object in the payload (no Stripe API reads needed here).
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const admin = createAdminClient();

        let userId = sub.metadata?.user_id;
        if (!userId) {
          // fallback: map via a previously stored customer id
          const { data } = await admin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", String(sub.customer))
            .maybeSingle();
          userId = data?.user_id;
        }
        if (!userId) break; // not one of ours; ack and move on

        const item = sub.items?.data?.[0];
        await applySubscription(admin, userId, {
          id: sub.id,
          customer: String(sub.customer),
          status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
          priceId: item?.price?.id ?? null,
          currentPeriodEnd: item?.current_period_end ?? null,
          eventCreated: event.created,
        });
        break;
      }
      case "checkout.session.completed": {
        // one-time 24h Party Pass (payment mode); subscriptions are handled
        // entirely by the customer.subscription.* events above
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "payment" || session.payment_status !== "paid") break;
        if (session.metadata?.plan !== "party_pass") break;
        const userId = session.metadata?.user_id ?? session.client_reference_id;
        if (!userId) break;
        await applyDayPass(createAdminClient(), userId);
        break;
      }
      default:
        break; // unhandled event types are acknowledged
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error("webhook handling failed", err);
    return Response.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
