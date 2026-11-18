import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/cartoon/BackLink";
import { PackArt } from "@/components/store/PackArt";
import { PackCard, PriceTag } from "@/components/store/PackCard";
import { PACK_GAMES, PACK_GAME_LABELS, isNew, itemTotal, onSale, percentOff, loadPacks, type PackGame } from "@/lib/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [pack] = await loadPacks(createAdminClient(), null, slug);
  return pack
    ? { title: `${pack.title} Pack | ScreenParty Store`, description: `${pack.tagline} ${pack.description}` }
    : { title: "Pack not found | ScreenParty Store" };
}

// A peek at what's inside, without spoilers: no trivia answers, and charades
// shows its categories, never the secret words.
function sampleLines(game: PackGame, rows: Record<string, string | number>[]): string[] {
  if (game === "charades") return [`Categories: ${[...new Set(rows.map((r) => r.category))].join(", ")}`];
  const line = (r: Record<string, string | number>) => {
    switch (game) {
      case "buzz_trivia": return String(r.question_text);
      case "wyr": return `${r.option_a}, or ${String(r.option_b).charAt(0).toLowerCase()}${String(r.option_b).slice(1)}?`;
      case "mlt": return `Who's most likely to ${r.text}?`;
      case "hol": return String(r.label);
      case "gtp": return String(r.text);
      case "tank": return `${r.name}: ${r.tagline}`;
      case "num": return `Rate ${String(r.theme).toLowerCase()}, from "${r.scale_low}" to "${r.scale_high}"`;
    }
  };
  return rows.slice(0, 2).map(line);
}

export default async function PackPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const all = await loadPacks(admin, user?.id ?? null);
  const pack = all.find((p) => p.slug === slug);
  if (!pack) notFound();

  const { data: items } = await admin.from("store_pack_items").select("game_type, data").eq("pack_id", pack.id);
  const games = PACK_GAMES.filter((g) => (pack.counts[g] ?? 0) > 0);
  const related = all.filter((p) => p.id !== pack.id && p.tags.some((t) => pack.tags.includes(t))).slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-5 pb-24 pt-6 md:px-8">
      <BackLink href="/store" label="pack store" />

      <section className="panel-paper panel-grain grid overflow-hidden md:grid-cols-[1fr_1fr]">
        <div className="relative border-b-[3px] md:border-b-0 md:border-r-[3px]" style={{ borderColor: "var(--ink)" }}>
          <PackArt art={pack.art} color={pack.color} accent={pack.accent} className="anim-pop h-64 md:h-full md:min-h-96" />
          {onSale(pack) && !pack.owned && (
            <span className="stamp absolute right-4 top-4 text-2xl" style={{ color: "var(--tomato)" }}>
              Sale -{percentOff(pack)}%
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-wrap gap-1.5">
            {isNew(pack) && <span className="chip" style={{ background: "var(--mustard)", color: "var(--ink)" }}>New</span>}
            {pack.tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.75rem)] uppercase leading-[0.92]" style={{ color: "var(--ink)" }}>
            {pack.title}
          </h1>
          <p className="font-hand text-2xl leading-snug" style={{ color: "var(--ink)" }}>{pack.tagline}</p>
          <p className="font-hand text-lg leading-snug" style={{ color: "var(--ink-body)" }}>{pack.description}</p>

          <div className="mt-auto flex flex-col gap-3 border-t-2 border-dashed pt-5" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
            {pack.owned ? (
              <>
                <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>It&apos;s in your library</p>
                <p className="font-hand text-lg" style={{ color: "var(--ink-body)" }}>
                  Choose it when you set up any game: it&apos;s under Themed pack (or Store packs in Fact Frenzy).
                </p>
                <Link href="/dashboard" className="btn-rough self-start px-6 py-2.5 text-xl">Host a game</Link>
              </>
            ) : pack.isDemo ? (
              <>
                <PriceTag pack={pack} size="lg" />
                <button type="button" disabled className="btn-rough self-start px-6 py-2.5 text-xl">Coming soon</button>
                <p className="font-hand text-base" style={{ color: "var(--ink-label)" }}>
                  Demo pack: it shows how the store looks, its content isn&apos;t written yet.
                </p>
              </>
            ) : (
              <>
                <PriceTag pack={pack} size="lg" />
                <Link href={user ? `/store/${pack.slug}/checkout` : `/login?next=/store/${pack.slug}/checkout`} className="btn-rough self-start px-8 py-3 text-2xl">
                  Buy pack
                </Link>
                <p className="font-score text-xs uppercase tracking-[0.14em]" style={{ color: "var(--ink-label)" }}>
                  One-time purchase · {itemTotal(pack)} items · works in {games.length} games
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {games.length > 0 && (
        <section aria-labelledby="inside-heading" className="flex flex-col gap-5">
          <h2 id="inside-heading" className="font-display text-3xl uppercase" style={{ color: "var(--cream)" }}>What&apos;s inside</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((g) => {
              const rows = (items ?? []).filter((i) => i.game_type === g).map((i) => i.data);
              return (
                <li key={g} className="panel-paper flex flex-col gap-2 p-4">
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="font-display text-lg leading-tight" style={{ color: "var(--ink)" }}>{PACK_GAME_LABELS[g].name}</h3>
                    <span className="chip">{pack.counts[g]} {PACK_GAME_LABELS[g].unit}</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {sampleLines(g, rows).map((line) => (
                      <li key={line} className="font-hand rounded-md border-2 border-dashed px-2 py-1 text-base leading-snug" style={{ borderColor: "rgba(34,31,48,0.3)", color: "var(--ink-body)" }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
          <p className="font-hand text-lg" style={{ color: "var(--cream-muted)" }}>
            Two Truths and a Lie doesn&apos;t need a pack: players write their own statements.
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="flex flex-col gap-5">
          <h2 id="related-heading" className="font-display text-3xl uppercase" style={{ color: "var(--cream)" }}>You might also like</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}><PackCard pack={p} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
