import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="font-display text-3xl uppercase tracking-wide">
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/join"
            className="btn-rough px-4 py-1.5 text-base"
            style={{ background: "var(--coral)", color: "#221f30" }}
          >
            Join a game
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </div>

      {billing === "success" && <BillingNotice kind="success" />}
      {billing === "cancelled" && <BillingNotice kind="cancelled" />}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Your plan
              <Badge variant={planTier === "free" ? "secondary" : "default"}>
                {hasDayPass ? "Party Pass" : PLAN_LABELS[planTier]}
              </Badge>
              {hasDayPass && profile?.day_pass_expires_at && (
                <span className="text-xs font-normal leading-none text-card-foreground/60">
                  Active until {new Date(profile.day_pass_expires_at).toLocaleString()}
                </span>
              )}
            </CardTitle>
            <Button asChild size="sm" variant={subscribed || hasDayPass ? "outline" : "default"}>
              <Link href="/account">Manage account</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <UsageStat
              label="Virtual Host games this month"
              value={usedOf("ai_host_games")}
              cap={LIMITS[planTier].aiHostGamesPerMonth}
            />
            <UsageStat
              label="Rooms today"
              value={roomsToday ?? 0}
              cap={LIMITS[planTier].maxRoomsPerDay}
            />
            <UsageStat label="Active rooms" value={activeRooms.length} />
          </div>
          <p className="mt-3 text-sm text-card-foreground/75">
            Your plan hosts up to {LIMITS[planTier].maxPlayers} players ·{" "}
            up to {LIMITS[planTier].maxQuestions} rounds per game ·{" "}
            {LIMITS[planTier].roomTtlHours}-hour rooms
          </p>
        </CardContent>
      </Card>

      <p className="font-score mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        pick a game
      </p>
      <GameCardDeck />

      {activeRoomsSection(activeRooms)}
    </main>
  );
}

function UsageStat({ label, value, cap }: { label: string; value: number; cap?: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium text-card-foreground/70">{label}</p>
      <p className="text-xl font-black tabular-nums">
        {value.toLocaleString()}
        {cap !== undefined && (
          <span className="text-sm font-semibold text-card-foreground/60"> / {cap.toLocaleString()}</span>
        )}
      </p>
    </div>
  );
}

function activeRoomsSection(
  activeRooms: { id: string; room_code: string; status: string }[]
) {
  return (
    <>
      {activeRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active rooms</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activeRooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold tracking-widest">{room.room_code}</span>
                  <Badge variant={room.status === "lobby" ? "secondary" : "default"}>
                    {room.status === "lobby" ? "In lobby" : "In game"}
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/screen/${room.room_code}`}>Open main screen</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
