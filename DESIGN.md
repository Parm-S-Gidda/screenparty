---
name: ScreenParty
description: Party games on the big screen, phones as controllers, dressed as a hand-made TV game show.
colors:
  stage-night: "#191624"
  ink: "#221f30"
  ink-soft: "#35304a"
  ink-body: "#4a4460"
  ink-label: "#6b6248"
  cream: "#f5ecd4"
  paper: "#eaddbd"
  card-white: "#fffdf3"
  curtain: "#174a4c"
  cream-muted: "#c9bfa4"
  mustard: "#f0b429"
  tomato: "#e2493b"
  error-red: "#b8321f"
  teal: "#2fa8a0"
  coral: "#ee7c8e"
  grape: "#6f5aa0"
  leaf: "#76b041"
  sky: "#5aa9e6"
typography:
  display:
    fontFamily: "Luckiest Guy, Comic Sans MS, cursive"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.03em"
  headline:
    fontFamily: "Luckiest Guy, Comic Sans MS, cursive"
    fontSize: "clamp(1.875rem, 4vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.03em"
  title:
    fontFamily: "Luckiest Guy, Comic Sans MS, cursive"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.03em"
  body:
    fontFamily: "Gochi Hand, Comic Sans MS, cursive"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Oswald, Geist, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  chip: "0.4rem"
  input: "0.75rem"
  button: "0.9rem 1.2rem 0.8rem 1.3rem / 1.2rem 0.8rem 1.3rem 0.9rem"
  card: "0.8rem 1.1rem 0.7rem 1.2rem / 1.1rem 0.7rem 1.2rem 0.8rem"
  panel: "1.1rem 1.5rem 1rem 1.6rem / 1.5rem 1rem 1.6rem 1.1rem"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 28px"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.button}"
    padding: "12px 28px"
  button-accent:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 28px"
  card-paper:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  input-code:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "64px"
  chip-label:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
---

# Design System: ScreenParty

## Overview

**Creative North Star: "The Late-Night Game Show Set"**

ScreenParty looks like a hand-built TV game show shot under stage lights: a dark studio (stage night) with cream paper props in front of it, outlined in thick ink, cast in hard shadow, and lit with a few loud show colors. Everything a player touches feels like a physical prop: buttons press down, cards sit on the stage, stamps slam on. The personality comes from the props, the mascots and the hand lettering, never from clutter.

The refresh keeps that world and makes it more modern: fewer props per screen, more breathing room, one clear lead per view, and motion that is playful everywhere but always quick and purposeful. Every screen should read from across a living room or through a Discord screen share.

The look applies to both the game screens and the marketing site; both render inside `.stage` (set on `<body>`).

**Key Characteristics:**
- Dark stage, cream paper props, ink outlines (4–5px), hard offset shadows with no blur.
- Slightly uneven, hand-cut corners on buttons, cards and panels.
- Three type voices: loud display caps, friendly handwriting, tight condensed labels.
- Mustard is the "go" color; teal, coral, tomato and friends are show-lighting accents.
- Playful, springy motion with real overshoot, always short and always reduced-motion safe.

## Colors

A flat, screen-printed palette: one dark stage, one paper, one ink, and a box of bright show lights.

### Primary
- **Marquee Mustard** (`mustard`): the main call to action, the "go" color. Primary buttons, the active step, the brand wordmark's first half, highlight stars.

### Secondary
- **Studio Teal** (`teal`): second-tier actions and success. Always with ink text: cream on teal fails contrast (2.5:1).
- **Buzzer Tomato** (`tomato`): wrong answers, destructive actions, the "live" light. For error text on cream use **Error Red** (`error-red`), which passes AA.

### Tertiary
- **Stage Curtain** (`curtain`): the deep teal of full-width section bands, a darkened Studio Teal so bands tie to the teal accent and stay cool against mustard and cream (see Layout › Bands). Cream and cream-muted text sit on it; it is never used for small elements or buttons.
- **Show lights** (`coral`, `grape`, `leaf`, `sky`): per-game identity colors, team colors and celebratory accents. Never for body text, never more than two on one card.

### Neutral
- **Stage Night** (`stage-night`): the page background everywhere.
- **Ink** (`ink`): outlines, shadows, headings and text on paper.
- **Ink Body** (`ink-body`): body copy on cream or paper only. Never on stage night (1.9:1).
- **Ink Label** (`ink-label`): small labels and metadata on cream (about 5:1).
- **Cream** (`cream`): paper props, and headings on stage night.
- **Old Paper** (`paper`): secondary surfaces, tape, disabled buttons.
- **Cream Muted** (`cream-muted`): body copy on stage night.
- **Card White** (`card-white`): input wells.

### Named Rules
**The Surface Decides the Ink Rule.** Text color follows the surface, not the section: on stage night use cream or cream muted; on cream or paper use ink, ink body or ink label. Never move a text color across surfaces.

