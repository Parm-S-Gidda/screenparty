export const BRAND_NAME = "ScreenParty";

// Illustrated avatar heads in /public/avatars/<id>.png
export const AVATARS = [
  { id: "alien" },
  { id: "artist" },
  { id: "chef" },
  { id: "cool" },
  { id: "cowboy" },
  { id: "detective" },
  { id: "ghost" },
  { id: "knight" },
  { id: "mustache" },
  { id: "nerd" },
  { id: "party" },
  { id: "pirate" },
  { id: "pool" },
  { id: "queen" },
  { id: "robot" },
  { id: "sleepy" },
  { id: "viking" },
  { id: "wizard" },
  { id: "zombie" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

// Pricing tiers: Free, Party+ ($10/mo), Pro Host ($30/mo). The one-time 24h
// Party Pass ($5.99) grants party_plus limits while active, it is not a
// tier of its own (see resolveTier).
export type PlanTier = "free" | "party_plus" | "pro_host";

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  party_plus: "Party+",
  pro_host: "Pro Host",
};

export const LIMITS = {
  free: {
    maxPlayers: 5,
    maxQuestions: 15,
    roomTtlHours: 2,
    maxRoomsPerDay: 10,
    aiHostGamesPerMonth: 3,
    elevenLabsCharsPerMonth: 10_000,
  },
  party_plus: {
    maxPlayers: 20,
    maxQuestions: 25,
    roomTtlHours: 4,
    maxRoomsPerDay: 25,
    aiHostGamesPerMonth: 25,
    elevenLabsCharsPerMonth: 50_000,
  },
  pro_host: {
    maxPlayers: 50,
    maxQuestions: 25,
    roomTtlHours: 8,
    maxRoomsPerDay: 100,
    aiHostGamesPerMonth: 100,
    elevenLabsCharsPerMonth: 200_000,
  },
  usernameMaxLength: 16,
  answerMaxLength: 120,
  statementMaxLength: 140,
  gtpAnswerMaxLength: 120,
  charadesGuessMaxLength: 60,
  numExampleMaxLength: 80,
  maxRetriesCap: 5,
} as const;

// Normalize a stored tier string (profiles/rooms rows, incl. legacy 'paid')
export function tierFromString(value: string | null | undefined): PlanTier {
  if (value === "pro_host") return "pro_host";
  if (value === "party_plus" || value === "paid") return "party_plus";
  return "free";
}

// Effective tier for a host: their subscription tier, or party_plus while a
// 24h Party Pass is active.
export function resolveTier(
  profile: { plan_tier?: string | null; day_pass_expires_at?: string | null } | null | undefined
): PlanTier {
  const subscribed = tierFromString(profile?.plan_tier);
  if (subscribed !== "free") return subscribed;
  return dayPassActive(profile) ? "party_plus" : "free";
}

export function dayPassActive(
  profile: { day_pass_expires_at?: string | null } | null | undefined
): boolean {
  return Boolean(
    profile?.day_pass_expires_at &&
      new Date(profile.day_pass_expires_at).getTime() > Date.now()
  );
}

// Two Truths and a Lie: catch the lie / fool a voter
export const TTAL_POINTS = {
  correctGuess: 100,
  perFooled: 50,
} as const;

// Majority Would You Rather: call the majority right
export const WYR_POINTS = {
  correctPrediction: 100,
} as const;

// Most Likely To: vote for the person with the most votes
export const MLT_POINTS = {
  correctVoter: 100, // voted for the top person
  topPlayer: 50,     // bonus for being chosen most
} as const;

// Higher or Lower: vote with the majority
export const HOL_POINTS = {
  correctVoter: 100,
} as const;

// Guess the Player: identify who wrote the answer
export const GTP_POINTS = {
  correctGuess: 100,  // guessed the right person
  perFooled: 50,      // writer gets points per person who guessed wrong
} as const;

// Shark Tank: pitcher earns per investor
export const TANK_POINTS = {
  perInvestor: 75,
} as const;

// Charades: guess the word / get your word guessed
export const CHARADES_POINTS = {
  correctGuesser: 150, // first correct guess
  actor: 100,          // actor earns if someone guesses correctly
} as const;

// Number Rating: scored by accuracy (0–100 scale per example)
export const NUM_POINTS = {
  exactMatch: 200,   // guesser got the exact number
  close: 100,        // within 1 away
  near: 50,          // within 2 away
  guesserBase: 100,  // guesser gets this × average accuracy fraction
} as const;

// PRD §16: points by which buzz attempt got it right (1-indexed)
export const ATTEMPT_POINTS = [100, 75, 50, 25, 10] as const;

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 25] as const;

// Two Truths and a Lie: how many full cycles (everyone writes new statements
// each round and takes a turn as the subject)
export const TTAL_ROUND_OPTIONS = [1, 2, 3, 4, 5] as const;
export const TTAL_DEFAULT_ROUNDS = 3;
export const AUTO_SKIP_OPTIONS = [15, 30, 45] as const;

// PRD open decision #12: AI host free during beta. Flip to false when Phase 4
// billing lands to make Virtual Host paid-only.
export const AI_HOST_FREE_BETA = true;

// PRD §8: teams are a paid feature ("Later"); free during beta like the AI host.
export const TEAMS_FREE_BETA = true;

export const TEAMS = [
  { id: "red", name: "Team Red", emoji: "🔴" },
  { id: "blue", name: "Team Blue", emoji: "🔵" },
] as const;

export type TeamId = (typeof TEAMS)[number]["id"];

// PRD §24: max LLM answer judgments per game
export const MAX_LLM_JUDGMENTS_PER_GAME = 25;
