"use client";

import { useState } from "react";
import { LIMITS, type PlanTier } from "@/lib/constants";
import type { PurchasePlan } from "@/lib/billing/stripe";

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
          return { label: "Downgrade", onClick: () => go("portal") };
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
          return { label: "Downgrade", onClick: () => go("portal") };
        return { label: "Subscribe", onClick: () => go("checkout", "party_plus") };
      case "pro_host":
        if (subscribedTier === "pro_host") return { label: "Current plan", disabled: true };
        if (subscribedTier === "party_plus")
          return { label: "Upgrade", onClick: () => go("portal") };
        return { label: "Subscribe", onClick: () => go("checkout", "pro_host") };
    }
  }

  const currentKey: CardDef["key"] = subscribed
    ? (subscribedTier as CardDef["key"])
    : passActive
      ? "party_pass"
      : "free";

  // one mustard action per view: the next plan up that the host can buy (never a downgrade)
  const currentIndex = CARDS.findIndex((c) => c.key === currentKey);
  const goKey = CARDS.find((c, i) => i > currentIndex && !actionFor(c).disabled)?.key;

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const action = actionFor(card);
          const isCurrent = card.key === currentKey;
          return (
            <li
              key={card.key}
              className="panel-paper panel-grain relative flex flex-col gap-4 p-5"
              style={isCurrent ? { outline: "3px solid var(--mustard)", outlineOffset: "3px" } : undefined}
            >
              {isCurrent && (
                <span className="chip absolute -top-3.5 left-5" style={{ background: "var(--mustard)", color: "var(--ink)", border: "2px solid var(--ink)" }}>
                  Your plan
                </span>
              )}
              <div>
                <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>
                  {card.title}
                </h3>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-score text-3xl tabular-nums" style={{ color: "var(--ink)" }}>
                    {card.price}
                  </span>
                  <span className="font-hand text-lg" style={{ color: "var(--ink-label)" }}>
                    {card.cadence}
                  </span>
                </p>
                <p className="font-hand mt-1 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                  {card.blurb}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-1.5 border-t-2 border-dashed pt-4" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
                {card.features.map((f) => (
                  <li key={f} className="font-hand flex items-start gap-2.5 text-base leading-snug" style={{ color: "var(--ink-body)" }}>
                    <svg aria-hidden viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {action.disabled ? (
                <p className="font-score min-h-11 content-center text-center text-sm uppercase tracking-[0.12em]" style={{ color: "var(--ink-label)" }}>
                  {action.label}
                </p>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={action.onClick}
                  className="btn-rough px-4 py-2.5 text-lg"
                  style={card.key === goKey ? undefined : { background: "var(--ink)", color: "var(--cream)" }}
                >
                  {busy ? "One moment…" : action.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="font-hand rounded-lg border-[3px] px-3 py-2 text-center text-lg" style={{ borderColor: "var(--ink)", background: "var(--cream)", color: "var(--error-red)" }}>
          {error}
        </p>
      )}

      {subscribed && (
        <div className="panel-paper panel-grain flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg" style={{ color: "var(--ink)" }}>Billing</p>
            <p className="font-hand text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
              Payment method, invoices and cancelling all live in the Stripe billing portal.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => go("portal")}
            className="btn-rough shrink-0 px-5 py-2.5 text-lg"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Open billing portal
          </button>
        </div>
      )}
    </div>
  );
}