**The One Go Button Rule.** Each view has exactly one mustard primary action. Everything else is ink, teal or a text link.

## Typography

**Display Font:** Luckiest Guy (with Comic Sans MS, cursive)
**Body Font:** Gochi Hand (with Comic Sans MS, cursive)
**Label/Mono Font:** Oswald, bold (with Geist, sans-serif)

**Character:** Luckiest Guy is the game-show marquee; Gochi Hand is the host's handwritten cue card; Oswald is the scoreboard and the fine print.

### Hierarchy
- **Display** (400, clamp 2.5–4.5rem, 0.95): one per page, the hero headline. Uppercase.
- **Headline** (400, clamp 1.875–2.5rem, 1.05): section headings. Uppercase.
- **Title** (400, 1.25rem, 1.15): card and step titles.
- **Body** (400, 1.125rem, 1.35): descriptions and host lines, max about 60ch.
- **Label** (700, 0.75rem minimum, 0.2em tracking, uppercase): eyebrows, tags, metadata, scores.

### Named Rules
**The Twelve Pixel Floor Rule.** No text below 12px (0.75rem), including tags and badges.

**The Headline Is the Biggest Thing Rule.** The page's H1 is its largest text; the brand wordmark lives in the nav.

## Layout

Centered single column on the marketing site with a max width of 64rem (1024px) for content and 72rem for pricing. Sections are separated by generous space (`section`, 96px desktop, 64px mobile) instead of decorative dividers, and by curtain bands where a hard break is needed. Grids drop to one column under 640px rather than squeezing two narrow cards side by side. Phone screens keep primary actions in the bottom half and touch targets at least 44px.

### Bands
A band is a full-width section on the **Stage Curtain** deep teal (`.band-curtain` in `globals.css`): curtain background with faint vertical folds, a 4px ink edge top and bottom, content centered in the usual max width inside. Inside a band, `--muted-foreground` switches to cream-muted so body text stays readable.

- **Use a band** to hard-separate a section from its neighbors: right after the hero (so hero decoration like spotlight beams ends on a clean edge), and for one spotlight feature further down.
- **Alternate:** never put two bands next to each other; a stage-night section always sits between them. At most two bands per page.
- **Never let decoration cross a boundary.** Glows, beams and patterns end at their section's edge, either at a band border or with a fade (mask to transparent).
- **Page background:** the body's top glow is painted once (`background-repeat: no-repeat`); repeating backgrounds on `body` tile per viewport and leave hard horizontal lines.

**The One Lead Rule.** Every section has one job and one visual lead. If a section repeats a claim made elsewhere on the page, cut it.

## Elevation & Depth

Depth is physical, not atmospheric: props sit on the stage with hard, unblurred offset shadows in ink or black. There are no soft drop shadows and no glows.

### Shadow Vocabulary
- **Panel** (`box-shadow: 8px 8px 0 rgba(0,0,0,0.55)`): the hero prop on a screen, such as the join form or a modal.
- **Card** (`box-shadow: 5px 5px 0 rgba(0,0,0,0.5)`): cards, list items, FAQ rows.
- **Button** (`box-shadow: 0 6px 0 var(--ink), 0 10px 0 rgba(0,0,0,0.35)`): raised buttons; collapses to 0 on press.
- **Chip** (`box-shadow: 2px 2px 0 rgba(0,0,0,0.4)`): small badges.

**The Hard Shadow Rule.** Shadows are offset and unblurred, and they move with the prop: on hover a card lifts (shadow grows), on press a button sinks (shadow shrinks to zero).

## Shapes

Hand-cut, slightly uneven corners: each corner has a different radius so props look cut with scissors (`rounded.button`, `rounded.card`, `rounded.panel`). Outlines are thick ink: 5px panels, 4px cards and buttons, 3px inputs and small chips, 2px tiny badges. Props may tilt slightly (±1.5°) for life; never tilt body text blocks more than 1°.

## Components

### Buttons
Tactile and chunky: they look pressable and they press.
- **Shape:** hand-cut corners (`rounded.button`), 4px ink outline, display font.
- **Primary:** mustard with ink text. One per view.
- **Secondary:** ink with cream text.
- **Accent:** teal with ink text.
- **Hover:** lifts 2px with the shadow growing (180ms, spring).
- **Press:** sinks 6px, shadow collapses (120ms).
- **Focus:** 3px mustard outline, 3px offset, visible on keyboard focus only (`:focus-visible`).
- **Disabled:** old paper with faded ink text, flat shadow.
- **Text links:** Oswald label style, cream at full opacity on stage night, underline on hover.

