"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Games", href: "/games" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Virtual Host", href: "/virtual-host" },
  { label: "Occasions", href: "/occasions" },
  { label: "Pricing", href: "/pricing" },
];

const INK = "#221f30";

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="relative z-40 w-full border-b"
      style={{ borderColor: "rgba(245,236,212,0.12)", background: "rgba(25,22,36,0.9)", backdropFilter: "blur(8px)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="font-display flex items-center gap-1 text-2xl uppercase leading-none tracking-wide">
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="font-score text-xs uppercase tracking-[0.2em] transition-opacity"
                style={{ color: active ? "var(--mustard)" : "var(--cream)", opacity: active ? 1 : 0.75 }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/join"
            className="font-score rounded-md border-2 border-current px-4 py-1.5 text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
            style={{ color: "var(--cream)" }}
          >
            Join a Game
          </Link>
          <Link
            href="/signup"
            className="btn-rough font-score px-4 py-1.5 text-xs uppercase tracking-[0.2em]"
            style={{ background: "var(--mustard)", color: INK }}
          >
            Host Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className="block h-0.5 w-6 rounded-full transition-all"
            style={{
              background: "var(--cream)",
              transform: open ? "translateY(8px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block h-0.5 w-6 rounded-full transition-all"
            style={{ background: "var(--cream)", opacity: open ? 0 : 1 }}
          />
          <span
            className="block h-0.5 w-6 rounded-full transition-all"
            style={{
              background: "var(--cream)",
              transform: open ? "translateY(-8px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="border-t md:hidden"
          style={{ borderColor: "rgba(245,236,212,0.12)", background: "rgba(25,22,36,0.97)" }}
        >
          <div className="flex flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="font-score py-2 text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--cream)" }}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "rgba(245,236,212,0.12)" }}>
              <Link
                href="/join"
                onClick={() => setOpen(false)}
                className="font-score rounded-md border-2 border-current px-4 py-2 text-center text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--cream)" }}
              >
                Join a Game
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn-rough font-score px-4 py-2 text-center text-xs uppercase tracking-[0.2em]"
                style={{ background: "var(--mustard)", color: INK }}
              >
                Host Free
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
