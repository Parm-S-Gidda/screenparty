# ScreenParty SEO & Marketing Overhaul

Completed July 2026. This document covers the public route map, SEO decisions, sitemap, robots rules, structured data, analytics events, content model, and items requiring owner input.

---

## Public Route Map

| Route | Purpose | SEO Priority |
|---|---|---|
| `/` | Homepage | 1.0 |
| `/games` | Games directory | 0.9 |
| `/games/fact-frenzy` | Individual game page | 0.85 |
| `/games/two-truths-and-a-lie` | Individual game page | 0.85 |
| `/games/would-you-rather` | Individual game page | 0.85 |
| `/games/most-likely-to` | Individual game page | 0.85 |
| `/games/higher-or-lower` | Individual game page | 0.85 |
| `/games/guess-the-player` | Individual game page | 0.85 |
| `/games/shark-tank` | Individual game page | 0.85 |
| `/games/charades` | Individual game page | 0.85 |
| `/games/number-rating` | Individual game page | 0.85 |
| `/how-it-works` | Product explainer | 0.8 |
| `/virtual-host` | Virtual Host feature page | 0.8 |
| `/pricing` | Full pricing page | 0.8 |
| `/occasions` | Occasion hub | 0.7 |
| `/occasions/house-parties` | Occasion guide | 0.65 |
| `/occasions/birthday-parties` | Occasion guide | 0.65 |
| `/occasions/family-game-night` | Occasion guide | 0.65 |
| `/occasions/team-building` | Occasion guide | 0.65 |
| `/occasions/office-parties` | Occasion guide | 0.65 |
| `/occasions/university-events` | Occasion guide | 0.65 |
| `/occasions/virtual-parties` | Occasion guide | 0.65 |
| `/help` | FAQ & help | 0.6 |
| `/privacy` | Privacy policy | 0.3 |
| `/terms` | Terms of service | 0.3 |

**Total public pages in sitemap: 25**

---

## noindex Pages (private / utility)

These pages are excluded from robots.txt and emit `robots: { index: false }` metadata:

- `/login`
- `/signup`
- `/join`
- `/dashboard`
- `/account`
- `/host/new`
- `/screen/[code]` (disallowed in robots.txt)
- `/play/[code]` (disallowed in robots.txt)
- `/api/*` (disallowed in robots.txt)

---

## SEO Keyword Intent Per Page

| Page | Primary Keyword Intent |
|---|---|
| `/` | "party games big screen", "phone controller games" |
| `/games` | "online party games for groups" |
| `/games/fact-frenzy` | "online buzz-in trivia game" |
| `/games/two-truths-and-a-lie` | "play Two Truths and a Lie online" |
| `/games/would-you-rather` | "online Would You Rather multiplayer" |
| `/games/most-likely-to` | "online Most Likely To game" |
| `/games/higher-or-lower` | "online Higher or Lower game" |
| `/games/guess-the-player` | "online social guessing game" |
| `/games/shark-tank` | "online pitching party game" |
| `/games/charades` | "play Charades online with phones" |
| `/games/number-rating` | "online ranking party game" |
| `/how-it-works` | "phone-controlled party games setup" |
| `/virtual-host` | "virtual game host party games" |
| `/pricing` | "ScreenParty pricing plans" |
| `/occasions/*` | "[occasion type] party games" |

---

## Metadata Approach

