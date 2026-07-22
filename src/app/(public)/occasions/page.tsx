import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { OCCASIONS } from "@/lib/occasions";
import { TapedLabel } from "@/components/cartoon/Panel";
import { SpotRays } from "@/components/cartoon/Doodles";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: `Party Games for Every Occasion | ${BRAND_NAME}`,
  description:
    "House parties, birthdays, family game nights, team building, office parties, university events, and virtual parties. Find the right games and run-of-show for your gathering.",
  openGraph: {
    title: `Party Games for Every Occasion | ${BRAND_NAME}`,
    description:
      "Find the right ScreenParty games for your gathering. Curated run-of-show guides for every occasion.",
  },
};

const INK = "#221f30";

const EMOJIS: Record<string, string> = {
  "house-parties": "🏠",
  "birthday-parties": "🎂",
  "family-game-night": "👨‍👩‍👧‍👦",
  "team-building": "🤝",
  "office-parties": "🏢",
  "university-events": "🎓",
  "virtual-parties": "💻",
};

export default function OccasionsPage() {
  return (
    <div className="relative overflow-hidden">
      <SpotRays className="absolute left-0 top-0 h-96 w-[50vw] opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-12">
        <Breadcrumbs
          items={[
            { label: BRAND_NAME, href: "/" },
            { label: "Occasions", href: "/occasions" },
          ]}
        />

        <TapedLabel tilt={-1} color="var(--paper)">
          <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
            every kind of gathering
          </span>
        </TapedLabel>
        <h1
          className="font-display mt-3 text-4xl uppercase tracking-wide md:text-5xl"
          style={{ color: "var(--cream)" }}
        >
          A Game Night for Every Occasion
        </h1>
        <p className="font-hand mt-4 max-w-xl text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
          Every gathering is different. Each guide below recommends the right games, suggests a
          run of show, and gives you a setup that works for that specific kind of event.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {OCCASIONS.map((occasion) => (
            <Link
              key={occasion.slug}
              href={`/occasions/${occasion.slug}`}
              className="panel-paper panel-grain flex flex-col gap-3 p-6 transition-opacity hover:opacity-80"
              style={{ background: "var(--cream)" }}
            >
              <span className="text-4xl" aria-hidden>{EMOJIS[occasion.slug] ?? "🎉"}</span>
              <h2 className="font-display text-xl leading-tight" style={{ color: INK }}>
                {occasion.name}
              </h2>
              <p className="font-hand flex-1 text-lg leading-snug" style={{ color: "#4a4460" }}>
                {occasion.tagline}
              </p>
              <div className="flex flex-wrap gap-1">
                {occasion.recommendedGameSlugs.slice(0, 3).map((slug) => (
                  <span
                    key={slug}
                    className="font-score rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
                    style={{ background: INK, color: "var(--cream)" }}
                  >
                    {slug.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
              <span className="font-score text-[10px] uppercase tracking-[0.25em]" style={{ color: INK }}>
                See the guide →
              </span>
            </Link>
          ))}
        </div>

        <div className="mb-20 mt-12 text-center">
          <p className="font-hand text-xl" style={{ color: "var(--muted-foreground)" }}>
            Not sure which games to start with?{" "}
            <Link href="/games" className="underline" style={{ color: "var(--cream)" }}>
              Browse all nine games
            </Link>{" "}
            or{" "}
            <Link href="/how-it-works" className="underline" style={{ color: "var(--cream)" }}>
              see how ScreenParty works.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
