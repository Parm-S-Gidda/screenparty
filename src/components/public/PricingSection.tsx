import Link from "next/link";
import { LIMITS, AI_HOST_FREE_BETA } from "@/lib/constants";

const INK = "#221f30";

type PricingCTA = {
  label: string;
  href: string;
  primary?: boolean;
};

type PricingSectionProps = {
  showHeading?: boolean;
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    color: "var(--cream)",
    features: [
      `Up to ${LIMITS.free.maxPlayers} players per room`,
      "All 9 games included",
      `${LIMITS.free.roomTtlHours}-hour room sessions`,
      `${LIMITS.free.aiHostGamesPerMonth} Virtual Host games per month${AI_HOST_FREE_BETA ? " (free during beta)" : ""}`,
      `${LIMITS.free.maxQuestions} questions per game max`,
    ],
    cta: { label: "Host Free", href: "/signup" } as PricingCTA,
    highlight: false,
  },
  {
    name: "Party Pass",
    price: "$5.99",
    cadence: "one-time · 24 hours",
    color: "var(--cream)",
    features: [
      `Up to ${LIMITS.party_plus.maxPlayers} players per room`,
      "All 9 games included",
      `${LIMITS.party_plus.roomTtlHours}-hour room sessions`,
      `${LIMITS.party_plus.aiHostGamesPerMonth} Virtual Host games per month`,
      `${LIMITS.party_plus.maxQuestions} questions per game max`,
      "24 hours from purchase (stackable)",
      "No subscription required",
    ],
    cta: { label: "Get a Party Pass", href: "/signup" } as PricingCTA,
    highlight: false,
  },
  {
    name: "Party+",
    price: "$10",
    cadence: "per month",
    color: "var(--cream)",
    features: [
      `Up to ${LIMITS.party_plus.maxPlayers} players per room`,
      "All 9 games included",
      `${LIMITS.party_plus.roomTtlHours}-hour room sessions`,
      `${LIMITS.party_plus.aiHostGamesPerMonth} Virtual Host games per month`,
      `${LIMITS.party_plus.maxQuestions} questions per game max`,
      "Cancel any time",
    ],
    cta: { label: "Start Party+", href: "/signup", primary: true } as PricingCTA,
    highlight: true,
  },
  {
    name: "Pro Host",
    price: "$30",
    cadence: "per month",
    color: "var(--cream)",
    features: [
      `Up to ${LIMITS.pro_host.maxPlayers} players per room`,
      "All 9 games included",
      `${LIMITS.pro_host.roomTtlHours}-hour room sessions`,
      `${LIMITS.pro_host.aiHostGamesPerMonth} Virtual Host games per month`,
      `${LIMITS.pro_host.maxQuestions} questions per game max`,
      "Up to 100 rooms per day",
      "Cancel any time",
    ],
    cta: { label: "Choose Pro Host", href: "/signup" } as PricingCTA,
    highlight: false,
  },
] as const;

export function PricingSection({ showHeading = false }: PricingSectionProps) {
  return (
    <div>
      {showHeading && (
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl uppercase tracking-wide md:text-4xl" style={{ color: "var(--cream)" }}>
            Simple, honest pricing
          </h2>
          <p className="font-hand mt-3 text-xl" style={{ color: "var(--muted-foreground)" }}>
            Start free. Upgrade for bigger groups and more Virtual Host time.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="panel-paper panel-grain relative flex flex-col gap-3 p-5"
            style={{
              background: "var(--cream)",
              outline: plan.highlight ? `3px solid var(--mustard)` : undefined,
              outlineOffset: plan.highlight ? "2px" : undefined,
            }}
          >
            {plan.highlight && (
              <span
                className="font-score absolute -top-3 left-1/2 -translate-x-1/2 rounded-md border-2 border-[#221f30] px-3 py-0.5 text-[9px] uppercase tracking-widest"
                style={{ background: "var(--mustard)", color: INK }}
              >
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl" style={{ color: INK }}>
              {plan.name}
            </h3>
            <p>
              <span className="font-score text-3xl font-bold" style={{ color: INK }}>
                {plan.price}
              </span>{" "}
              <span className="font-hand text-base" style={{ color: "#8a7f63" }}>
                {plan.cadence}
              </span>
            </p>
            <ul className="flex flex-1 flex-col gap-1.5">
              {plan.features.map((f) => (
                <li key={f} className="font-hand flex items-start gap-2 text-lg leading-snug" style={{ color: "#4a4460" }}>
                  <span aria-hidden className="mt-1 shrink-0 text-sm" style={{ color: "var(--teal)" }}>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={`btn-rough mt-2 px-4 py-2.5 text-center text-sm ${plan.highlight ? "font-display" : "font-score"} uppercase tracking-wide`}
              style={
                plan.highlight
                  ? { background: "var(--mustard)", color: INK }
                  : { background: INK, color: "var(--cream)" }
              }
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <p
        className="font-hand mt-6 text-center text-lg"
        style={{ color: "var(--muted-foreground)" }}
      >
        Party Pass and Party+ give you the same player limits. Party Pass is a single 24-hour window, no subscription.
      </p>
    </div>
  );
}
