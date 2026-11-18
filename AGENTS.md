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
TimerBar + PhaseTimerBar (the one countdown line every game uses; durations/AI
time-outs come from `src/lib/game/phaseTimer.ts`), RoughButton, PlayerStand). `AvatarBadge` renders the SVG Mascot.
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
AI themes (paid only, `aiPackGenPerMonth` quota): every setup screen has an
"AI theme" panel (`AiThemeSection`). Trivia writes a saved pack via
`/api/packs/generate`; the party games send `aiTopic` to `POST /api/rooms`,
which generates rows shaped like the game's table (`src/lib/ai/gameContent.ts`)
into `settings.aiPool`, and engines draw them first via `themedPool`. TTAL has
none (players write their own). Pack store (`/store`, `/store/[slug]`, checkout, `/store/library`): one
themed pack covers every game. `store_packs` (public catalog), `store_pack_items`
(per-game rows in the game's own row shape, service-role only),
`pack_purchases`. Owned packs are picked on each setup screen; trivia reads them
via `packSource: "store"`, other games get the rows in `settings.aiPool`.
Checkout records `status='test'` purchases (no Stripe yet) and is refused in
production unless `STORE_TEST_CHECKOUT=true`. Demo packs (`is_demo`) are catalog
filler with no content. Env keys are optional and documented in `.env.local`. `AI_HOST_FREE_BETA` in
`src/lib/constants.ts` keeps the AI host free-tier accessible; flip to false to make it
paid-only. Webhooks are testable offline: `node scripts/stripe-webhook-sign.mjs
<user_id> <status> <verb>` emits a signed payload for `/api/billing/webhook` (secret
`whsec_local_test_secret` from `.env.local`).

## How-to-play tutorials: keep them in sync (required)
Every game has a voiced tutorial that plays on the big screen before round 1
(playbook: `docs/TUTORIALS.md`). Scripts in `src/lib/tutorials.ts` restate the
real rules out loud (points, timers, who taps what, team/retry/variation
behaviour); scenes in `src/components/tutorial/<Game>TutorialScenes.tsx` feed
fake room state into the game's real screens.

**Whenever you change a game's engine (`src/lib/game/*.ts`), its scoring
constants (`src/lib/constants.ts`), its settings, or its screens
(`src/components/screens/*`), update that game's tutorial in the same change:**
1. Re-read the game's script and fix any line the change made untrue; add or
   adjust a `when`-gated step for a new setting. Mirror line edits in
   `docs/tutorial-scripts/ALL_TUTORIAL_SCRIPTS.md`. Lines may use ElevenLabs v3
   `[audio tags]` (spoken by `eleven_v3`, stripped from captions).
2. Fix the scene's fake payloads if a `PublicPayload`/`RoomStateResponse` shape
   changed (`npx tsc` catches most of these), and recompute demo scores from
   the constants.
3. Delete the mp3s of edited lines and regenerate:
   `node --env-file=.env.local scripts/gen-tutorial-voice.ts --game=<gameType>`.
4. Play it at `/dev/tutorial?game=<gameType>&mode=virtual|self` (plus
   `&teams=1`, `&retries=0`, `&autoskip=1`, `&variation=two_lies` as relevant).
A new game isn't done until it has both scripts, scenes and clips.

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
