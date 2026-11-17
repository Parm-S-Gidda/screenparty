# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: friend groups and party hosts playing together at home or over Discord screen share. One person (the host) has an account and puts the game on a shared screen (TV, laptop, projector); everyone else joins from their phone with a room code, a name and an avatar. No player accounts.

Secondary, not the current focus: classroom teachers, bar and event hosts.

## Product Purpose

ScreenParty is a browser party-game platform in the Jackbox/Kahoot mold: one shared main screen, phones as controllers. Success is a group going from "what should we play?" to laughing through a game in a couple of minutes, and the host coming back for the next get-together.

## Positioning

Jackbox-style party games that are free to start and run in any browser: no game purchase, no console, no app download for anyone. An optional AI game-show host (Virtual Host) can run the game so the host gets to play too; it supports the pitch but is not the lead.

## Operating Context

- Played in a living room or on a Discord call; the main screen is read from across a room or through a screen share, so it must be legible at a distance and over compression.
- Players use their own phones, one-handed, while talking and laughing; join happens mid-conversation.
- Hosts usually decide and set up minutes before playing, often on a laptop.

## Capabilities and Constraints

- Games (9): Fact Frenzy (buzz-in trivia), Two Truths & a Lie, Would You Rather, Most Likely To, Higher or Lower, Guess the Player, Shark Tank, Charades, Number Rating.
- Host modes: Self Host (a person runs the show) and Virtual Host (AI host with voice and captions).
- Team mode for trivia and Would You Rather.
- Custom question packs; AI-generated packs on paid plans.
- Plans (source of truth: `src/lib/constants.ts` `LIMITS`): Free (5 players), Party Pass ($5.99 one-time, 24 hours, Party+ limits), Party+ ($10/mo, 20 players), Pro Host ($30/mo, 50 players). Copy must read numbers from `LIMITS`, never hardcode them.
- AI host and teams are currently free during beta (`AI_HOST_FREE_BETA`, `TEAMS_FREE_BETA`).
- Stack: Next.js App Router, Tailwind v4, shadcn/ui, Framer Motion, Supabase.

## Brand Commitments

- Name: ScreenParty.
- Keep the gamey, Jackbox-like party personality; the refresh should feel more modern and coherent, not corporate.
- Existing assets: illustrated avatar heads (`public/avatars/`), the SVG Mascot with expressions (`src/components/cartoon/Mascot.tsx`).

## Evidence on Hand

- Real gameplay screenshots in the repo root (e.g. `hol-01-voting.png`, `hol-03-scoreboard.png`, `num-02-guessing.png`, `game-page.png`) and fresh captures from the running app may be used.
- No testimonials, user counts, ratings, or press exist. Never fabricate them; use real screenshots or clearly marked placeholders.

## Product Principles

1. Get people playing fast: the player with a code and the host about to start are never more than one obvious action away.
2. Show the game, don't describe it: real gameplay beats claims.
3. Be honest about free: state the free tier's real limits where the promise is made.
4. The party is the product: the room's fun matters more than the software's features.

## Accessibility & Inclusion

- WCAG AA contrast for text; visible keyboard focus.
- Respect reduced-motion preferences across all animation.
- Main-screen text must be readable from across a room; phone targets at least 44px.
