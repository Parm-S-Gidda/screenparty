import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BRAND_NAME,
  LIMITS,
  PLAN_LABELS,
  dayPassActive,
  resolveTier,
  tierFromString,
} from "@/lib/constants";
import { SignOutButton } from "@/components/SignOutButton";
import { BillingNotice } from "@/components/BillingNotice";
import { GameCardDeck } from "@/components/GameCardDeck";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const { billing } = await searchParams;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, day_pass_expires_at")
    .eq("id", user.id)
    .single();
  const planTier = resolveTier(profile);
  const hasDayPass = dayPassActive(profile) && tierFromString(profile?.plan_tier) === "free";
  const subscribed = tierFromString(profile?.plan_tier) !== "free";

  const monthStart = new Date();
  const period = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const { data: usage } = await admin
    .from("usage_limits")
    .select("metric, used")
    .eq("user_id", user.id)
    .eq("period_start", period);
  const usedOf = (metric: string) => usage?.find((u) => u.metric === metric)?.used ?? 0;

  const { data: rooms } = await admin
    .from("rooms")
    .select("id, room_code, status, created_at, expires_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const activeRooms = (rooms ?? []).filter(
    (r) =>
      (r.status === "lobby" || r.status === "in_game") &&
      new Date(r.expires_at) > new Date()
  );

  // same day window the room-limit check uses (PRD §24)
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: roomsToday } = await admin
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", user.id)
    .gte("created_at", dayStart.toISOString());

  const limits = LIMITS[planTier];
  const planName = hasDayPass ? "Party Pass" : PLAN_LABELS[planTier];
  const meters = [
    { label: "Virtual Host games", used: usedOf("ai_host_games"), max: limits.aiHostGamesPerMonth, when: "this month" },
    { label: "Rooms opened", used: roomsToday ?? 0, max: limits.maxRoomsPerDay, when: "today" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-5 md:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="font-display text-2xl uppercase leading-none md:text-3xl" aria-label={`${BRAND_NAME} home`}>
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>
        <nav aria-label="Dashboard" className="flex flex-wrap items-center gap-x-6">
          <Link href="/account" className="link-label" style={{ color: "var(--cream)" }}>
            Account
          </Link>
          <Link href="/join" className="link-label" style={{ color: "var(--cream)" }}>
            Join a game
          </Link>
          <SignOutButton />
        </nav>
      </header>

      {billing === "success" && <BillingNotice kind="success" />}
      {billing === "cancelled" && <BillingNotice kind="cancelled" />}

      {/* a live room is the fastest way back into the party, so it leads */}
      {activeRooms.length > 0 && (
        <section aria-labelledby="live-heading" className="mb-12">
          <h2 id="live-heading" className="font-display mb-4 text-2xl uppercase" style={{ color: "var(--cream)" }}>
            {activeRooms.length === 1 ? "Your room is live" : "Your live rooms"}
          </h2>
          <ul className="flex flex-col gap-4">
            {activeRooms.map((room, i) => (
              <li key={room.id} className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-5">
                  <div className="flex flex-col">
                    <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
                      Room code
                    </span>
                    <span className="font-display text-4xl leading-none tracking-[0.15em]" style={{ color: "var(--ink)" }}>
                      {room.room_code}
                    </span>
                  </div>
                  <span className="chip">
                    <span
                      aria-hidden
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: room.status === "lobby" ? "var(--leaf)" : "var(--tomato)" }}
                    />
                    {room.status === "lobby" ? "In the lobby" : "Game on"}
                  </span>
                </div>
                <Link
                  href={`/screen/${room.room_code}`}
                  className="btn-rough px-6 py-2.5 text-lg"
                  style={i === 0 ? undefined : { background: "var(--ink)", color: "var(--cream)" }}
                >
                  Open big screen
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] uppercase leading-[0.95]" style={{ color: "var(--cream)" }}>
          What are we <span style={{ color: "var(--mustard)" }}>playing?</span>
        </h1>
        <p className="font-hand text-xl" style={{ color: "var(--cream-muted)" }}>
          Pick a game to set up a room. You&apos;ll get a code for everyone to join.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <section aria-label="Games">
          <GameCardDeck />
        </section>

        <aside aria-label="Your plan" className="flex flex-col gap-6 lg:sticky lg:top-6 lg:h-fit">
          <div className="panel-paper panel-grain flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
                  Your plan
                </p>
                <p className="font-display text-2xl leading-tight" style={{ color: "var(--ink)" }}>
                  {planName}
                </p>
                {hasDayPass && profile?.day_pass_expires_at && (
                  <p className="font-hand text-base" style={{ color: "var(--ink-label)" }}>
                    Ends {new Date(profile.day_pass_expires_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>

            <dl className="flex flex-col gap-4">
              {meters.map((m) => {
                const pct = m.max > 0 ? Math.min(100, Math.round((m.used / m.max) * 100)) : 0;
                const full = m.used >= m.max;
                return (
                  <div key={m.label} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="font-hand text-lg leading-tight" style={{ color: "var(--ink-body)" }}>
                        {m.label} <span style={{ color: "var(--ink-label)" }}>{m.when}</span>
                      </dt>
                      <dd className="font-score whitespace-nowrap text-base tabular-nums" style={{ color: full ? "var(--error-red)" : "var(--ink)" }}>
                        {m.used} / {m.max}
                      </dd>
                    </div>
                    <div aria-hidden className="h-3 overflow-hidden rounded-full border-2" style={{ borderColor: "var(--ink)", background: "var(--card-white)" }}>
                      <div className="h-full" style={{ width: `${pct}%`, background: full ? "var(--tomato)" : "var(--teal)" }} />
                    </div>
                  </div>
                );
              })}
            </dl>


            <Link
              href="/account"
              className="font-score text-center text-sm uppercase tracking-[0.12em] underline decoration-2 underline-offset-4"
              style={{ color: "var(--ink)" }}
            >
              {subscribed || hasDayPass ? "Manage plan" : "Need a bigger room? Upgrade"}
            </Link>
          </div>

        </aside>
      </div>
    </main>
  );
}
