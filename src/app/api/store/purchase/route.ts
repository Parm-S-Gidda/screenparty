// POST /api/store/purchase { slug }
// Test checkout: records the purchase without taking payment. Stripe slots in
// here later (create a Checkout Session, record the purchase from the webhook).
// Refused in production unless STORE_TEST_CHECKOUT=true, so packs aren't free.

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rateLimit";
import { priceOf, testCheckoutEnabled } from "@/lib/store";

const err = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in to buy packs");
  if (!(await rateLimit(`store-buy:${user.id}`, 10, 60_000))) return err(429, "Slow down");
  if (!testCheckoutEnabled()) return err(503, "Checkout isn't open yet");

  const { slug } = await request.json().catch(() => ({}));
  const admin = createAdminClient();
  const { data: pack } = await admin
    .from("store_packs")
    .select("id, price_cents, sale_price_cents, is_demo")
    .eq("slug", String(slug ?? ""))
    .maybeSingle();
  if (!pack) return err(404, "Pack not found");
  if (pack.is_demo) return err(400, "That pack isn't available yet");

  const { error } = await admin.from("pack_purchases").insert({
    user_id: user.id,
    pack_id: pack.id,
    price_cents: priceOf({ priceCents: pack.price_cents, salePriceCents: pack.sale_price_cents }),
    status: "test",
  });
  // already owned is fine: buying twice never charges or duplicates
  if (error && error.code !== "23505") return err(500, error.message);
  return Response.json({ ok: true }, { status: 201 });
}
