export type SessionState =
  | "LOBBY"
  // buzz trivia
  | "QUESTION_PREVIEW"
  | "BUZZ_OPEN"
  | "PLAYER_BUZZED"
  | "SHOW_ANSWER"
  // two truths and a lie
  | "COLLECTING"
  | "VOTING"
  | "REVEAL"
  // majority would you rather (shares REVEAL)
  | "WYR_CHOOSING"
  // most likely to
  | "MLT_VOTING"
  // higher or lower
  | "HOL_VOTING"
  | "HOL_REVEAL"
  // guess the player
  | "GTP_ANSWERING"
  | "GTP_GUESSING"
  // shark tank
  | "TANK_PITCHING"
  | "TANK_INVESTING"
  // charades
  | "CHARADES_ACTING"
  // number rating game
  | "NUM_SUBMITTING"
  | "NUM_GUESSING"
  // shared
  | "SCOREBOARD"
  | "GAME_OVER";

export type GameType = "buzz_trivia" | "ttal" | "wyr" | "mlt" | "hol" | "gtp" | "tank" | "charades" | "num";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export type GameSettings = {
  packId: string;
  questionCount: number;
  difficulty: Difficulty;
  hostMode: "self" | "virtual";
  autoSkip: boolean;
  autoSkipSeconds: number;
  retriesEnabled: boolean;
  maxRetries: number;
  strictness: "normal";
  maxPlayers: number;
  // two truths and a lie
  variation?: "two_truths" | "two_lies";
  subjectOrder?: string[];
  rounds?: number;
  // majority would you rather
  wyrQuestions?: { a: string; b: string }[];
  // team mode (trivia + wyr)
  teamsEnabled?: boolean;
  // most likely to
  mltPrompts?: string[];
  // higher or lower: N+1 items (rounds = holItems.length - 1)
  holItems?: { label: string; value: number; unit: string }[];
  // guess the player
  gtpPrompts?: { text: string; mode: "prompt" | "fill_blank" }[];
  gtpAnswerOrder?: string[][]; // per prompt, shuffled player IDs
  // shark tank
  tankProducts?: { pitcherId: string; productName: string; tagline: string }[];
  tankPitchSeconds?: number;
  // charades: word assignments (server-side only, never in public response)
  charadesWords?: { actorId: string; word: string; category: string }[];
  // number rating game
  numThemes?: { theme: string; scaleLow: string; scaleHigh: string }[];
  numGuesserOrder?: string[];
  numNumberAssignments?: { playerId: string; number: number }[][];
};

export type TeamId = "red" | "blue";

export type PodiumEntry = { place: number; playerIds: string[]; score: number };

export type PublicPayload = {
  // ── buzz trivia ────────────────────────────────────────────────────────────
  question?: { index: number; text: string; difficulty: string };
  answer?: { text: string };
  buzz?: { playerId: string; buzzOrder: number; attempt: number; answerOpen?: boolean };
  lastResult?: {
    playerId: string;
    correct: boolean;
    points: number;
    at: string;
    answerText?: string;
    judgedBy?: string;
  };
  podium?: PodiumEntry[];
  finalStandings?: {
    playerId: string;
    username: string;
    avatarId: string;
    team: TeamId | null;
    score: number;
  }[];
  buzzOpenedAt?: string;
  skipped?: boolean;
  // ── two truths and a lie ───────────────────────────────────────────────────
  ttalRound?: {
    subjectId: string;
    statements: { id: string; text: string }[];
    votingOpenedAt: string;
  };
  ttalReveal?: {
    oddStatementId: string;
    votes: { voterId: string; statementId: string }[];
    correctVoterIds: string[];
    fooledVoterIds: string[];
    subjectPoints: number;
    guesserPoints: number;
  };
  // ── majority would you rather ──────────────────────────────────────────────
  wyrRound?: { optionA: string; optionB: string; openedAt: string };
  wyrReveal?: {
    countA: number;
    countB: number;
    majority: "a" | "b" | "tie";
    choices: { playerId: string; choice: "a" | "b" }[];
    correctPredictorIds: string[];
    predictorPoints: number;
    teamMajorities?: Record<TeamId, "a" | "b" | "tie">;
  };
  teamResult?: {
    totals: Record<TeamId, number>;
    winner: TeamId | "tie";
  };
  // ── most likely to ─────────────────────────────────────────────────────────
  mltRound?: { promptText: string; openedAt: string };
  mltReveal?: {
    votes: { voterId: string; targetId: string }[];
    topPlayerIds: string[];
    winnerVoterIds: string[];
    voterPoints: number;
    topPlayerPoints: number;
  };
  // ── higher or lower ────────────────────────────────────────────────────────
  holRound?: {
    leftLabel: string;
    leftUnit: string;
    leftValue: number | null; // null = first round (hidden until first reveal)
    rightLabel: string;
    rightUnit: string;
    openedAt: string;
  };
  holReveal?: {
    leftValue: number;
    rightValue: number;
    correctAnswer: "higher" | "lower";
    majority: "higher" | "lower" | "tie";
    votes: { playerId: string; vote: "higher" | "lower" }[];
    correctVoterIds: string[];
    voterPoints: number;
  };
  // ── guess the player ───────────────────────────────────────────────────────
  // During GTP_ANSWERING and GTP_GUESSING, gtpRound describes the current prompt.
  // answerIndex tracks which answer we are currently showing (for guessing).
  gtpRound?: {
    promptText: string;
    mode: "prompt" | "fill_blank";
    answerIndex: number;
    totalAnswers: number;
    openedAt: string;
  };
  // During GTP_GUESSING: the answer text to guess (author hidden until REVEAL)
  gtpGuessing?: { answerText: string; openedAt: string };
  gtpReveal?: {
    answerPlayerId: string;
    answerText: string;
    guesses: { guesserId: string; guessedId: string }[];
    correctGuesserIds: string[];
    guesserPoints: number;
    writerPoints: number;
  };
  // ── shark tank ─────────────────────────────────────────────────────────────
  tankRound?: {
    pitcherId: string;
    productName: string;
    tagline: string;
    pitchStart: string;
    pitchSeconds: number;
  };
  tankReveal?: {
    pitcherId: string;
    productName: string;
    tagline: string;
    investments: { investorId: string; invested: boolean }[];
    investorCount: number;
    pitcherPoints: number;
  };
  // ── charades ───────────────────────────────────────────────────────────────
  charadesRound?: {
    actorId: string;
    category: string;
    actStart: string;
    actSeconds: number;
  };
  charadesReveal?: {
    actorId: string;
    word: string;
    winnerId: string | null;
    guesserPoints: number;
    actorPoints: number;
  };
  // ── number rating game ─────────────────────────────────────────────────────
  numRound?: {
    guesserPlayerId: string;
    theme: string;
    scaleLow: string;
    scaleHigh: string;
    openedAt: string;
  };
  numGuessing?: {
    examples: { playerId: string; exampleText: string }[];
    openedAt: string;
  };
  numReveal?: {
    guesserPlayerId: string;
    theme: string;
    scaleLow: string;
    scaleHigh: string;
    examples: {
      playerId: string;
      exampleText: string;
      actualNumber: number;
      guessedNumber: number | null;
      points: number;
    }[];
    guesserPoints: number;
  };
};

