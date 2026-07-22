"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LIMITS, type PlanTier } from "@/lib/constants";
import type { PurchasePlan } from "@/lib/billing/stripe";
import { cn } from "@/lib/utils";

// Plan comparison + upgrade/downgrade actions for the account page.
// Subscribers change or cancel plans through the Stripe customer portal;
// free hosts start a checkout.

function features(tier: Exclude<PlanTier, "free"> | "free"): string[] {
  const l = LIMITS[tier];
  return [
    `Up to ${l.maxPlayers} players per room`,
    `${l.maxQuestions} questions per game`,
    `${l.roomTtlHours}-hour rooms`,
    `${l.maxRoomsPerDay} rooms per day`,
    `${l.aiHostGamesPerMonth} AI-hosted games / month`,
    `${l.elevenLabsCharsPerMonth.toLocaleString()} AI voice characters / month`,
  ];
}

type CardDef = {
  key: "free" | PurchasePlan;
  title: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

const CARDS: CardDef[] = [
  {
    key: "free",
    title: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Everything you need for a casual game night.",
    features: features("free"),
  },
  {
    key: "party_pass",
    title: "Party Pass",
    price: "$5.99",
    cadence: "one-time · 24 hours",
    blurb: "All of Party+ for a day. No subscription.",
    features: features("party_plus"),
  },
  {
    key: "party_plus",
    title: "Party+",
    price: "$10",
    cadence: "per month",
    blurb: "For regular hosts who want the full show.",
    features: features("party_plus"),
    highlight: true,
  },
  {
    key: "pro_host",
    title: "Pro Host",
    price: "$30",
    cadence: "per month",
    blurb: "Big rooms, long sessions, top AI limits.",
    features: features("pro_host"),
  },
];

export function AccountPlans({
  subscribedTier,
  dayPassUntil,
  passActive,
}: {
  subscribedTier: PlanTier; // subscription only, day pass is passed separately
  dayPassUntil: string | null;
  passActive: boolean; // computed server-side (render must stay pure)
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const subscribed = subscribedTier !== "free";

  async function go(endpoint: "checkout" | "portal", plan?: PurchasePlan) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/billing/${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: plan ? JSON.stringify({ plan }) : undefined,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Billing request failed");
      window.location.assign(body.url);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function actionFor(card: CardDef): { label: string; onClick?: () => void; disabled?: boolean } {
    switch (card.key) {
      case "free":
        if (subscribed)
          return { label: "Downgrade in billing portal", onClick: () => go("portal") };
        return { label: passActive ? "Back here after your pass" : "Current plan", disabled: true };
      case "party_pass":
        if (subscribed) return { label: "Covered by your plan", disabled: true };
        if (passActive)
          return {
            label: `Active until ${new Date(dayPassUntil!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
            disabled: true,
          };
        return { label: "Buy Party Pass", onClick: () => go("checkout", "party_pass") };
      case "party_plus":
        if (subscribedTier === "party_plus") return { label: "Current plan", disabled: true };
        if (subscribedTier === "pro_host")
          return { label: "Downgrade in billing portal", onClick: () => go("portal") };
        return { label: "Subscribe", onClick: () => go("checkout", "party_plus") };
      case "pro_host":
        if (subscribedTier === "pro_host") return { label: "Current plan", disabled: true };
        if (subscribedTier === "party_plus")
          return { label: "Upgrade in billing portal", onClick: () => go("portal") };
        return { label: "Subscribe", onClick: () => go("checkout", "pro_host") };
    }
  }

  const currentKey: CardDef["key"] = subscribed
    ? (subscribedTier as CardDef["key"])
    : passActive
      ? "party_pass"
      : "free";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const action = actionFor(card);
          const isCurrent = card.key === currentKey;
          return (
            <div
              key={card.key}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5 text-card-foreground",
                isCurrent ? "border-primary ring-1 ring-primary" : "border-border",
                card.highlight && !isCurrent && "border-card-foreground/30"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{card.title}</h3>
                {isCurrent && <Badge>Current</Badge>}
                {card.highlight && !isCurrent && <Badge variant="secondary">Popular</Badge>}
              </div>
              <p className="text-2xl font-black">
                {card.price}{" "}
                <span className="text-sm font-medium text-card-foreground/70">{card.cadence}</span>
              </p>
              <p className="mb-3 mt-1 text-sm text-card-foreground/75">{card.blurb}</p>
              <ul className="mb-4 flex flex-col gap-1.5 text-sm text-card-foreground/85">
                {card.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto"
                variant={action.disabled ? "outline" : card.highlight ? "default" : "secondary"}
                disabled={busy || action.disabled}
                onClick={action.onClick}
              >
                {busy && action.onClick ? "One moment…" : action.label}
              </Button>
            </div>
          );
        })}
      </div>

      {subscribed && (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 text-card-foreground">
          <p className="text-sm text-card-foreground/80">
            Payment method, invoices, and cancellation live in the Stripe billing portal.
          </p>
          <Button variant="outline" disabled={busy} onClick={() => go("portal")}>
            Open billing portal
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
