# How-to-play tutorials: playbook

Every game has a tutorial. Use this file to change one, or to add one for a new
game. **When a game's rules, constants, settings or screens change, its
tutorial must change in the same commit** (rule repeated in `AGENTS.md`).

## What a tutorial is

When the room owner presses **Start the show!** and the room's `settings.tutorial`
is on (the default), the big screen plays a ~1 minute **live demo** before
`START_GAME` is sent: a scripted fake round drawn with the game's real props, one
pre-recorded voice line per step, captions in the host speech bubble. It advances
when each clip ends; tapping the caption skips a line; **Skip tutorial** jumps to
round 1. Phones stay in the lobby meanwhile.

Every game needs **two scripts**: `virtual` (the AI host talks as "I") and `self`
(an off-screen "announcer"; a person runs the show, so explain what *they* tap).

## Files

| File | Role |
| --- | --- |
| `src/lib/tutorials.ts` | Scripts: `TUTORIALS[gameType][hostMode]` = `{ id, scene, line, when? }[]`; `getTutorial(game, mode, settings)` drops steps whose `when` fails. No `@/` imports (the voice script imports it with Node type stripping). |
| `src/components/tutorial/TutorialPlayer.tsx` | Plays a script. `SCENES` maps gameType → scene component (`SceneProps`: scene, hostMode, settings). |
| `src/components/tutorial/demo.tsx` | Demo kit: `demoState()` builds a fake `RoomStateResponse`; `DemoScreen` renders the real big screen (`StateView`), `DemoPhone` the real phone (`PlayerGameView`) in a drawn handset; `TitleCard`, `Finale`, shared `CAST` (Sam, Priya, Marcus, Jules). |
| `src/components/tutorial/<Game>TutorialScenes.tsx` | One per game: a `switch (scene)` returning the demo for each step. Number Crunch draws bespoke props; the others feed fake state to the real screens. |
| `scripts/gen-tutorial-voice.ts` | Generates `public/tutorials/<game>/<mode>/<step id>.mp3` with ElevenLabs. `--game=<gameType>` limits it; `--force` regenerates everything. |
| `src/components/setup/SetupParts.tsx` | `TutorialRow`: the "How to play" toggle on every setup screen; greyed out until `TUTORIALS[gameType]` exists. |
| `src/components/screens/MainScreen.tsx` | `start()` shows `TutorialPlayer` instead of sending `START_GAME`. |
| `src/app/dev/tutorial` | Preview without a room: `/dev/tutorial?game=<gameType>&mode=virtual|self`, plus `&teams=1`, `&retries=0`, `&autoskip=1`, `&variation=two_lies`. |

## Steps for one game

1. **Learn the real rules.** Read the engine (`src/lib/game/<game>.ts`), its views
   (`src/components/screens/<Game>Views.tsx`), the scoring constants in
   `src/lib/constants.ts`, and the game's entry in `src/lib/games.ts`. Script from
   the code, not the marketing copy: `games.ts` copy has been wrong before (Number
   Crunch's said the Guesser earns 200; it's the example's author). Recheck every
   number you say out loud.
2. **Write both scripts** in `src/lib/tutorials.ts`. 6–9 steps, one idea each,
   ~1–2 sentences, about a minute total. Order: welcome → setup of a round → what
   phones do → the twist → reveal and scoring → how a winner is decided → who
   drives (AI: "I'll run the show"; self: what the host taps and any player-host
   duties). Keep it TTS-friendly: no em dashes, ellipses or symbols, write numbers
   as words when they're spoken ("two hundred").
3. **Voice: cheeky, Jackbox-ish.** Short jokes at the players' expense, never
   mean. Number Crunch examples: "Like a tourist with no map", "Yes, I'm looking
   at you", "we simply don't talk about it".
4. **Build the scenes** in `src/components/tutorial/<Game>TutorialScenes.tsx` and
   register it in `SCENES`. Prefer `DemoScreen`/`DemoPhone` with a `demoState()`
   payload: the tutorial then shows the game's real screens and follows UI
   changes for free. Use the shared `CAST`; data whose numbers match the script
   (compute scores from the constants, never hard-code them). Pass
   `owner={hostMode === "self"}` to show the owner's real buttons. Watch for
   views that hold content back (TTAL's phone hides REVEAL controls for 10s) or
   fetch (HostController takes `demoPreview`); pick a state that shows the idea
   immediately. If a needed piece is buried in a big component, extract it
   (Number Crunch extracted `NumScale` and `RevealRow`). Follow `DESIGN.md`: one lead per
   scene, one mustard button at most (and only as a picture of a real control,
   `aria-hidden` + `pointer-events-none`), cream/ink on paper, cream on stage night,
   12px floor, motion from the Framer spring tokens.
5. **Generate the voice:**
   `node --env-file=.env.local scripts/gen-tutorial-voice.ts --game=<gameType>`
   (skips clips that exist: delete the mp3 of every line you edited first).
6. **Check it:** `/dev/tutorial?game=<gameType>&mode=virtual` and `&mode=self`, then
   a real room via `/dev/test` (needs a signed-in host). Confirm round 1 starts
   on its own when the tutorial ends and with **Skip tutorial**.
   Note: the in-app browser pane freezes animations while hidden, so scenes look
   blank there. Show the pane, or screenshot with the Playwright MCP instead.
7. `npx tsc --noEmit -p .` and `npx eslint` on the touched files.

## Settings-aware steps

A step with `when: (s) => …` only plays when the room's settings match
(`TutorialSettings`: `teamsEnabled`, `retriesEnabled`, `autoSkip`, `variation`;
MainScreen passes `session.settings`). Clips are named by step id, so
filtering never shifts which clip plays; variants of one beat share a `scene`
but need distinct ids (`welcome` / `welcome_lies`). Keep variants to a step or
two, and prefer wording that holds for any numeric setting ("fewer points")
over a clip per value. Clips use `ELEVENLABS_VOICE_ID`, not personality voices.

## Voice lines, audio tags and rewrites

Lines may carry ElevenLabs v3 audio tags such as `[excited]` or `[whispers]`.
The voice script always uses `eleven_v3`, which performs them (older models
read them aloud), and `captionText()` strips them from the on-screen caption.
Keep tags to a few lowercase words, 0 to 2 per line.

`docs/tutorial-scripts/ALL_TUTORIAL_SCRIPTS.md` is the copy-editable version of
every line, with what's on screen and the rules each line must keep, and
`CHATGPT_PROMPT.md` is the prompt used to rewrite them. After editing lines in
`src/lib/tutorials.ts`, update that file to match.

## Status

| Game (`gameType`) | Settings branches |
| --- | --- |
| Number Crunch (`num`) | none |
| Fact Frenzy (`buzz_trivia`) | retries, teams (+ steal), auto skip (self only; always on with the AI host) |
| Two Truths & a Lie (`ttal`) | variation `two_lies` |
| Would You Rather (`wyr`) | teams |
| Most Likely To (`mlt`) | none |
| Higher or Lower (`hol`) | none |
| Guess the Player (`gtp`) | none |
| Shark Tank (`tank`) | none |
| Charades (`charades`) | none |

All have both modes, scenes and clips. Scripts follow the engines, not
`src/lib/games.ts` marketing copy, which still disagrees in places (e.g. it says
Most Likely To ties both score, Higher or Lower and Charades need 3 players;
the engines say ties score nothing and 2 players is enough; `num` is still
"Number Rating" there).
