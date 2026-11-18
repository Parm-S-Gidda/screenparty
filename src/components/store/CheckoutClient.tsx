"use client";

// Store checkout funnel: review the order, pay, done. Payment is a test step
// for now (no card taken); when Stripe lands, "Pay" redirects to a Stripe
// Checkout Session and the webhook records the purchase instead.

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackArt } from "./PackArt";
import { Confetti } from "@/components/game/Confetti";
import { PACK_GAME_LABELS, formatPrice, itemTotal, onSale, priceOf, type PackGame, type StorePack } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEPS = ["Review", "Payment", "Done"] as const;
const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;

export function CheckoutClient({ pack, email, testMode }: { pack: StorePack; email: string; testMode: boolean }) {
  const [step, setStepRaw] = useState(0);
  const setStep = (n: number) => {
    setStepRaw(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = priceOf(pack);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: pack.slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 pb-24 pt-6 md:px-8">
      {step < 2 && (
        <Link href={`/store/${pack.slug}`} className="link-label self-start" style={{ color: "var(--cream)" }}>
          ← Back to {pack.title}
        </Link>
      )}

      <ol aria-label="Checkout steps" className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
            <span
              className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] text-lg"
              style={{
                borderColor: "var(--ink)",
                background: i < step ? "var(--teal)" : i === step ? "var(--mustard)" : "var(--cream)",
                color: "var(--ink)",
              }}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className="font-score text-sm uppercase tracking-[0.14em]" style={{ color: i <= step ? "var(--cream)" : "var(--cream-muted)" }}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="h-[3px] flex-1 rounded-full" style={{ background: i < step ? "var(--teal)" : "rgba(245,236,212,0.25)" }} />}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0, transition: SPRING }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
            className={cn("panel-paper panel-grain relative flex flex-col gap-5 p-6 md:p-8", step === 2 && "md:col-span-2")}
          >
            {step === 0 && (
              <>
                <h1 className="font-display text-3xl uppercase" style={{ color: "var(--ink)" }}>Review your pack</h1>
                <div className="flex gap-4">
                  <PackArt art={pack.art} color={pack.color} accent={pack.accent} className="h-24 w-24 shrink-0 rounded-xl border-[3px] border-[var(--ink)]" />
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-2xl leading-tight" style={{ color: "var(--ink)" }}>{pack.title}</p>
                    <p className="font-hand text-lg leading-snug" style={{ color: "var(--ink-body)" }}>{pack.tagline}</p>
                  </div>
                </div>
                <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {(Object.keys(pack.counts) as PackGame[]).map((g) => (
                    <li key={g} className="font-hand flex justify-between gap-2 border-b-2 border-dashed py-1 text-lg" style={{ borderColor: "rgba(34,31,48,0.2)", color: "var(--ink)" }}>
                      <span>{PACK_GAME_LABELS[g].name}</span>
                      <span className="font-score text-sm" style={{ color: "var(--ink-label)" }}>{pack.counts[g]} {PACK_GAME_LABELS[g].unit}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setStep(1)} className="btn-rough self-start px-8 py-3 text-xl">
                  Continue to payment
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-display text-3xl uppercase" style={{ color: "var(--ink)" }}>Payment</h1>
                {testMode && (
                  <p className="font-hand rounded-lg border-[3px] border-dashed px-3 py-2 text-lg leading-snug" style={{ borderColor: "var(--ink)", color: "var(--ink)", background: "var(--paper)" }}>
                    Test mode: no card is charged. Secure Stripe checkout goes here.
                  </p>
                )}
                <label className="flex flex-col gap-1">
                  <span className="font-score text-xs uppercase tracking-[0.14em]" style={{ color: "var(--ink-label)" }}>Receipt email</span>
                  <input readOnly value={email} className="font-hand h-12 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-lg text-[var(--ink)]" />
                </label>
                <fieldset disabled className="flex flex-col gap-3 opacity-60">
                  <legend className="font-score mb-1 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--ink-label)" }}>Card</legend>
                  <input placeholder="Card number" className="font-hand h-12 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="MM / YY" className="font-hand h-12 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-lg" />
                    <input placeholder="CVC" className="font-hand h-12 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-lg" />
                  </div>
                </fieldset>
                {error && (
                  <p role="alert" className="font-hand text-lg" style={{ color: "var(--error-red)" }}>{error}</p>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={pay} disabled={busy} className="btn-rough px-8 py-3 text-xl">
                    {busy ? "Processing…" : testMode ? `Complete test purchase · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`}
                  </button>
                  <button type="button" onClick={() => setStep(0)} className="link-label" style={{ color: "var(--ink)" }}>Back</button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <Confetti count={60} />
                <PackArt art={pack.art} color={pack.color} accent={pack.accent} className="anim-pop h-40 w-40 rounded-2xl border-[4px] border-[var(--ink)]" />
                <span className="stamp text-4xl" style={{ color: "var(--teal)" }}>It&apos;s yours!</span>
                <h1 className="font-display text-3xl uppercase" style={{ color: "var(--ink)" }}>{pack.title} is in your library</h1>
                <p className="font-hand max-w-md text-xl leading-snug" style={{ color: "var(--ink-body)" }}>
                  Choose it when you set up any game, under Themed pack (or Store packs in Fact Frenzy).
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/dashboard" className="btn-rough px-6 py-2.5 text-xl">Host a game</Link>
                  <Link href="/store/library" className="btn-rough px-6 py-2.5 text-xl" style={{ background: "var(--teal)" }}>My packs</Link>
                </div>
                <Link href="/store" className="link-label" style={{ color: "var(--ink)" }}>Keep shopping</Link>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        {step < 2 && (
          <aside aria-label="Order summary" className="panel-paper flex h-fit flex-col gap-3 p-5">
            <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Order summary</h2>
            <Row label={pack.title} value={formatPrice(pack.priceCents)} />
            {onSale(pack) && <Row label="Sale" value={`-${formatPrice(pack.priceCents - total)}`} accent />}
            <Row label="Items" value={String(itemTotal(pack))} />
            <div className="flex items-baseline justify-between border-t-[3px] pt-3" style={{ borderColor: "var(--ink)" }}>
              <span className="font-display text-xl" style={{ color: "var(--ink)" }}>Total</span>
              <span className="font-display text-3xl" style={{ color: "var(--ink)" }}>{formatPrice(total)}</span>
            </div>
            <p className="font-hand text-base leading-snug" style={{ color: "var(--ink-label)" }}>
              One-time purchase. Yours to use in every game, forever.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="font-hand flex items-baseline justify-between gap-3 text-lg" style={{ color: accent ? "var(--error-red)" : "var(--ink)" }}>
      <span className="truncate">{label}</span>
      <span className="font-score text-base">{value}</span>
    </div>
  );
}
