// Run with: node --import jiti/register --test src/lib/store.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, isNew, itemTotal, ownedPackOptions, percentOff, priceOf, type StorePack } from "./store";

const pack = (o: Partial<StorePack>): StorePack => ({
  id: "p", slug: "p", title: "P", tagline: "", description: "", art: "star", color: "#000", accent: "#fff", tags: [],
  priceCents: 499, salePriceCents: null, featured: false, isDemo: false, releasedAt: "2026-11-01", counts: {}, owned: false, ...o,
});

test("sale price wins and the discount rounds", () => {
  assert.equal(priceOf(pack({})), 499);
  assert.equal(priceOf(pack({ salePriceCents: 299 })), 299);
  assert.equal(percentOff(pack({ salePriceCents: 299 })), 40);
  assert.equal(percentOff(pack({})), 0);
  assert.equal(formatPrice(299), "$2.99");
  assert.equal(formatPrice(0), "Free");
});

test("new means released in the last 30 days", () => {
  const now = new Date("2026-11-18").getTime();
  assert.equal(isNew(pack({ releasedAt: "2026-11-01" }), now), true);
  assert.equal(isNew(pack({ releasedAt: "2026-10-01" }), now), false);
});

test("setup screens only offer owned packs with content for that game", () => {
  const packs = [
    pack({ id: "a", owned: true, counts: { wyr: 10, mlt: 5 } }),
    pack({ id: "b", owned: true, counts: { mlt: 5 } }),
    pack({ id: "c", owned: false, counts: { wyr: 10 } }),
  ];
  assert.deepEqual(ownedPackOptions(packs, "wyr").map((p) => [p.id, p.count]), [["a", 10]]);
  assert.equal(itemTotal(packs[0]), 15);
});
