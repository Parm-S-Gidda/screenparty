import type { Metadata } from "next";
import { BRAND_NAME, LIMITS, AI_HOST_FREE_BETA } from "@/lib/constants";
import { AVAILABLE_GAMES } from "@/lib/games";
import { PricingSection } from "@/components/public/PricingSection";
import { PublicFAQ } from "@/components/public/PublicFAQ";
import { ClosingCta, PageHeader, SectionHeading } from "@/components/public/PageParts";

export const metadata: Metadata = {
  title: `Pricing | ${BRAND_NAME}`,
  description: `Start free with ${LIMITS.free.maxPlayers} players and all ${AVAILABLE_GAMES.length} games. Upgrade for larger groups and more Virtual Host sessions. Party Pass: $5.99 for 24 hours. No subscription needed for one night.`,
  openGraph: {
    title: `Pricing | ${BRAND_NAME}`,
    description: `Start free. ${LIMITS.free.maxPlayers} players, all games, no credit card. Upgrade for larger groups.`,
  },
};

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

const PLAN_NAMES = ["Free", "Party Pass", "Party+", "Pro Host"];

const FEATURE_ROWS: { feature: string; values: string[] }[] = [
  {
    feature: "Players per room",
    values: [LIMITS.free.maxPlayers, LIMITS.party_plus.maxPlayers, LIMITS.party_plus.maxPlayers, LIMITS.pro_host.maxPlayers].map(String),
  },
  { feature: "Games included", values: PLAN_NAMES.map(() => `All ${AVAILABLE_GAMES.length}`) },
  {
    feature: "Room length",
    values: [LIMITS.free.roomTtlHours, LIMITS.party_plus.roomTtlHours, LIMITS.party_plus.roomTtlHours, LIMITS.pro_host.roomTtlHours].map((h) => `${h} h`),
  },
  {
    feature: "Questions per game",
    values: [LIMITS.free.maxQuestions, LIMITS.party_plus.maxQuestions, LIMITS.party_plus.maxQuestions, LIMITS.pro_host.maxQuestions].map(String),
  },
  {
    feature: "Rooms per day",
    values: [LIMITS.free.maxRoomsPerDay, LIMITS.party_plus.maxRoomsPerDay, LIMITS.party_plus.maxRoomsPerDay, LIMITS.pro_host.maxRoomsPerDay].map(String),
  },
  {
    feature: "Virtual Host games a month",
    values: [
      `${LIMITS.free.aiHostGamesPerMonth}${AI_HOST_FREE_BETA ? " (beta)" : ""}`,
      String(LIMITS.party_plus.aiHostGamesPerMonth),
      String(LIMITS.party_plus.aiHostGamesPerMonth),
      String(LIMITS.pro_host.aiHostGamesPerMonth),
    ],
  },
  { feature: "Billing", values: ["None", "Once", "Monthly", "Monthly"] },
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
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Pricing", href: "/pricing" },
        ]}
        title={
          <>
            Free game nights, <span style={{ color: "var(--mustard)" }}>bigger ones</span> when you want
          </>
        }
        sub={`Every plan has all ${AVAILABLE_GAMES.length} games. Free covers ${LIMITS.free.maxPlayers} players. Pay only when the room gets bigger, for one night or every night.`}
      />

      <section aria-label="Plans" className="mx-auto -mt-6 w-full max-w-6xl px-6 pb-16 md:pb-24">
        <PricingSection />
      </section>

      {/* curtain band: the full numbers, one table */}
      <section aria-labelledby="comparison-heading" className="band-curtain px-6 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading id="comparison-heading" sub="Party Pass and Party+ have the same limits. The pass lasts 24 hours and never renews.">
            Every plan, side by side
          </SectionHeading>
          <div className="panel panel-grain overflow-x-auto p-2 md:p-4">
            <table className="paper-table min-w-[36rem]">
              <caption className="sr-only">Plan limits compared</caption>
              <thead>
                <tr>
                  <th scope="col" className="font-score text-left text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
                    Limit
                  </th>
                  {PLAN_NAMES.map((plan) => (
                    <th key={plan} scope="col" className="font-display text-center text-lg font-normal">
                      {plan}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="font-hand text-left text-lg font-normal" style={{ color: "var(--ink-body)" }}>
                      {row.feature}
                    </th>
                    {row.values.map((val, i) => (
                      <td key={i} className="text-center text-base">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
        <SectionHeading id="faq-heading">Pricing questions</SectionHeading>
        <PublicFAQ items={PRICING_FAQS} />
      </section>

      <ClosingCta
        title="Start with the free plan"
        body={`No credit card. All ${AVAILABLE_GAMES.length} games, up to ${LIMITS.free.maxPlayers} players. Upgrade whenever the party grows.`}
        cta={{ href: "/signup", label: "Host a free game" }}
        link={{ href: "/games", label: "Browse the games" }}
      />
    </div>
  );
}
