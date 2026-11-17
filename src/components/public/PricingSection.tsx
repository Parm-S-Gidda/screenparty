import Link from "next/link";
import { LIMITS, AI_HOST_FREE_BETA } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { RevealItem, RevealList } from "@/components/public/Reveal";

const GAME_COUNT = AVAILABLE_GAMES.length;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: [
      `Up to ${LIMITS.free.maxPlayers} players per room`,
      `All ${GAME_COUNT} games`,
      `${LIMITS.free.roomTtlHours}-hour rooms`,
      `${LIMITS.free.aiHostGamesPerMonth} Virtual Host games a month${AI_HOST_FREE_BETA ? " (beta)" : ""}`,
      `Up to ${LIMITS.free.maxQuestions} questions per game`,
    ],
    cta: { label: "Host free", href: "/signup" },
  },
  {
    name: "Party Pass",
    price: "$5.99",
    cadence: "once · 24 hours",
    features: [
      `Up to ${LIMITS.party_plus.maxPlayers} players per room`,
      `All ${GAME_COUNT} games`,
      `${LIMITS.party_plus.roomTtlHours}-hour rooms`,
      "Virtual Host at Party+ limits",
      `Up to ${LIMITS.party_plus.maxQuestions} questions per game`,
      "Buy again to add 24 more hours",
      "No subscription",
    ],
    cta: { label: "Get a Party Pass", href: "/signup" },
    featured: "Best for one night",
  },
  {
    name: "Party+",
    price: "$10",
    cadence: "per month",
    features: [
      `Up to ${LIMITS.party_plus.maxPlayers} players per room`,
      `All ${GAME_COUNT} games`,
      `${LIMITS.party_plus.roomTtlHours}-hour rooms`,
      `${LIMITS.party_plus.aiHostGamesPerMonth} Virtual Host games a month`,
      `Up to ${LIMITS.party_plus.maxQuestions} questions per game`,
      "Cancel any time",
    ],
    cta: { label: "Start Party+", href: "/signup" },
  },
  {
    name: "Pro Host",
    price: "$30",
    cadence: "per month",
    features: [
      `Up to ${LIMITS.pro_host.maxPlayers} players per room`,
      `All ${GAME_COUNT} games`,
      `${LIMITS.pro_host.roomTtlHours}-hour rooms`,
      `${LIMITS.pro_host.aiHostGamesPerMonth} Virtual Host games a month`,
      `Up to ${LIMITS.pro_host.maxQuestions} questions per game`,
      `Up to ${LIMITS.pro_host.maxRoomsPerDay} rooms a day`,
      "Cancel any time",
    ],
    cta: { label: "Choose Pro Host", href: "/signup" },
  },
] as const;

export function PricingSection() {
  return (
    <RevealList className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan) => {
        const featured = "featured" in plan;
        return (
          <RevealItem
            key={plan.name}
            className={`panel-paper panel-grain relative flex flex-col gap-4 p-6 ${featured ? "lg:-translate-y-3" : ""}`}
          >
            {featured && (
              <span className="chip absolute -top-3.5 left-5" style={{ background: "var(--mustard)", color: "var(--ink)", border: "2px solid var(--ink)" }}>
                {plan.featured}
              </span>
            )}
            <div>
              <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>
                {plan.name}
              </h3>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-score text-4xl tabular-nums" style={{ color: "var(--ink)" }}>
                  {plan.price}
                </span>
                <span className="font-hand text-lg" style={{ color: "var(--ink-label)" }}>
                  {plan.cadence}
                </span>
              </p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 border-t-2 border-dashed pt-4" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
              {plan.features.map((f) => (
                <li key={f} className="font-hand flex items-start gap-2.5 text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-1.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className="btn-rough mt-1 px-4 py-2.5 text-center text-lg"
              style={featured ? undefined : { background: "var(--ink)", color: "var(--cream)" }}
            >
              {plan.cta.label}
            </Link>
          </RevealItem>
        );
      })}
    </RevealList>
  );
}
