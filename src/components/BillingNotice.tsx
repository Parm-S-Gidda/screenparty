"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Post-checkout banner. Strips ?billing=… from the URL so a refresh doesn't
// resurrect it, polls the server component for the updated plan tier, and
// dismisses once the page has refreshed with the new state.
export function BillingNotice({ kind }: { kind: "success" | "cancelled" }) {
  const [show, setShow] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("billing");
    url.searchParams.delete("session_id");
    window.history.replaceState(null, "", url.toString());

    if (kind !== "success") {
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }

    // Stripe webhooks typically arrive within 1-3 seconds of the redirect.
    // Poll router.refresh() a few times so the server component re-reads the
    // DB and the updated plan tier shows up without a manual page reload.
    let attempt = 0;
    const intervals = [2000, 3000, 5000]; // cumulative: 2s, 5s, 10s after landing

    const scheduleNext = () => {
      if (attempt >= intervals.length) {
        setShow(false);
        return;
      }
      setTimeout(() => {
        router.refresh();
        attempt++;
        scheduleNext();
      }, intervals[attempt]);
    };

    scheduleNext();

    const dismiss = setTimeout(() => setShow(false), 12000);
    return () => clearTimeout(dismiss);
  }, [kind, router]);

  if (!show) return null;

  return kind === "success" ? (
    <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-400">
      Payment received — activating your Party Pass...
    </div>
  ) : (
    <div className="mb-4 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
      Checkout cancelled, no changes made.
    </div>
  );
}
