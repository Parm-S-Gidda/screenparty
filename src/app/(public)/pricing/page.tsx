import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, LIMITS, AI_HOST_FREE_BETA } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { PricingSection } from "@/components/public/PricingSection";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { TapedLabel } from "@/components/cartoon/Panel";
import { SpotRays } from "@/components/cartoon/Doodles";

export const metadata: Metadata = {
  title: `Pricing | ${BRAND_NAME}`,
  description: `Start free with ${LIMITS.free.maxPlayers} players and all ${AVAILABLE_GAMES.length} games. Upgrade for larger groups and more Virtual Host sessions. Party Pass: $5.99 for 24 hours. No subscription needed for one night.`,
  openGraph: {
    title: `Pricing | ${BRAND_NAME}`,
    description: `Start free. ${LIMITS.free.maxPlayers} players, all games, no credit card. Upgrade for larger groups.`,
  },
};

const INK = "#221f30";

const PRICING_FAQS = [
  {
    q: "Is there a free trial?",
    a: `The free plan is permanent, not a trial. You can host up to ${LIMITS.free.maxPlayers} players with all ${AVAILABLE_GAMES.length} games forever at no cost.`,
  },
  {
    q: "How does the Party Pass work?",
    a: `The Party Pass is a one-time $5.99 purchase that gives you Party+ limits for 24 hours from the time of purchase. If you already have an active Party Pass, new time is added to the existing expiry. It doesn't auto-renew.`,
  },
  {
    q: "What's the difference between Party Pass and Party+?",
    a: `Both give you the same player limits (${LIMITS.party_plus.maxPlayers} players) and room session lengths (${LIMITS.party_plus.roomTtlHours} hours). Party Pass is a one-time 24-hour purchase. Party+ is a monthly subscription with ${LIMITS.party_plus.aiHostGamesPerMonth} Virtual Host game sessions per month.`,
  },
  {
    q: "Can I cancel a subscription at any time?",
    a: "Yes. Party+ and Pro Host subscriptions can be cancelled at any time from your account page. You keep access until the end of the current billing period.",
  },
  {
    q: "What does the player limit apply to?",
    a: "The player limit is the maximum number of players that can be in a single room at the same time. The host is not counted as a player.",
  },
  {
    q: `What does 'Virtual Host games per month' mean?`,
    a: "Each game session where the Virtual Host is enabled counts as one. The session length does not matter. The limit resets at the start of each billing cycle. Unused sessions don't roll over.",
  },
  {
    q: "Do all plans include all games?",
    a: `Yes. All ${AVAILABLE_GAMES.length} games are included on every plan including the free plan.`,
  },
  {
    q: "What happens at the end of a room session?",
    a: `Rooms expire after ${LIMITS.free.roomTtlHours} hours (Free), ${LIMITS.party_plus.roomTtlHours} hours (Party+/Party Pass), or ${LIMITS.pro_host.roomTtlHours} hours (Pro Host). Once expired, players can no longer rejoin. You can create a new room at any time.`,
  },
];

