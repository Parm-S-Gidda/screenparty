"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PackArt } from "./PackArt";
import { PackCard, PriceTag } from "./PackCard";
import { RevealItem, RevealList } from "@/components/public/Reveal";
import { PACK_GAME_LABELS, isNew, onSale, priceOf, type PackGame, type StorePack } from "@/lib/store";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;

type Filter = "all" | "sale" | "new" | "owned" | `tag:${string}`;
type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function StoreClient({ packs, signedIn }: { packs: StorePack[]; signedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const featured = packs.filter((p) => p.featured);
  const tags = useMemo(() => [...new Set(packs.flatMap((p) => p.tags))].sort(), [packs]);
  const browsing = !query.trim() && filter === "all" && sort === "featured";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = packs.filter((p) => {
      if (q && ![p.title, p.tagline, ...p.tags].some((s) => s.toLowerCase().includes(q))) return false;
      if (filter === "sale") return onSale(p);
      if (filter === "new") return isNew(p);
      if (filter === "owned") return p.owned;
      if (filter.startsWith("tag:")) return p.tags.includes(filter.slice(4));
      return true;
    });
    const by: Record<Sort, (a: StorePack, b: StorePack) => number> = {
      // featured first, then real (playable) packs, then newest
      featured: (a, b) => Number(b.featured) - Number(a.featured) || Number(a.isDemo) - Number(b.isDemo) || b.releasedAt.localeCompare(a.releasedAt),
      newest: (a, b) => b.releasedAt.localeCompare(a.releasedAt),
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
    };
    return [...list].sort(by[sort]);
  }, [packs, query, filter, sort]);

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: "All packs" },
    { value: "sale", label: "On sale" },
    { value: "new", label: "New" },
    ...(signedIn ? [{ value: "owned" as Filter, label: "Owned" }] : []),
    ...tags.map((t) => ({ value: `tag:${t}` as Filter, label: t })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 pb-24 pt-8 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,7vw,4rem)] uppercase leading-[0.9]" style={{ color: "var(--cream)" }}>
            Pack <span style={{ color: "var(--mustard)" }}>Store</span>
          </h1>
          <p className="font-hand mt-2 max-w-[46ch] text-xl leading-snug" style={{ color: "var(--cream-muted)" }}>
            One pack, every game. Buy Halloween once and it brings spooky trivia, would-you-rathers, charades and more to all of them.
          </p>
        </div>
        {signedIn && (
          <Link href="/store/library" className="btn-rough px-5 py-2.5 text-lg" style={{ background: "var(--teal)" }}>
            My packs
          </Link>
        )}
      </header>

      {featured.length > 0 && <FeaturedCarousel packs={featured} />}

      <section aria-label="Find a pack" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search packs</span>
            <svg viewBox="0 0 24 24" aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round">
              <circle cx="10" cy="10" r="6.5" />
              <path d="M15 15l5.5 5.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packs, like spooky or sports"
              className="font-hand h-13 w-full rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] py-2.5 pl-11 pr-3 text-xl text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/40"
              style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.4)" }}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-score text-xs uppercase tracking-[0.16em]" style={{ color: "var(--cream-muted)" }}>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="font-score h-12 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--cream)] px-3 text-sm uppercase tracking-[0.08em] text-[var(--ink)]"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div role="radiogroup" aria-label="Filter packs" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {chips.map((c) => {
            const on = filter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(c.value)}
                className="font-score shrink-0 rounded-full border-[3px] px-4 py-1.5 text-sm uppercase tracking-[0.1em] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
                style={{
                  borderColor: "var(--ink)",
                  background: on ? "var(--mustard)" : "var(--cream)",
                  color: "var(--ink)",
                  boxShadow: on ? "none" : "2px 2px 0 rgba(0,0,0,0.4)",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {browsing ? (
        <>
          <PackRow title="On sale now" note="Deals end soon" packs={packs.filter((p) => onSale(p))} />
          <PackRow title="New this month" packs={packs.filter((p) => isNew(p))} />
          <section aria-labelledby="all-heading" className="flex flex-col gap-5">
            <h2 id="all-heading" className="font-display text-3xl uppercase" style={{ color: "var(--cream)" }}>Every pack</h2>
            <PackGrid packs={results} />
          </section>
        </>
      ) : (
        <section aria-live="polite" className="flex flex-col gap-5">
          <p className="font-score text-sm uppercase tracking-[0.16em]" style={{ color: "var(--cream-muted)" }}>
            {results.length} {results.length === 1 ? "pack" : "packs"}
          </p>
          {results.length > 0 ? (
            <PackGrid packs={results} />
          ) : (
            <div className="panel-paper flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>No packs match that</p>
              <button
                type="button"
                onClick={() => { setQuery(""); setFilter("all"); setSort("featured"); }}
                className="link-label"
                style={{ color: "var(--ink)" }}
              >
                Show every pack
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PackGrid({ packs }: { packs: StorePack[] }) {
  return (
    <motion.ul layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {packs.map((p, i) => (
          <motion.li
            key={p.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING, delay: Math.min(i, 6) * 0.06 } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
          >
            <PackCard pack={p} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

/** A titled, sideways-scrolling shelf of packs. */
function PackRow({ title, note, packs }: { title: string; note?: string; packs: StorePack[] }) {
  if (packs.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-3xl uppercase" style={{ color: "var(--cream)" }}>{title}</h2>
        {note && <span className="font-hand text-lg" style={{ color: "var(--coral)" }}>{note}</span>}
      </div>
      <RevealList as="ul" className="-mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-4 pt-1 md:-mx-8 md:px-8">
        {packs.map((p) => (
          <RevealItem key={p.id} className="w-64 shrink-0 snap-start">
            <PackCard pack={p} />
          </RevealItem>
        ))}
      </RevealList>
    </section>
  );
}

/** The store's focal moment: featured packs on a rotating marquee. */
function FeaturedCarousel({ packs }: { packs: StorePack[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const pack = packs[i % packs.length];

  useEffect(() => {
    if (paused || reduce || packs.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % packs.length), 6000);
    return () => clearInterval(id);
  }, [paused, reduce, packs.length]);

  const games = Object.keys(pack.counts) as PackGame[];
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured packs"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="panel-paper panel-grain relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pack.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: reduce ? { duration: 0.15 } : SPRING }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40, transition: { duration: 0.18 } }}
            className="grid md:grid-cols-[1.1fr_1fr]"
          >
            <Link href={`/store/${pack.slug}`} aria-hidden tabIndex={-1} className="border-b-[3px] md:border-b-0 md:border-r-[3px]" style={{ borderColor: "var(--ink)" }}>
              <motion.div initial={reduce ? false : { scale: 1.08, rotate: -1 }} animate={{ scale: 1, rotate: 0, transition: { type: "spring", stiffness: 600, damping: 18 } }}>
                <PackArt art={pack.art} color={pack.color} accent={pack.accent} className="h-56 md:h-80" />
              </motion.div>
            </Link>
            <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
              <span className="chip self-start" style={{ background: "var(--tomato)", color: "var(--cream)" }}>Featured</span>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.95]" style={{ color: "var(--ink)" }}>{pack.title}</h2>
              <p className="font-hand text-xl leading-snug" style={{ color: "var(--ink-body)" }}>{pack.tagline}</p>
              {games.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Works in">
                  {games.map((g) => (
                    <li key={g} className="font-score rounded border-2 px-2 py-0.5 text-xs uppercase tracking-[0.08em]" style={{ borderColor: "var(--ink)", color: "var(--ink)" }}>
                      {PACK_GAME_LABELS[g].name}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <Link href={`/store/${pack.slug}`} className="btn-rough px-6 py-2.5 text-xl">
                  {pack.owned ? "You own this" : "See the pack"}
                </Link>
                {!pack.owned && <PriceTag pack={pack} size="lg" />}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {packs.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <ArrowButton dir={-1} onClick={() => setI((n) => (n - 1 + packs.length) % packs.length)} />
          {packs.map((p, n) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Show ${p.title}`}
              aria-current={n === i % packs.length}
              onClick={() => setI(n)}
              className={cn("h-3 rounded-full border-2 transition-all duration-200", n === i % packs.length ? "w-8" : "w-3")}
              style={{ borderColor: "var(--ink)", background: n === i % packs.length ? "var(--mustard)" : "var(--cream)" }}
            />
          ))}
          <ArrowButton dir={1} onClick={() => setI((n) => (n + 1) % packs.length)} />
        </div>
      )}
    </section>
  );
}

function ArrowButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 1 ? "Next featured pack" : "Previous featured pack"}
      className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] transition-transform duration-150 hover:-translate-y-0.5"
      style={{ borderColor: "var(--ink)", background: "var(--cream)", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="var(--ink)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
