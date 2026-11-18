import Link from "next/link";
import { PackArt } from "./PackArt";
import { formatPrice, isNew, onSale, percentOff, priceOf, type StorePack } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Price with the original struck through when on sale. */
export function PriceTag({ pack, size = "md" }: { pack: StorePack; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="flex items-baseline gap-2">
      {onSale(pack) && (
        <span className={cn("font-score line-through", big ? "text-lg" : "text-sm")} style={{ color: "var(--ink-label)" }}>
          {formatPrice(pack.priceCents)}
        </span>
      )}
      <span className={cn("font-display leading-none", big ? "text-4xl" : "text-2xl")} style={{ color: onSale(pack) ? "var(--error-red)" : "var(--ink)" }}>
        {formatPrice(priceOf(pack))}
      </span>
    </span>
  );
}

/** Store grid card: the whole card is one link to the pack page. */
export function PackCard({ pack, className }: { pack: StorePack; className?: string }) {
  const games = Object.keys(pack.counts).length;
  return (
    <Link href={`/store/${pack.slug}`} className={cn("game-card panel-paper panel-grain group relative flex h-full flex-col overflow-hidden", className)}>
      <div className="relative border-b-[3px]" style={{ borderColor: "var(--ink)" }}>
        <PackArt art={pack.art} color={pack.color} accent={pack.accent} className="h-40" motifClassName="game-card-art" />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {isNew(pack) && <span className="chip" style={{ background: "var(--mustard)", color: "var(--ink)" }}>New</span>}
          {pack.owned && <span className="chip" style={{ background: "var(--teal)", color: "var(--ink)" }}>Owned</span>}
        </div>
        {onSale(pack) && !pack.owned && (
          <span
            className="font-display absolute -right-1 top-2 rotate-6 rounded-md border-[3px] px-2 py-0.5 text-lg leading-none"
            style={{ borderColor: "var(--ink)", background: "var(--tomato)", color: "var(--cream)", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
          >
            -{percentOff(pack)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-xl leading-tight" style={{ color: "var(--ink)" }}>{pack.title}</h3>
        <p className="font-hand flex-1 text-pretty text-lg leading-snug" style={{ color: "var(--ink-body)" }}>{pack.tagline}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="font-score text-xs uppercase tracking-[0.12em]" style={{ color: "var(--ink-label)" }}>
            {games > 0 ? `Works in ${games} games` : "Every game"}
          </span>
          {pack.owned ? (
            <span className="font-score text-sm uppercase tracking-[0.1em]" style={{ color: "var(--ink)" }}>In your library</span>
          ) : (
            <PriceTag pack={pack} />
          )}
        </div>
      </div>
    </Link>
  );
}