export type GameAction =
  | { type: "SELECT_HOST"; playerId: string }
  | { type: "START_GAME" }
  | { type: "DISPLAY_QUESTION" }
  | { type: "BUZZ_IN" }
  | { type: "MARK_CORRECT" }
  | { type: "MARK_INCORRECT" }
  | { type: "OPEN_ANSWER" }
  | { type: "SUBMIT_ANSWER"; text: string }
  | { type: "SUBMIT_STATEMENTS"; statements: string[] }
  | { type: "CAST_VOTE"; statementId: string }
  | { type: "SUBMIT_WYR"; choice: "a" | "b"; prediction: "a" | "b" }
  | { type: "SET_TEAM"; playerId: string; team: TeamId }
  | { type: "REVEAL_ROUND" }
  | { type: "NEXT_ROUND" }
  | { type: "SKIP_QUESTION" }
  | { type: "SHOW_SCOREBOARD" }
  | { type: "NEXT_QUESTION" }
  | { type: "END_GAME" }
  // most likely to
  | { type: "VOTE_MLT"; targetPlayerId: string }
  // higher or lower
  | { type: "VOTE_HOL"; vote: "higher" | "lower" }
  // guess the player
  | { type: "SUBMIT_GTP_ANSWER"; text: string }
  | { type: "GUESS_GTP_PLAYER"; playerId: string }
  // shark tank
  | { type: "SUBMIT_TANK_INVESTMENT"; invest: boolean }
  // charades
  | { type: "SUBMIT_CHARADES_GUESS"; text: string }
  // number rating game
  | { type: "SUBMIT_NUM_EXAMPLE"; text: string }
  | { type: "SUBMIT_NUM_GUESSES"; guesses: { playerId: string; number: number }[] };

export type GameActionType = GameAction["type"];

export type Actor =
  | { kind: "account_host" }
  | { kind: "player"; playerId: string; isHost: boolean };

// --- API response shapes -----------------------------------------------------

export type RoomStatePlayer = {
  id: string;
  username: string;
  avatarId: string;
  isHost: boolean;
  team: TeamId | null;
};

export type RoomStateResponse = {
  room: {
    id: string;
    code: string;
    status: "lobby" | "in_game" | "ended" | "expired";
    expiresAt: string;
  };
  players: RoomStatePlayer[];
  session: {
    id: string;
    gameType: GameType;
    state: SessionState;
    hostMode: "self" | "virtual";
    questionIndex: number;
    questionCount: number;
    currentPlayerId: string | null;
    payload: PublicPayload;
    settings: Pick<
      GameSettings,
      | "autoSkip"
      | "autoSkipSeconds"
      | "retriesEnabled"
      | "maxRetries"
      | "questionCount"
      | "variation"
      | "rounds"
      | "teamsEnabled"
      | "tankPitchSeconds"
    >;
  } | null;
  scores: { playerId: string; score: number }[];
  buzzes: { playerId: string; buzzOrder: number; usedAttempt: boolean }[];
  ttal: { submittedPlayerIds: string[]; votesIn: number; votersNeeded: number } | null;
  wyr: { submittedPlayerIds: string[] } | null;
  mlt: { submittedVoterIds: string[] } | null;
  hol: { submittedVoterIds: string[] } | null;
  gtp: { submittedPlayerIds: string[]; guessesIn: number; guessersNeeded: number } | null;
  tank: { investmentsIn: number; investorsNeeded: number } | null;
  charades: null; // placeholder; charades uses state transitions, not separate progress
  num: { submittedExampleIds: string[] } | null;
  me: {
    playerId: string;
    isHost: boolean;
    kicked: boolean;
    buzzOrder: number | null;
    hasSubmitted?: boolean;
    myVoteStatementId?: string | null;
    myMltVoteTarget?: string | null;
    myHolVote?: "higher" | "lower" | null;
    myGtpGuess?: string | null;
    myTankInvestment?: boolean | null;
    charadesWord?: string | null;
    myNumAssignment?: number | null;
  } | null;
};