### Cards / Containers
- **Corner Style:** hand-cut (`rounded.card`).
- **Background:** cream; old paper for nested or secondary surfaces.
- **Shadow Strategy:** card shadow; lift on hover when the whole card is a link.
- **Border:** 4px ink.
- **Internal Padding:** 20px.
- **Clickable cards:** the whole card is one link with one visible action, never two competing buttons.

### Inputs / Fields
- **Style:** card-white well, 4px ink outline, 0.75rem radius, display font for room codes.
- **Focus:** mustard ring (3px) plus the border staying ink.
- **Error:** error-red handwriting below the field, linked with `aria-describedby`, field marked `aria-invalid`, announced with `role="alert"`.
- **Room code input:** letters only, uppercase, 4–6 characters, filtered as the user types.

### Chips
- **Style:** ink background, cream Oswald label, 12px minimum.

### Navigation
- **Style:** stage night bar, wordmark left in display font (mustard + coral), Oswald links, one mustard "Host a game" button right.
- **Mobile:** 44px menu button; menu closes on Escape, outside tap and link tap.

### Signature: Mascots
The illustrated mascot heads are the cast: they stand for a real player (their chosen avatar) or for the Virtual Host. Use them where a person is meant (lobby, buzzes, scoreboard, podium, the host's lines) and let them react with expressions.

**The Mascots Are People Rule.** Never use mascots as decoration or filler art. On marketing pages, at most one mascot per section, and only where it plays a player or the host. Explain games and steps by drawing the real UI (room code on a TV, a phone joining, a scoreboard, a buzzer), not with characters.

### Signature: Tape label and stamp
Tape labels pin small props on game screens (the room code card, round banners). They are not eyebrows above headings: headings stand on their own. Stamps slam onto results (CORRECT, WRONG, WINNER) with the stamp animation.

## Motion

Playful throughout: every interaction gets a springy, physical response, and every big moment gets a celebration. Motion is fast, overshoots a little, and settles. Use Framer Motion (`motion` from `framer-motion`) for entrances and CSS for hover and press.

### Tokens
- **Spring (pop):** `cubic-bezier(0.34, 1.56, 0.64, 1)` for things arriving or growing.
- **Ease out:** `cubic-bezier(0.22, 1, 0.36, 1)` for things moving or fading.
- **Framer spring:** `{ type: "spring", stiffness: 420, damping: 26 }` for entrances; `{ stiffness: 600, damping: 18 }` for celebrations.
- **Durations:** press 120ms, hover 180ms, enter 420ms, celebrate 550ms. Nothing over 700ms except confetti.
- **Stagger:** 60ms between siblings, capped at 6 items.

### Patterns
- **Focal moment:** each page gets one authored entrance tied to the product. On the landing page the TV switches on (a bright line opening to the full picture), a phone springs up and a mascot pops in.
- **Rise in (lists):** groups of cards (steps, games, plans) pop in once as they scroll into view, 60ms apart: from 24px below and 96% scale to rest, with the spring. Use `RevealList` / `RevealItem` from `src/components/public/Reveal.tsx`. Headings and paragraphs do not animate in.
- **Lift and press:** hover lifts 2px, press sinks; shadows track the movement.
- **Pop:** badges, stamps and scores pop from 0 to 112% to 100%.
- **Wiggle on hover:** mascots and game art tilt ±4° once on hover, never on a loop.
- **Celebrate:** wins and correct answers use squash-and-stretch cheer, stamp-in, and confetti.

### Named Rules
**The Earn Your Loop Rule.** Infinite animation is reserved for one ambient element per view (such as the hero mascot row). Everything else animates in response to something: arriving, hovering, pressing, winning.

**The Reduced Motion Rule.** Under `prefers-reduced-motion: reduce`, movement becomes a 150ms opacity fade and loops stop. Content must never depend on an animation finishing to be visible.

## Do's and Don'ts

### Do:
- **Do** use one mustard primary button per view.
- **Do** follow the Surface Decides the Ink Rule: cream text on stage night, ink text on paper.
- **Do** show real gameplay (screenshots or clips) to explain a game.
- **Do** read plan numbers from `LIMITS` in `src/lib/constants.ts`.
- **Do** give every interactive element a visible `:focus-visible` mustard ring.
- **Do** keep text at 12px or larger and contrast at WCAG AA.
- **Do** use the `var(--ink)` and other CSS variables instead of redefining hex constants in components.

### Don't:
- **Don't** put cream text on teal or mustard, or ink-body text on stage night.
- **Don't** use soft blurred shadows or glows.
- **Don't** put two equal-weight buttons on one card.
- **Don't** loop more than one ambient animation per view, or spin mascots continuously.
- **Don't** repeat the same claim in multiple sections of a page.
- **Don't** use decorative dividers between sections; use space or a curtain band.
- **Don't** stack two bands back to back, or let a glow, beam or pattern run across a section boundary.