All public pages export a `metadata` object via Next.js App Router. Every page has:
- Unique `title` (from the page's SEO title field)
- Unique `description`
- `openGraph.title` and `openGraph.description`

The root layout (`src/app/layout.tsx`) defines:
- `metadataBase` from `NEXT_PUBLIC_SITE_URL`
- Title template: `%s · ScreenParty`
- Default description mentioning all 9 games

Individual pages override the default using `export const metadata`.

---

## Structured Data

| Page | Schema Types Used |
|---|---|
| Homepage | Organization, WebSite (with SearchAction), WebApplication (all 4 offers), FAQPage |
| /games | ItemList (9 ListItems) |
| /games/[slug] | SoftwareApplication, BreadcrumbList |
| /how-it-works | HowTo (5 steps) |
| /virtual-host | FAQPage |
| /pricing | SoftwareApplication (all 4 offers) |
| /occasions/[slug] | BreadcrumbList |

All structured data reflects visible page content. No invented reviews, ratings, aggregate scores, or video objects (no video assets exist).

---

## Analytics Events

Analytics is provided by Vercel Analytics (`@vercel/analytics`). Page views are tracked automatically. Custom events use the `track()` function from `src/lib/analytics.ts`.

| Event | When it fires |
|---|---|
| `host_cta_clicked` | Any "Host Free" or "Play Free" CTA click |
| `join_cta_clicked` | "Join a Game" CTA click |
| `game_card_viewed` | Game card visible (add IntersectionObserver to trigger) |
| `game_details_opened` | "How It Works" card link clicked |
| `room_code_submitted` | Room code form submitted |
| `pricing_viewed` | /pricing page load |
| `pricing_cta_clicked` | Any plan CTA click |
| `virtual_host_section_viewed` | Virtual Host section visible on homepage |
| `occasion_cta_clicked` | Occasion page CTA click |
| `games_directory_viewed` | /games page load |
| `how_it_works_viewed` | /how-it-works page load |
| `occasion_page_viewed` | /occasions/[slug] page load |

**Note:** CTA click events are not yet wired to individual buttons. To add them, import `track` from `@/lib/analytics` and call it in `onClick` handlers. The event names and types are ready in `src/lib/analytics.ts`.

---

## Content Architecture

### Central game registry
**File:** `src/lib/games.ts`

All game data lives here. Fields include: `slug`, `name`, `gameType` (matches DB), `category`, `tagline`, `shortDescription`, `longDescription`, `howItWorks`, `scoring`, `minPlayers`, `virtualHostSupported`, `manualHostSupported`, `color`, `sticker`, `seoTitle`, `seoDescription`, `primaryKeyword`, `relatedGameSlugs`, `recommendedOccasionSlugs`, `status`, `gameFaq`.

Adding a new game = add one entry to `GAMES` array. All marketing pages derive from this automatically.

### Occasions registry
**File:** `src/lib/occasions.ts`

All occasion data including: `slug`, `name`, `tagline`, `intro`, `recommendedGameSlugs`, `suggestedRunOfShow`, `groupSizeGuidance`, `setupTips`, `contentNotes`, `seoTitle`, `seoDescription`.

Adding an occasion = add one entry to `OCCASIONS` array + sitemap auto-updates.

### Public components
**Directory:** `src/components/public/`

| Component | Purpose |
|---|---|
| `PublicNav.tsx` | Sticky marketing nav with mobile hamburger |
| `PublicFooter.tsx` | Full footer with all links grouped |
| `PublicGameCard.tsx` | Game card for marketing (links, not click-navigate) |
| `Breadcrumbs.tsx` | BreadcrumbList schema + visible nav |
| `PublicFAQ.tsx` | FAQ accordion, optional FAQPage schema |
| `PricingSection.tsx` | Pricing cards, reads from LIMITS constants |

---

## Internal Linking System

- Homepage → all major sections, games directory, Virtual Host, Pricing, Occasions
- `/games` → each game page
- `/games/[slug]` → 3 related games, 3 related occasions
- `/occasions/[slug]` → recommended games
- `/virtual-host` → all 9 supported game pages
- `/pricing` → signup
- All pages → breadcrumbs with parent links
- Footer → all marketing pages, all game pages, all occasion pages

---

## Route Group Architecture

```
src/app/
├── (public)/          ← Marketing pages (PublicNav + PublicFooter layout)
│   ├── layout.tsx
│   ├── page.tsx       ← Homepage
│   ├── games/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── how-it-works/page.tsx
│   ├── virtual-host/page.tsx
│   ├── pricing/page.tsx
│   ├── occasions/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── help/page.tsx
│   ├── privacy/page.tsx
│   └── terms/page.tsx
├── dashboard/          ← Auth-required (noindex)
├── account/            ← Auth-required (noindex)
├── login/              ← Utility (noindex)
├── signup/             ← Utility (noindex)
├── join/               ← Utility (noindex)
├── host/new/           ← Auth-required (noindex)
├── play/[code]/        ← Game player (disallowed in robots.txt)
├── screen/[code]/      ← Game host screen (disallowed in robots.txt)
└── api/                ← API routes (disallowed in robots.txt)
```

---

## Items Requiring Owner Confirmation

1. **Support contact** — `/help` page says "Contact us through your account dashboard." Add a real email or support channel link.

2. **Legal jurisdiction** — `/terms` has a placeholder for governing law jurisdiction. Replace with the actual company jurisdiction.

3. **Privacy contact email** — `/privacy` references "your account dashboard" for privacy requests. Add a dedicated privacy contact email if required by GDPR/CCPA.

4. **Party+ monthly price** — Displayed as $10/month based on homepage copy. No price constant in code. Confirm against the Stripe dashboard before launch.

5. **ElevenLabs character budgets** — The plan limits (10k / 50k / 200k chars/month) are in `constants.ts`. These are not currently shown on the Virtual Host page to avoid confusing users. Show them if you want to be explicit, or translate to estimated voice minutes.

6. **`AI_HOST_FREE_BETA` flag** — Currently `true`. When set to `false`, the pricing page copy ("free during beta") and virtual-host page will automatically reflect the change since they read from the constant.

7. **Game artwork** — All game cards use a coloured placeholder with a doodle star. Replace with real screenshots when available. The art placeholder lives in `PublicGameCard.tsx` and `GameCardDeck.tsx` in the art-frame `div`.

8. **OG images per page** — All pages inherit the root OG image from `src/app/opengraph-image.tsx`. Consider adding page-specific OG images for `/games/[slug]` and `/occasions/[slug]` for better social sharing.

9. **Custom analytics events** — The `track()` function in `src/lib/analytics.ts` is ready. Wire calls to CTA `onClick` handlers to start capturing funnel data.

10. **`/packs` route** — Architecture is ready (add to sitemap and occasions registry pattern). No pages published because no public pack content exists yet.

---

## Future Content Recommendations

**High priority:**
- Real game screenshots replacing color-block placeholders
- Individual OG images per game

**Medium priority:**
- Public question pack pages (`/packs`, `/packs/[slug]`) when pack content is ready
- Game guides ("How to win at Fact Frenzy", "Tips for Two Truths & a Lie")
- Seasonal game collection pages (holiday trivia, etc.)

**Low priority:**
- `/occasions/classrooms` — not created. Product needs content moderation features first.
- Device setup guides (smart TV, projector) — can be added to `/how-it-works`
- Remote play guide — can be expanded from the current `/how-it-works` section

**Do not create:**
- Competitor alternative pages (`/jackbox-alternative`, `/kahoot-alternative`, etc.)
- Fake testimonial or review sections
