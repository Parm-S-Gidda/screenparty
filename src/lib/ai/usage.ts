// Per-account monthly usage counters (PRD §24: track AI/voice usage).

import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageMetric = "elevenlabs_chars" | "llm_host_lines" | "llm_judgments" | "ai_host_games";

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getUsage(
  admin: SupabaseClient,
  userId: string,
  metric: UsageMetric
): Promise<number> {
  const { data } = await admin
    .from("usage_limits")
    .select("used")
    .eq("user_id", userId)
    .eq("metric", metric)
    .eq("period_start", currentPeriodStart())
    .maybeSingle();
  return data?.used ?? 0;
}

export async function trackUsage(
  admin: SupabaseClient,
  userId: string,
  metric: UsageMetric,
  amount: number
): Promise<void> {
  if (amount <= 0) return;
  const period = currentPeriodStart();
  const { data: row } = await admin
    .from("usage_limits")
    .select("id, used")
    .eq("user_id", userId)
    .eq("metric", metric)
    .eq("period_start", period)
    .maybeSingle();
  if (row) {
    await admin.from("usage_limits").update({ used: row.used + amount }).eq("id", row.id);
  } else {
    await admin
      .from("usage_limits")
      .insert({ user_id: userId, metric, period_start: period, used: amount });
  }
}