const FEATURE_ROWS: {
  feature: string;
  free: string;
  partyPass: string;
  partyPlus: string;
  proHost: string;
}[] = [
  {
    feature: "Players per room",
    free: `Up to ${LIMITS.free.maxPlayers}`,
    partyPass: `Up to ${LIMITS.party_plus.maxPlayers}`,
    partyPlus: `Up to ${LIMITS.party_plus.maxPlayers}`,
    proHost: `Up to ${LIMITS.pro_host.maxPlayers}`,
  },
  {
    feature: "Games included",
    free: `All ${AVAILABLE_GAMES.length}`,
    partyPass: `All ${AVAILABLE_GAMES.length}`,
    partyPlus: `All ${AVAILABLE_GAMES.length}`,
    proHost: `All ${AVAILABLE_GAMES.length}`,
  },
  {
    feature: "Room session length",
    free: `${LIMITS.free.roomTtlHours} hours`,
    partyPass: `${LIMITS.party_plus.roomTtlHours} hours`,
    partyPlus: `${LIMITS.party_plus.roomTtlHours} hours`,
    proHost: `${LIMITS.pro_host.roomTtlHours} hours`,
  },
  {
    feature: "Max questions per game",
    free: `${LIMITS.free.maxQuestions}`,
    partyPass: `${LIMITS.party_plus.maxQuestions}`,
    partyPlus: `${LIMITS.party_plus.maxQuestions}`,
    proHost: `${LIMITS.pro_host.maxQuestions}`,
  },
  {
    feature: "Rooms per day",
    free: `${LIMITS.free.maxRoomsPerDay}`,
    partyPass: `${LIMITS.party_plus.maxRoomsPerDay}`,
    partyPlus: `${LIMITS.party_plus.maxRoomsPerDay}`,
    proHost: `${LIMITS.pro_host.maxRoomsPerDay}`,
  },
  {
    feature: "Virtual Host games / month",
    free: `${LIMITS.free.aiHostGamesPerMonth}${AI_HOST_FREE_BETA ? " (beta)" : ""}`,
    partyPass: `${LIMITS.party_plus.aiHostGamesPerMonth}`,
    partyPlus: `${LIMITS.party_plus.aiHostGamesPerMonth}`,
    proHost: `${LIMITS.pro_host.aiHostGamesPerMonth}`,
  },
  {
    feature: "Subscription required",
    free: "No",
    partyPass: "No",
    partyPlus: "Monthly",
    proHost: "Monthly",
  },
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    applicationCategory: "GameApplication",
    operatingSystem: "Web browser",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Party Pass", price: "5.99", priceCurrency: "USD" },
      { "@type": "Offer", name: "Party+", price: "10.00", priceCurrency: "USD", billingIncrement: "P1M" },
      { "@type": "Offer", name: "Pro Host", price: "30.00", priceCurrency: "USD", billingIncrement: "P1M" },
    ],
  };

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "Pricing", href: "/pricing" },
          ]}
        />

        <div className="mb-10 max-w-2xl">
          <TapedLabel tilt={-1} color="var(--paper)">
            <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
              honest pricing
            </span>
          </TapedLabel>
          <h1
            className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
            style={{ color: "var(--cream)" }}
          >
            Simple Pricing
          </h1>
          <p className="font-hand mt-4 text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
            Start free with all {AVAILABLE_GAMES.length} games and {LIMITS.free.maxPlayers} players. Upgrade for bigger groups or more Virtual Host time.
            One-night event? The Party Pass is $5.99 with no subscription.
          </p>
        </div>

        {/* Pricing cards */}
        <PricingSection />

        {/* Feature comparison */}
        <section aria-labelledby="comparison-heading" className="mt-16">
          <h2
            id="comparison-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Full Plan Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="panel-paper p-3 text-left" style={{ background: "var(--paper)", color: INK }}>
                    <span className="font-display text-sm">Feature</span>
                  </th>
                  {["Free", "Party Pass", "Party+", "Pro Host"].map((plan) => (
                    <th key={plan} className="panel-paper p-3 text-center" style={{ background: "var(--paper)", color: INK }}>
                      <span className="font-display text-sm">{plan}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="panel-paper p-3" style={{ background: "var(--cream)" }}>
                      <span className="font-hand text-lg" style={{ color: "#4a4460" }}>{row.feature}</span>
                    </td>
                    {[row.free, row.partyPass, row.partyPlus, row.proHost].map((val, i) => (
                      <td key={i} className="panel-paper p-3 text-center" style={{ background: "var(--cream)" }}>
                        <span className="font-score text-sm" style={{ color: INK }}>{val}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-16">
          <h2
            id="faq-heading"
            className="font-display mb-6 text-2xl uppercase tracking-wide"
            style={{ color: "var(--cream)" }}
          >
            Pricing Questions
          </h2>
          <PublicFAQ items={PRICING_FAQS} />
        </section>

        {/* CTA */}
        <div className="mb-20 mt-12 text-center">
          <p className="font-display text-2xl uppercase tracking-wide" style={{ color: "var(--cream)" }}>
            Start with the free plan
          </p>
          <p className="font-hand mt-2 text-xl" style={{ color: "var(--muted-foreground)" }}>
            No credit card. All {AVAILABLE_GAMES.length} games. {LIMITS.free.maxPlayers} players. Upgrade whenever you&apos;re ready.
          </p>
          <Link
            href="/signup"
            className="btn-rough mt-6 inline-flex px-10 py-4 text-xl"
            style={{ background: "var(--mustard)", color: INK }}
          >
            Host Free
          </Link>
        </div>
      </div>
    </div>
  );
}
