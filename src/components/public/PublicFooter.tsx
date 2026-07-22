import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

const GAMES_LINKS = [
  { label: "Fact Frenzy", href: "/games/fact-frenzy" },
  { label: "Two Truths & a Lie", href: "/games/two-truths-and-a-lie" },
  { label: "Would You Rather", href: "/games/would-you-rather" },
  { label: "Most Likely To", href: "/games/most-likely-to" },
  { label: "Higher or Lower", href: "/games/higher-or-lower" },
  { label: "Guess the Player", href: "/games/guess-the-player" },
  { label: "Shark Tank", href: "/games/shark-tank" },
  { label: "Charades", href: "/games/charades" },
  { label: "Number Rating", href: "/games/number-rating" },
];

const PRODUCT_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Virtual Host", href: "/virtual-host" },
  { label: "Pricing", href: "/pricing" },
  { label: "Help", href: "/help" },
];

const OCCASIONS_LINKS = [
  { label: "House Parties", href: "/occasions/house-parties" },
  { label: "Birthdays", href: "/occasions/birthday-parties" },
  { label: "Family Game Night", href: "/occasions/family-game-night" },
  { label: "Team Building", href: "/occasions/team-building" },
  { label: "Office Parties", href: "/occasions/office-parties" },
  { label: "University Events", href: "/occasions/university-events" },
  { label: "Virtual Parties", href: "/occasions/virtual-parties" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function PublicFooter() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: "rgba(245,236,212,0.12)", background: "rgba(25,22,36,0.6)" }}
    >
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="font-display text-2xl uppercase leading-none tracking-wide">
              <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
              <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
            </Link>
            <p className="font-hand text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
              Browser party games for the big screen, controlled from everyone&apos;s phones.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="btn-rough inline-flex items-center justify-center px-5 py-2 text-sm"
                style={{ background: "var(--mustard)", color: "#221f30" }}
              >
                Host Free
              </Link>
              <Link
                href="/join"
                className="font-score inline-flex items-center justify-center rounded-md border-2 border-current px-5 py-2 text-xs uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
                style={{ color: "var(--cream)" }}
              >
                Join a Game
              </Link>
            </div>
          </div>

          {/* Games */}
          <div>
            <h3
              className="font-score mb-3 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--mustard)" }}
            >
              Games
            </h3>
            <ul className="flex flex-col gap-2">
              {GAMES_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-hand text-lg opacity-70 transition hover:opacity-100"
                    style={{ color: "var(--cream)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3
              className="font-score mb-3 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--mustard)" }}
            >
              Product
            </h3>
            <ul className="flex flex-col gap-2">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-hand text-lg opacity-70 transition hover:opacity-100"
                    style={{ color: "var(--cream)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3
              className="font-score mb-3 mt-6 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--mustard)" }}
            >
              Occasions
            </h3>
            <ul className="flex flex-col gap-2">
              {OCCASIONS_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-hand text-lg opacity-70 transition hover:opacity-100"
                    style={{ color: "var(--cream)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account + Legal */}
          <div>
            <h3
              className="font-score mb-3 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--mustard)" }}
            >
              Account
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/login"
                  className="font-hand text-lg opacity-70 transition hover:opacity-100"
                  style={{ color: "var(--cream)" }}
                >
                  Log In
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="font-hand text-lg opacity-70 transition hover:opacity-100"
                  style={{ color: "var(--cream)" }}
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="font-hand text-lg opacity-70 transition hover:opacity-100"
                  style={{ color: "var(--cream)" }}
                >
                  Dashboard
                </Link>
              </li>
            </ul>

            <h3
              className="font-score mb-3 mt-6 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: "var(--mustard)" }}
            >
              Legal
            </h3>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-hand text-lg opacity-70 transition hover:opacity-100"
                    style={{ color: "var(--cream)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col items-center gap-2 border-t pt-8 text-center"
          style={{ borderColor: "rgba(245,236,212,0.12)" }}
        >
          <p className="font-hand text-xl" style={{ color: "var(--muted-foreground)" }}>
            {BRAND_NAME}, bring the game show home.
          </p>
          <p
            className="font-score text-[10px] uppercase tracking-[0.25em]"
            style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
          >
            No app · No console · Just browsers
          </p>
        </div>
      </div>
    </footer>
  );
}
