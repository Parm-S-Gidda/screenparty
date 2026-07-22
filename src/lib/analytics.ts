"use client";

// Typed analytics wrapper around Vercel Analytics custom events.
// Import `track` anywhere in client components to record funnel events.
// Page views are tracked automatically by <Analytics /> in the root layout.

import { track as vaTrack } from "@vercel/analytics";

type AnalyticsEvent =
  | "homepage_viewed"
  | "game_card_viewed"
  | "game_details_opened"
  | "host_cta_clicked"
  | "join_cta_clicked"
  | "room_code_submitted"
  | "pricing_viewed"
  | "pricing_cta_clicked"
  | "virtual_host_section_viewed"
  | "occasion_cta_clicked"
  | "post_game_host_cta_clicked"
  | "games_directory_viewed"
  | "occasion_page_viewed"
  | "how_it_works_viewed";

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  try {
    vaTrack(event, props);
  } catch {
    // Vercel Analytics silently fails outside Vercel deployments; swallow in dev.
  }
}
