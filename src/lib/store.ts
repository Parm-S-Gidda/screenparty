// Pack store: one themed pack works in every game. Shared types, price
// helpers and the server-side loaders the store pages and setup screens use.

import type { SupabaseClient } from "@supabase/supabase-js";

// games a pack can carry content for (TTAL has none: players write their own)
export const PACK_GAMES = ["buzz_trivia", "wyr", "mlt", "hol", "gtp", "tank", "charades", "num"] as const;
export type PackGame = (typeof PACK_GAMES)[number];

export const PACK_GAME_LABELS: Record<PackGame, { name: string; unit: string }> = {
  buzz_trivia: { name: "Fact Frenzy", unit: "questions" },
  wyr: { name: "Would You Rather", unit: "dilemmas" },
  mlt: { name: "Most Likely To", unit: "prompts" },
  hol: { name: "Higher or Lower", unit: "comparisons" },
  gtp: { name: "Guess the Player", unit: "questions" },
  tank: { name: "Shark Tank", unit: "products" },
  charades: { name: "Charades", unit: "words" },
  num: { name: "Number Crunch", unit: "themes" },
};

export type StorePack = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  art: string;
  color: string;
  accent: string;
  tags: string[];
  priceCents: number;
  salePriceCents: number | null;
  featured: boolean;
  isDemo: boolean;
  releasedAt: string;
  counts: Partial<Record<PackGame, number>>;
  owned: boolean;
};

// Purchases are test-only until Stripe is wired up; never hand out free packs
// in production unless explicitly switched on.
export function testCheckoutEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.STORE_TEST_CHECKOUT === "true";
}

export const priceOf = (p: Pick<StorePack, "priceCents" | "salePriceCents">) => p.salePriceCents ?? p.priceCents;
export const onSale = (p: Pick<StorePack, "salePriceCents">) => p.salePriceCents !== null;
export const percentOff = (p: Pick<StorePack, "priceCents" | "salePriceCents">) =>
  p.salePriceCents === null ? 0 : Math.round((1 - p.salePriceCents / p.priceCents) * 100);
export const formatPrice = (cents: number) => (cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`);

const NEW_DAYS = 30;
export function isNew(p: Pick<StorePack, "releasedAt">, now = Date.now()): boolean {
  return now - new Date(p.releasedAt).getTime() <= NEW_DAYS * 86_400_000;
}

/** Total playable items across every game in the pack. */
export const itemTotal = (p: Pick<StorePack, "counts">) => Object.values(p.counts).reduce((a, b) => a + (b ?? 0), 0);

type PackRow = {
  id: string; slug: string; title: string; tagline: string; description: string; art: string; color: string;
  accent: string; tags: string[]; price_cents: number; sale_price_cents: number | null; featured: boolean;
  is_demo: boolean; released_at: string;
};

/** Every pack (or one, by slug) with its per-game counts and whether `userId` owns it. */
export async function loadPacks(admin: SupabaseClient, userId: string | null, slug?: string): Promise<StorePack[]> {
  let query = admin.from("store_packs").select("*").order("released_at", { ascending: false });
  if (slug) query = query.eq("slug", slug);
  const [{ data: packs }, { data: counts }, { data: owned }] = await Promise.all([
    query,
    admin.from("store_pack_counts").select("pack_id, game_type, item_count"),
    userId ? admin.from("pack_purchases").select("pack_id").eq("user_id", userId).neq("status", "refunded") : Promise.resolve({ data: [] }),
  ]);
  const ownedIds = new Set((owned ?? []).map((o: { pack_id: string }) => o.pack_id));
  return ((packs ?? []) as PackRow[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    art: p.art,
    color: p.color,
    accent: p.accent,
    tags: p.tags,
    priceCents: p.price_cents,
    salePriceCents: p.sale_price_cents,
    featured: p.featured,
    isDemo: p.is_demo,
    releasedAt: p.released_at,
    counts: Object.fromEntries(
      (counts ?? []).filter((c) => c.pack_id === p.id).map((c) => [c.game_type, c.item_count]),
    ),
    owned: ownedIds.has(p.id),
  }));
}

/** Owned packs that have content for `game`, for the setup screens' pack picker. */
export type OwnedPackOption = { id: string; title: string; art: string; color: string; accent: string; count: number };
export function ownedPackOptions(packs: StorePack[], game: string): OwnedPackOption[] {
  return packs
    .filter((p) => p.owned && (p.counts[game as PackGame] ?? 0) > 0)
    .map((p) => ({ id: p.id, title: p.title, art: p.art, color: p.color, accent: p.accent, count: p.counts[game as PackGame] ?? 0 }));
}
