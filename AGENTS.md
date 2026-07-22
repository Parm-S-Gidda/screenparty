<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ScreenParty

Kahoot/Jackbox-style party game platform (see `prd.txt`). Games: Fact Frenzy
(buzz-in trivia; `game_type` stays `buzz_trivia`), Two Truths and a Lie (+ Two
Lies and a Truth variation), and Majority Would You Rather. Adding a game = new engine module (see `src/lib/game/ttal.ts` /
`wyr.ts` vs `engine.ts`), action-route dispatch on `game_sessions.game_type`,
state-endpoint additions, UI views, and AI-host moments —
lobby/scores/podium/realtime/billing are shared.

## In-game cartoon design system
Game screens (host `/screen` + phone `/play`) use a hand-drawn game-show theme,
scoped under the `.stage` class in `globals.css`: it remaps the shadcn tokens
(cream cards, ink borders, mustard primary, tomato destructive) and adds paper
utilities (`.panel`, `.panel-paper`, `.panel-grain`, `.btn-rough`, `.stamp`,
`.nameplate`, `anim-*` keyframes, reduced-motion guard). Fonts: Luckiest Guy
(`--font-display`), Gochi Hand (`--font-hand`), Oswald (`--font-score`), loaded
in `layout.tsx`. Reusable pieces live in `src/components/cartoon/` (Mascot with
expressions, Panel/Tape/TapedLabel/RoundBanner, Stamp, Burst + doodle SVGs,
TimerProp, RoughButton, PlayerStand). `AvatarBadge` renders the SVG Mascot.
Dashboard/marketing pages must NOT get `.stage`. New game views should compose
these primitives rather than styling from scratch.

Team mode (trivia + WYR, not TTAL): `room_players.team` ('red'|'blue'),
auto-balanced on join, owner moves players via SET_TEAM (lobby only). Scores
stay per-player; `endGame` adds `teamResult` totals when
`settings.teamsEnabled`. Trivia: wrong answers steal to the other team's next
buzzer. WYR: predictions target the other team's majority
(`wyrReveal.teamMajorities`). Gated by `TEAMS_FREE_BETA` like the AI host.
All 4 PRD build phases are implemented: core platform, self-hosted trivia, AI host
(OpenAI lines + ElevenLabs voice + typed-answer judging, graceful fallbacks without
keys), and Stripe subscriptions (checkout/portal/webhook, tier limits, usage dashboard).
Env keys are optional and documented in `.env.local`. `AI_HOST_FREE_BETA` in
`src/lib/constants.ts` keeps the AI host free-tier accessible; flip to false to make it
paid-only. Webhooks are testable offline: `node scripts/stripe-webhook-sign.mjs
<user_id> <status> <verb>` emits a signed payload for `/api/billing/webhook` (secret
`whsec_local_test_secret` from `.env.local`).

## Stack
Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion + Supabase
(Auth, Postgres, Realtime). Local Supabase runs via the `supabase` npm dev dependency
on Colima (`colima start`, then `npx supabase start`). Config: analytics disabled in
`supabase/config.toml` (vector container breaks under Colima).

## Architecture rules (PRD §21)
- Server is the source of truth. All game-state writes go through API route handlers
  using the service-role client (`src/lib/supabase/admin.ts`). Clients only read.
- The state machine lives in `src/lib/game/engine.ts` (`applyAction`); all actions
  POST to `/api/rooms/[code]/action` and are validated against state + actor role.
- Correct answers are NEVER client-readable: `game_questions`/`pack_questions` have
  no anon grants or policies. The engine copies the answer into
  `game_sessions.public_payload` only at SHOW_ANSWER. The self-host controller reads
  it via `/api/rooms/[code]/preview` (host-only).
- Players are anonymous: `room_players` row + secret token in `player_secrets`
  (service-role only), sent as `x-player-token` header, kept in localStorage.
- Clients consume `/api/rooms/[code]/state` and refetch on Supabase Realtime
  postgres_changes events (see `src/hooks/useRoomState.ts`), with 5s poll fallback.
- New tables need explicit `grant` statements (Data API roles are not auto-exposed)
  AND `alter publication supabase_realtime add table` for realtime.

## Commands
- `npx supabase start` / `npx supabase db reset` (applies migrations + seed)
- `npm run dev`, `npm run build`, `npm run lint`
