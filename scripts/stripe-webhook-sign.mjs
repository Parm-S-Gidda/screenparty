// Emit a Stripe-signed webhook payload + signature header for offline testing.
// Subscriptions: node scripts/stripe-webhook-sign.mjs <user_id> <active|past_due|canceled> <created|updated|deleted> [price_id]
// Day pass:      node scripts/stripe-webhook-sign.mjs <user_id> daypass
import Stripe from "stripe";

const [userId, statusOrDaypass, verb, priceId] = process.argv.slice(2);
const secret = "whsec_local_test_secret";

let event;
if (statusOrDaypass === "daypass") {
  event = {
    id: "evt_test_daypass",
    object: "event",
    api_version: "2025-06-30",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        client_reference_id: userId,
        metadata: { user_id: userId, plan: "party_pass" },
      },
    },
  };
} else {
  const subscription = {
    id: "sub_test_123",
    object: "subscription",
    customer: "cus_test_123",
    status: statusOrDaypass,
    metadata: { user_id: userId },
    items: {
      data: [
        {
          price: { id: priceId ?? "price_test_123" },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        },
      ],
    },
  };
  event = {
    id: "evt_test_123",
    object: "event",
    api_version: "2025-06-30",
    created: Math.floor(Date.now() / 1000),
    type: `customer.subscription.${verb}`,
    data: { object: subscription },
  };
}

const payload = JSON.stringify(event);
const stripe = new Stripe("sk_test_placeholder");
const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

console.log(JSON.stringify({ payload, header }));
