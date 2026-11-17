// AI host lines (PRD §12). The host only speaks at controlled moments. Lines
// come from OpenAI when configured, template fallbacks otherwise, and every
// generated line is moderated before it can reach voice generation (PRD §21).

import { chatComplete } from "./openai";
import { containsBlockedWord } from "@/lib/moderation";

export const HOST_MOMENTS = [
  "game_intro",
  "question_intro",
  "read_question",
  "buzz_received",
  "buzz_interrupted",
  "answer_correct",
  "answer_wrong",
  "answer_lore",
  "retry_next_player",
  "no_buzz_timeout",
  "show_answer",
  "scoreboard_reveal",
  "rank_rose",
  "rank_fell",
  "runaway_lead",
  "final_question",
  "game_over_winner",
  "game_over_tie",
  // two truths and a lie
  "ttal_collect_intro",
  "ttal_subject_intro",
  "ttal_statement_read",
  "ttal_reveal_intro",
  "ttal_reveal",
  // majority would you rather
  "wyr_question_intro",
  "wyr_reveal",
  // most likely to
  "mlt_round_intro",
  "mlt_reveal",
  // higher or lower
  "hol_round_intro",
  "hol_reveal",
  // guess the player
  "gtp_answering_intro",
  "gtp_guessing",
  "gtp_answer_reveal",
  // shark tank
  "tank_pitch_intro",
  "tank_invest",
  "tank_reveal",
  // charades
  "charades_round_intro",
  "charades_reveal",
  // number rating
  "num_round_intro",
  "num_guessing",
  "num_reveal",
] as const;

export type HostMoment = (typeof HOST_MOMENTS)[number];
export type HostPersonality = "pro" | "neutral" | "comedian" | "unhinged";

export type HostLineContext = {
  // which game is running, so shared moments (intro, scoreboard, game over)
  // never talk about the wrong game
  gameKind?: "trivia" | "ttal" | "wyr" | "mlt" | "hol" | "gtp" | "tank" | "charades" | "num";
  playerName?: string;
  points?: number;
  // what the player actually typed (public once judged), lets the host riff
  // on the answer itself: "Spider-Man? Bold choice. Also wrong."
  submittedAnswer?: string;
  questionNumber?: number;
  questionCount?: number;
  winnerNames?: string[];
  leaderName?: string;
  // Only ever set once the answer is publicly revealed (SHOW_ANSWER onward).
  revealedAnswer?: string;
  // Only ever set once the question is publicly displayed (BUZZ_OPEN onward);
  // read verbatim, never through the LLM.
  questionText?: string;
  // server-set description of what happens next
  situationHint?: string;
  // score / rank context (computed server-side)
  rankChange?: "rose" | "fell" | "same";
  previousRank?: number;
  newRank?: number;
  secondPlaceName?: string;
  leaderGap?: number;
  isUnstoppableLead?: boolean;
  isTie?: boolean;
  // two truths and a lie
  variationWord?: "lie" | "truth";
  caughtCount?: number;
  fooledCount?: number;
  revealedStatement?: string;
  statementText?: string;
  statementLabel?: string;
  // would you rather
  optionA?: string;
  optionB?: string;
  majorityOption?: string;
  wyrMajorityVotes?: number; // actual votes for the winning option (not predictors)
  wyrTimedOut?: boolean; // true when nobody voted before the timer ran out
  // most likely to
  mltPrompt?: string;
  mltTopPlayerName?: string;
  mltVoteCount?: number;
  // higher or lower
  holLeftLabel?: string;
  holLeftValue?: number | null;
  holLeftUnit?: string;
  holLeftCategory?: string;
  holRightLabel?: string;
  holRightUnit?: string;
  holRightCategory?: string;
  holRightValue?: number;
  holCorrectAnswer?: "higher" | "lower";
  holCorrectVoterCount?: number;
  // guess the player
  gtpPromptText?: string;
  gtpAnswerText?: string;
  gtpAuthorName?: string;
  gtpCorrectGuesserCount?: number;
  // shark tank
  tankPitcherName?: string;
  tankProductName?: string;
  tankTagline?: string;
  tankInvestorCount?: number;
  tankPitcherPoints?: number;
  // charades
  charadesActorName?: string;
  charadesCategory?: string;
  charadesWord?: string;
  charadesWinnerName?: string;
  // number rating
  numGuesserName?: string;
  numTheme?: string;
  numScaleLow?: string;
  numScaleHigh?: string;
  numGuesserPoints?: number;
};

const MAX_LINE_LENGTH = 160;

// Per-personality system prompts. The neutral prompt is the original.
const SYSTEM_PROMPTS: Record<HostPersonality, string> = {
  neutral:
    "You are the upbeat host of a live party game show for all ages. Write ONE short spoken line (max 18 words) for the given moment. Rules: PG-safe, no swearing, no insults about identity or appearance, no rambling, never reveal or hint at hidden answers, use the player's name naturally if given, keep the game moving. If the facts include what the player answered, your line MUST quote or riff on their exact answer (e.g. 'Ooh, Spider-Man was not it!'). The line is read aloud by text-to-speech: plain spoken words only, absolutely no emojis, no asterisks, no stage directions, no formatting. Output only the line itself.",
  pro:
    "You are a sharp, dry, authoritative game show host. Confident, controlled, never goofy. Minimal words, maximum impact. Write ONE spoken line (max 18 words). Rules: PG-safe, never reveal hidden answers, use player name if given, riff on their submitted answer if provided. Plain spoken words only, no emojis, no formatting. Output only the line.",
  comedian:
    "You are a comedian game show host. Everything is funnier than it needs to be. Absurdist riffs, self-deprecating asides, pop culture tangents, unexpected comparisons. Write ONE spoken line (max 18 words). Rules: PG-safe, never reveal hidden answers, use player name if given, riff wildly on their submitted answer if provided. Plain spoken words only, no emojis, no formatting. Output only the line.",
  unhinged:
    "You are a chaotic, unhinged game show host with strong opinions and a loose grip on reality. You overshare personal disasters, invent conspiracy theories about game outcomes, and go on wildly off-topic tangents before snapping back. PG-13 max: sarcasm and mild crudeness allowed, no slurs or explicit content. Write ONE spoken line (max 18 words). Never reveal hidden answers. Use player name if given. Plain spoken words only, no emojis, no formatting. Output only the line.",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// Add "the" before descriptive noun phrases; leave proper names alone.
// Heuristic: if label already has an article, or is a route ("X to Y"), skip.
// Otherwise add "the" when it contains a preposition or has a lowercase word
// after the first character (signals a descriptive phrase, not a proper name).
function withArticle(label: string): string {
  if (/^(a|an|the)\s/i.test(label)) return label;
  if (label.includes(" to ")) return label;
  if (/\b(of|on|in|at|per|from)\b/.test(label) || /\s[a-z]/.test(label))
    return `the ${label}`;
  return label;
}

// Produce a grammatically natural "[label] is/has/weighs N unit" sentence
// per category so templates don't output "Vatican City is 800 people".
function holValueLine(label: string, value: number, unit: string, category?: string): string {
  const n = value.toLocaleString();
  const l = withArticle(label);
  switch (category) {
    // "there are 13 stripes on the US flag" is more natural than "[label] — there are 13"
    case "count":      return `there are ${n} ${label.charAt(0).toLowerCase() + label.slice(1)}`;
    case "population": return `${l} has ${n} ${unit}`;
    case "speed":      return `${l} reaches ${n} ${unit}`;
    case "price":      return `${l} costs ${n} ${unit}`;
    case "weight":     return `${l} weighs ${n} ${unit}`;
    case "distance":   return `${l} covers ${n} ${unit}`;
    case "height":     return `${l} stands ${n} ${unit}`;
    default:           return `${l} is ${n} ${unit}`;
  }
}

// First-round intro (both values hidden): phrase naturally per category,
// or fall back to generic "higher or lower" if categories differ.
function holFirstRoundLine(
  leftLabel: string, leftUnit: string, leftCat: string | undefined,
  rightLabel: string, rightUnit: string, rightCat: string | undefined,
  variant: 1 | 2
): string {
  const L = withArticle(leftLabel);
  const R = withArticle(rightLabel);
  if (leftCat && leftCat === rightCat) {
    const vs = variant === 1 ? `${L} versus ${R}` : `${R} versus ${L}`;
    switch (leftCat) {
      case "count":      return `${vs} — which count is higher? Vote!`;
      case "population": return `${vs} — which has more people? Vote!`;
      case "speed":      return `${vs} — which is faster? Vote higher or lower!`;
      case "height":     return `${vs} — which is taller? Vote!`;
      case "price":      return `${vs} — which costs more? Vote!`;
      case "weight":     return `${vs} — which is heavier? Vote!`;
      case "distance":   return `${vs} — which is longer? Vote!`;
      case "age":        return `${vs} — which is older? Vote!`;
    }
  }
  return variant === 1
    ? `${L} in ${leftUnit} versus ${R} in ${rightUnit}. Higher or lower? Vote!`
    : `Compare ${L} in ${leftUnit} against ${R} in ${rightUnit}. Vote higher or lower!`;
}

// Deterministic-ish fallbacks so virtual host works with no API key.
const TEMPLATES: Record<HostMoment, ((c: HostLineContext) => string)[]> = {
  game_intro: [
    (c) => {
      if (c.gameKind === "ttal") return `Two Truths and a Lie is ON! Write your three statements — make that ${c.variationWord ?? "lie"} so convincing nobody sees it coming!`;
      if (c.gameKind === "wyr") return "Would You Rather time! Pick a side, call the majority, and score big for reading the room!";
      if (c.gameKind === "mlt") return "Most Likely To is LIVE! A prompt hits the screen, you vote for who fits it best — agree with the group and score!";
      if (c.gameKind === "hol") return "Higher or Lower, let's GO! Two items, one question — which number is bigger? Vote on your phones!";
      if (c.gameKind === "gtp") return "Guess the Player is here! Answer anonymously, then figure out who wrote each one — it's trickier than you think!";
      if (c.gameKind === "tank") return "The Tank is OPEN! Pitch your product, win over investors, and cash in on the points!";
      if (c.gameKind === "charades") return "Charades time! One player acts it out, everyone else types guesses on their phones. First to get it wins!";
      if (c.gameKind === "num") return "Number Crunch! Everyone gets a secret number — submit an example, then the guesser tries to rank you all. Good luck hiding!";
      return "Let's play some trivia! Buzz in first, answer right, and do NOT let anyone steal your points!";
    },
    (c) => {
      if (c.gameKind === "ttal") return `Phones out! Write two truths and a ${c.variationWord ?? "lie"} about yourself. The sneakier the ${c.variationWord ?? "lie"}, the better you score!`;
      if (c.gameKind === "wyr") return "It's Would You Rather! Make your choice and call the majority. Let's see who actually knows this group!";
      if (c.gameKind === "mlt") return "Most Likely To! Each prompt has a winner — vote for the right person and score. Let's see who the group picks!";
      if (c.gameKind === "hol") return "Higher or Lower! Ten rounds, two items each. Trust your gut and vote. Let's find out who really pays attention!";
      if (c.gameKind === "gtp") return "It's Guess the Player! No names on the answers — but everyone is hiding in plain sight. Good luck staying anonymous!";
      if (c.gameKind === "tank") return "Shark Tank is GO! Pitch hard, vote smart, and earn points for every investor you win over!";
      if (c.gameKind === "charades") return "It's Charades! No words, no hints — pure acting. Guess it first on your phone and score for you AND the actor!";
      if (c.gameKind === "num") return "Number Crunch time! Your number is secret, your example is the only clue. Try to fool the guesser — or be the best guesser in the room!";
      return "Trivia time! Fingers ready, brains on. Buzz in first, type fast, and stack those points!";
    },
    (c) => {
      if (c.gameKind === "ttal") return `Alright everyone, craft your ${c.variationWord ?? "lie"} carefully! The room is about to judge your honesty. Good luck!`;
      if (c.gameKind === "wyr") return "Would You Rather — where the wrong choice costs you! Pick your side and call the room's majority on your phones!";
      if (c.gameKind === "mlt") return "Who is MOST LIKELY TO? Vote on your phones, back the winner, and rack up points when the group agrees with you!";
      if (c.gameKind === "hol") return "It's Higher or Lower! All you need is intuition and a little luck. Vote fast, and let's build that chain!";
      if (c.gameKind === "gtp") return "Guess the Player! Everyone answers the same prompt secretly. Then one by one, we find out who said what. Try not to be obvious!";
      if (c.gameKind === "tank") return "Welcome to the Tank! Every pitcher needs investors — vote wisely, pitch boldly, and let's see who the real sharks are!";
      if (c.gameKind === "charades") return "Charades is starting! Actor, get ready. Everyone else, type fast — first correct guess on your phone wins the round!";
      if (c.gameKind === "num") return "It's Number Crunch! You have a secret number on a scale. Submit something that fits — but can the guesser crack your code?";
      return "Alright, trivia is starting! Buzz in fast, think even faster, and don't overthink it. First instinct wins!";
    },
  ],
  question_intro: [
    (c) => `Question ${c.questionNumber ?? "next"}, here it comes!`,
    (c) => `Alright, question ${c.questionNumber ?? "time"}. Eyes on the screen!`,
  ],
  read_question: [(c) => c.questionText ?? "Read it on the screen!"],
  buzz_received: [
    (c) => `Ooh! Let's see what ${c.playerName ?? "you"}'ve got!`,
    (c) => `${c.playerName ?? "They"}'re first! Type it out!`,
    (c) => `${c.playerName ?? "They"} jumped on it! What's the answer?`,
    (c) => `Yes! ${c.playerName ?? "Someone"}'s on it, let's hear it!`,
    (c) => `${c.playerName ?? "A player"}'s got the buzzer! Type fast!`,
  ],
  buzz_interrupted: [
    (c) => `${c.playerName ?? "Someone"} didn't even let me finish!`,
    (c) => `${c.playerName ?? "They"} cut me off — go ahead then!`,
    () => "We're in a hurry, are we? Let's hear it!",
    (c) => `${c.playerName ?? "They"} could not wait. Floor is yours!`,
    () => "Can't even finish a sentence around here. Go!",
    (c) => `Bold move, ${c.playerName ?? "friend"}. What have you got?`,
    () => "Mid-sentence! Fine. What is it?",
    (c) => `${c.playerName ?? "They"} have zero patience. I love it. Go!`,
  ],
  answer_correct: [
    (c) =>
      c.submittedAnswer
        ? `"${c.submittedAnswer}" is exactly right, ${c.points ?? 0} points, ${c.playerName ?? "player"}!`
        : `${c.playerName ?? "That"} nails it for ${c.points ?? 0} points!`,
    (c) => `Correct! ${c.playerName ?? "Our player"} banks ${c.points ?? 0} points.`,
  ],
  answer_wrong: [
    (c) =>
      c.submittedAnswer
        ? `Ooh, "${c.submittedAnswer}" was not the right answer, ${c.playerName ?? "friend"}!`
        : `Ooh, not it, ${c.playerName ?? "friend"}.`,
    (c) => `That's a no. Tough break, ${c.playerName ?? "player"}!`,
  ],
  answer_lore: [
    (c) => c.revealedAnswer ? `${c.revealedAnswer}. Wild one. Let's keep moving.` : "And there you have it. Moving on.",
    (c) => c.revealedAnswer ? `The answer was ${c.revealedAnswer}. There's actually a whole story there. Maybe later.` : "Interesting stuff. Moving on.",
  ],
  retry_next_player: [
    (c) => `The steal is on, ${c.playerName ?? "next buzzer"}, you're up!`,
    (c) => `${c.playerName ?? "Next in line"}, show them how it's done!`,
  ],
  no_buzz_timeout: [
    () => "Time is up! Nobody's taking that one.",
    () => "Crickets! Let's see what it was.",
  ],
  show_answer: [
    (c) => (c.revealedAnswer ? `The answer was ${c.revealedAnswer}.` : "Here's the answer."),
  ],
  scoreboard_reveal: [
    (c) =>
      c.isUnstoppableLead && c.leaderName
        ? `${c.leaderName} is basically untouchable at this point.`
        : c.isTie
          ? "It's a tie at the top — anyone's game right now!"
          : c.leaderName
            ? `Let's see the scores — ${c.leaderName} is in the lead!`
            : "Let's check the scores!",
    (c) =>
      c.isUnstoppableLead && c.leaderName
        ? `${c.leaderName} has this locked, honestly.`
        : c.leaderName
          ? `${c.leaderName} out front — for now! Who's coming for them?`
          : "Drumroll please — here come the scores!",
    (c) =>
      c.isTie
        ? "Tied at the top! This is anybody's game!"
        : c.leaderName
          ? `Eyes on the board — can anyone catch ${c.leaderName}?`
          : "Eyes on the board — scores are up!",
    (c) =>
      c.isUnstoppableLead && c.leaderName
        ? `Mathematically, ${c.leaderName} might have this won already.`
        : c.leaderName
          ? `${c.leaderName} is sitting pretty up top. For now!`
          : "Let's see where everybody stands!",
    () => "Scoreboard time! Let's see who's making moves!",
  ],
  rank_rose: [
    (c) =>
      c.newRank === 1 && c.isTie
        ? `${c.playerName ?? "They"} just tied for the lead!`
        : c.newRank === 1
          ? `${c.playerName ?? "They"} just took the lead!`
          : c.playerName && c.secondPlaceName
            ? `${c.playerName} just passed ${c.secondPlaceName}!`
            : `${c.playerName ?? "They"} are climbing!`,
    (c) =>
      c.newRank === 1 && c.isTie
        ? `${c.playerName ?? "Someone"} pulls into a tie at the top!`
        : c.newRank === 1
          ? `New leader alert, ${c.playerName ?? "someone"} is on top!`
          : c.playerName
            ? `${c.playerName} moves up to ${ordinal(c.newRank ?? 2)}!`
            : "New position on the board!",
  ],
  rank_fell: [
    (c) =>
      c.playerName && c.secondPlaceName
        ? `${c.secondPlaceName} just passed ${c.playerName}!`
        : c.playerName
          ? `${c.playerName} slips to ${ordinal(c.newRank ?? 2)}.`
          : "Someone just slipped down the board.",
    (c) =>
      c.playerName
        ? `Ooh, ${c.playerName} drops to ${ordinal(c.newRank ?? 2)}.`
        : "The standings just shifted!",
  ],
  runaway_lead: [
    (c) => c.leaderName ? `Honestly, ${c.leaderName} might just have this.` : "One player is way out in front.",
    (c) => c.leaderName ? `Unless something wild happens, ${c.leaderName} has this locked.` : "The lead is looking very comfortable right now.",
    (c) => c.leaderName ? `${c.leaderName} is in a different timezone right now.` : "The leader is way, way ahead.",
  ],
  final_question: [
    (c) =>
      c.isUnstoppableLead && c.leaderName
        ? `Final question. Doesn't really matter — ${c.leaderName} already has this.`
        : "Final question, everything's on the line!",
    (c) =>
      c.isUnstoppableLead && c.leaderName
        ? `Last one. Unless math works differently tonight, ${c.leaderName} wins.`
        : "Last question, make it count!",
  ],
  game_over_winner: [
    (c) => `Game over! ${c.winnerNames?.[0] ?? "Our champion"} wins! Give it up!`,
    (c) => `That's the game! ${c.winnerNames?.[0] ?? "The winner"} takes the crown — incredible!`,
    (c) => `And THAT is game! ${c.winnerNames?.[0] ?? "Our winner"} comes out on top. What a performance!`,
    (c) => `${c.winnerNames?.[0] ?? "Our champion"} is your winner! Well played, everyone. Give it up!`,
  ],
  game_over_tie: [
    (c) => `It's a TIE! ${(c.winnerNames ?? []).join(" and ") || "Our champions"} share the crown — both winners tonight!`,
    (c) => `Would you look at that — a perfect tie! ${(c.winnerNames ?? []).join(" and ") || "These two"} are co-champions!`,
  ],
  ttal_collect_intro: [
    (c) =>
      `Time to get sneaky! Write your three statements and make that ${c.variationWord ?? "lie"} so convincing nobody sees it coming!`,
    (c) => `Phones out! Two truths, one ${c.variationWord ?? "lie"} — write them now and don't make it too obvious!`,
    (c) => `Alright, crafting time! Everyone write three statements about themselves. The sneakier your ${c.variationWord ?? "lie"}, the more you score!`,
  ],
  ttal_subject_intro: [
    (c) =>
      `${c.playerName ?? "Our next player"}'s statements are on the board, everyone else, sniff out the ${c.variationWord ?? "lie"} and vote!`,
    (c) =>
      `Time to judge ${c.playerName ?? "our next player"}! Which one is the ${c.variationWord ?? "lie"}? Lock in your votes!`,
  ],
  ttal_statement_read: [
    (c) =>
      c.statementText
        ? `${c.statementLabel ? `${c.statementLabel}. ` : ""}${c.statementText}`
        : "Read them on the screen!",
  ],
  ttal_reveal_intro: [
    () => "The votes are locked — here comes the truth!",
    () => "Moment of truth! Did you spot the fake?",
    () => "Results coming up! Let's see who fooled who!",
    () => "Voting is done! Time to find out who outsmarted who!",
  ],
  ttal_reveal: [
    (c) => {
      const name = c.playerName ?? "our subject";
      const fooled = c.fooledCount ?? 0;
      const caught = c.caughtCount ?? 0;
      const word = c.variationWord ?? "lie";
      if (fooled > 0 && caught > 0)
        return `${name}, you fooled ${fooled}, but ${caught} caught your ${word}!`;
      if (fooled > 0) return `${name}, you fooled everyone! Nobody spotted your ${word}!`;
      return `Nobody fell for it, ${name}, everyone caught your ${word}!`;
    },
  ],
  wyr_question_intro: [
    (c) => `Would you rather ${c.optionA ?? "option A"}, or ${c.optionB ?? "option B"}? Lock in your pick and call the majority!`,
    (c) => `Tough one! ${c.optionA ?? "Option A"}… or ${c.optionB ?? "option B"}? Answer on your phones!`,
  ],
  wyr_reveal: [
    (c) =>
      c.wyrTimedOut
        ? "Time's up! Looks like some people didn't want to answer — no majority, no points!"
        : c.isTie
          ? "Perfect split! Half and half — no majority, no points. You're all chaos."
          : c.majorityOption
            ? `The majority went with ${c.majorityOption}! ${c.wyrMajorityVotes ?? 0} chose it, and ${c.caughtCount ?? 0} called it right.`
            : "Votes are in — let's see the split!",
    (c) =>
      c.wyrTimedOut
        ? "Oops, looks like some people didn't want to answer. No points this round!"
        : c.isTie
          ? "Dead even! You're impossible to predict and nobody scores this round."
          : c.majorityOption
            ? `${c.majorityOption} takes the majority with ${c.wyrMajorityVotes ?? 0} votes! ${c.caughtCount ?? 0} players read the room.`
            : "Let's see how the room voted!",
  ],
  mlt_round_intro: [
    (c) => `Who is most likely to ${c.mltPrompt ?? "..."}? Vote on your phones!`,
    (c) => `Here's a spicy one, ${c.mltPrompt ?? "..."}! Pick your person!`,
    (c) => `Hot prompt! ${c.mltPrompt ?? "..."}. Vote for who fits best!`,
  ],
  mlt_reveal: [
    (c) =>
      c.mltTopPlayerName
        ? `And the group has spoken — ${c.mltTopPlayerName} is most likely to ${c.mltPrompt ?? "..."}! ${c.mltVoteCount ?? 0} votes!`
        : "Total tie! No winner, no points, nobody agrees on anything this round!",
    (c) =>
      c.mltTopPlayerName
        ? `${c.mltTopPlayerName} wins this one! Most likely to ${c.mltPrompt ?? "..."}. ${c.mltVoteCount ?? 0} people said so!`
        : "Split decision! You all voted differently — no points this round.",
    (c) =>
      c.mltTopPlayerName
        ? `${c.mltVoteCount ?? 0} votes for ${c.mltTopPlayerName}! Most likely to ${c.mltPrompt ?? "..."}. Does anyone want to defend themselves?`
        : "No clear winner! Completely tied — nobody scores.",
  ],
  hol_round_intro: [
    (c) => {
      if (c.holLeftValue == null)
        return holFirstRoundLine(c.holLeftLabel!, c.holLeftUnit!, c.holLeftCategory, c.holRightLabel!, c.holRightUnit!, c.holRightCategory, 1);
      const left = holValueLine(c.holLeftLabel!, c.holLeftValue, c.holLeftUnit!, c.holLeftCategory);
      const rightHint = c.holLeftCategory !== c.holRightCategory ? ` in ${c.holRightUnit}` : "";
      return `${left}. Is ${withArticle(c.holRightLabel!)}${rightHint} higher or lower? Vote!`;
    },
    (c) => {
      if (c.holLeftValue == null)
        return holFirstRoundLine(c.holLeftLabel!, c.holLeftUnit!, c.holLeftCategory, c.holRightLabel!, c.holRightUnit!, c.holRightCategory, 2);
      const left = holValueLine(c.holLeftLabel!, c.holLeftValue, c.holLeftUnit!, c.holLeftCategory);
      const rightHint = c.holLeftCategory !== c.holRightCategory ? ` in ${c.holRightUnit}` : "";
      return `${left}. Now vote: ${withArticle(c.holRightLabel!)}${rightHint} — higher or lower?`;
    },
  ],
  hol_reveal: [
    (c) => {
      const val = holValueLine(c.holRightLabel!, c.holRightValue!, c.holRightUnit!, c.holRightCategory);
      const count = c.holCorrectVoterCount ?? 0;
      return `${val}! That's ${c.holCorrectAnswer}! ${count === 0 ? "Nobody got it right!" : count === 1 ? "Only one player scored!" : `${count} players nailed it!`}`;
    },
    (c) => {
      const val = holValueLine(c.holRightLabel!, c.holRightValue!, c.holRightUnit!, c.holRightCategory);
      const count = c.holCorrectVoterCount ?? 0;
      const dir = c.holCorrectAnswer === "higher" ? "Higher" : "Lower";
      return `${dir}! ${val}. ${count === 0 ? "Tough one — nobody scored!" : `${count} of you got it right!`}`;
    },
    (c) => {
      const val = holValueLine(c.holRightLabel!, c.holRightValue!, c.holRightUnit!, c.holRightCategory);
      const count = c.holCorrectVoterCount ?? 0;
      return `And ${val}! The answer was ${c.holCorrectAnswer}. ${count > 0 ? `Nice — ${count} scored!` : "Zero points this round!"}`;
    },
  ],
  gtp_answering_intro: [
    (c) => `${c.gtpPromptText ?? "Answer the prompt"}, type something on your phones! Stay anonymous for now!`,
    (c) => `Here's your prompt: ${c.gtpPromptText ?? "..."}. Answer on your phones, nobody knows who said what yet!`,
  ],
  gtp_guessing: [
    (c) => `"${c.gtpAnswerText ?? "..."}", who wrote this? Guess on your phones!`,
    (c) => `Someone said "${c.gtpAnswerText ?? "..."}". Who was it? Pick your suspect!`,
  ],
  gtp_answer_reveal: [
    (c) => {
      const count = c.gtpCorrectGuesserCount ?? 0;
      return `That was ${c.gtpAuthorName ?? "a mystery player"}! ${count === 0 ? "Nobody spotted them — great hiding!" : `${count} of you figured it out!`}`;
    },
    (c) =>
      c.gtpCorrectGuesserCount
        ? `${c.gtpAuthorName ?? "Our writer"} revealed! ${c.gtpCorrectGuesserCount} clever guesser${c.gtpCorrectGuesserCount !== 1 ? "s" : ""} cracked it!`
        : `${c.gtpAuthorName ?? "Our writer"} revealed — and nobody guessed right! Perfectly anonymous!`,
    (c) => {
      const count = c.gtpCorrectGuesserCount ?? 0;
      return count === 0
        ? `${c.gtpAuthorName ?? "Our writer"} stayed hidden! Zero correct guesses — maximum points for the author!`
        : `${c.gtpAuthorName ?? "Our writer"} is out! ${count} player${count !== 1 ? "s" : ""} spotted them.`;
    },
  ],
  tank_pitch_intro: [
    (c) => `The Tank is open! ${c.tankPitcherName ?? "Our pitcher"} is selling ${c.tankProductName ?? "something"} — "${c.tankTagline ?? "..."}". Listen close before you vote!`,
    (c) => `${c.tankPitcherName ?? "Our pitcher"} steps into the Tank with ${c.tankProductName ?? "their product"}! "${c.tankTagline ?? "..."}". Invest or pass?`,
    (c) => `Eyes on ${c.tankPitcherName ?? "our pitcher"}! They're pitching ${c.tankProductName ?? "something"} — "${c.tankTagline ?? "..."}". Will it land?`,
  ],
  tank_invest: [
    (c) => `The pitch is done! Will you invest in ${c.tankProductName ?? "this"}? Decide on your phones now!`,
    () => "Invest or pass? This is your moment — lock in your vote on your phones!",
    () => "Voting time! Back the pitch or fold? Make your call on your phones!",
  ],
  tank_reveal: [
    (c) =>
      c.tankInvestorCount && c.tankInvestorCount > 0
        ? `${c.tankInvestorCount} investor${c.tankInvestorCount !== 1 ? "s" : ""} said YES! ${c.tankPitcherName ?? "The pitcher"} earns ${c.tankPitcherPoints ?? 0} points — the pitch worked!`
        : `No investors! ${c.tankPitcherName ?? "Our pitcher"} walks away empty-handed this round. Tough crowd!`,
    (c) =>
      c.tankInvestorCount && c.tankInvestorCount > 0
        ? `${c.tankPitcherName ?? "The pitcher"} landed ${c.tankInvestorCount} investment${c.tankInvestorCount !== 1 ? "s" : ""}! That's ${c.tankPitcherPoints ?? 0} points banked!`
        : `Nobody bit on that pitch. Zero points for ${c.tankPitcherName ?? "our pitcher"} this round. Better luck next time!`,
  ],
  charades_round_intro: [
    (c) => `${c.charadesActorName ?? "Our actor"} is up! They're acting something in ${c.charadesCategory ?? "..."}. No talking — type your guesses on your phones!`,
    (c) => `Eyes on ${c.charadesActorName ?? "our actor"}! Something in ${c.charadesCategory ?? "..."} is coming. First to type the right answer on their phone wins!`,
    (c) => `${c.charadesActorName ?? "Our actor"} has their word! Category is ${c.charadesCategory ?? "..."}. Everyone else — type fast and guess it first!`,
  ],
  charades_reveal: [
    (c) =>
      c.charadesWinnerName
        ? `${c.charadesWinnerName} got it — the word was ${c.charadesWord ?? "..."}! Great acting, great guessing!`
        : `Time's up! The word was ${c.charadesWord ?? "..."}. Nobody cracked it this round!`,
    (c) =>
      c.charadesWinnerName
        ? `${c.charadesWord ?? "..."}! ${c.charadesWinnerName} nailed it! Points for the guesser AND the actor!`
        : `Nobody guessed ${c.charadesWord ?? "..."}! Tough round for ${c.charadesActorName ?? "our actor"} — zero points!`,
    (c) =>
      c.charadesWinnerName
        ? `${c.charadesWinnerName} wins the round with ${c.charadesWord ?? "..."}! They and ${c.charadesActorName ?? "the actor"} both score!`
        : `${c.charadesWord ?? "..."} — nobody got it! ${c.charadesActorName ?? "Our actor"} gave it their best shot!`,
  ],
  num_round_intro: [
    (c) => `${c.numGuesserName ?? "Our guesser"} has the theme but NOT the numbers! Everyone else — think about your secret number and submit an example. Keep it tricky!`,
    (c) => `Theme: ${c.numTheme ?? "..."}! 1 is ${c.numScaleLow ?? "lowest"}, 10 is ${c.numScaleHigh ?? "highest"}. Everyone except ${c.numGuesserName ?? "the guesser"} — submit your example now!`,
    (c) => `${c.numGuesserName ?? "Our guesser"} is in the dark! Everyone else has a secret number 1 to 10 — submit something that fits your spot on the scale without giving it away!`,
  ],
  num_guessing: [
    (c) => `All examples are in! ${c.numGuesserName ?? "Our guesser"}, now rank them. 1 is ${c.numScaleLow ?? "lowest"}, 10 is ${c.numScaleHigh ?? "highest"}. Figure out everyone's number!`,
    (c) => `${c.numGuesserName ?? "Our guesser"} sees the examples — but can they crack the code? Assign a number to each one on your phone!`,
    (c) => `Time for ${c.numGuesserName ?? "our guesser"} to put the pieces together! Rate each example 1 to 10 and try to match everyone's secret number!`,
  ],
  num_reveal: [
    (c) => {
      const pts = c.numGuesserPoints ?? 0;
      return `${c.numGuesserName ?? "Our guesser"} scored ${pts} points! ${pts >= 80 ? "Incredible accuracy!" : pts >= 50 ? "Pretty solid!" : "Tough round for them!"} Let's see how they did!`;
    },
    (c) => {
      const pts = c.numGuesserPoints ?? 0;
      return `Results are in! ${c.numGuesserName ?? "Our guesser"} earned ${pts} points on accuracy. ${pts >= 80 ? "That's impressive!" : pts === 0 ? "Ouch — zero points!" : "Let's see the breakdown!"}`;
    },
  ],
};

function templateLine(moment: HostMoment, context: HostLineContext): string {
  const variants = TEMPLATES[moment];
  const pick = variants[Math.floor(Math.random() * variants.length)];
  return pick(context);
}

// Moments worth a live LLM line. The new context-aware moments all benefit
// from LLM commentary; scoreboard and final_question get LLM for personality.
const LIVE_MOMENTS: HostMoment[] = [
  "buzz_received",
  "buzz_interrupted",
  "answer_correct",
  "answer_wrong",
  "answer_lore",
  "retry_next_player",
  "scoreboard_reveal",
  "rank_rose",
  "rank_fell",
  "runaway_lead",
  "final_question",
  "game_over_winner",
  "game_over_tie",
  "ttal_subject_intro",
  "ttal_reveal",
  "wyr_reveal",
  "mlt_round_intro",
  "mlt_reveal",
  "gtp_answer_reveal",
  "tank_reveal",
  "charades_reveal",
  "num_reveal",
];

// Lines go straight to the caption AND to text-to-speech, so anything that
// isn't plain spoken text gets scrubbed.
function sanitize(line: string): string {
  return line
    .replace(/\*[^*]*\*/g, " ")
    .replace(/[_`#>~|]/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MOMENT_BRIEFS: Partial<Record<HostMoment, string>> = {
  buzz_received:
    "X just slammed the buzzer and is locked in first. The screen already shows they buzzed, so NEVER say 'X buzzed in' or 'X is on the buzzer' — that's stating the obvious. Instead: a quick energetic reaction ('Ooh!', 'Yes!', 'Let's go!') then immediately prompt them to type their answer. Max 10 words. Examples: 'Ooh, let's see it, Parm!', 'Yes! What have you got, Parm?', 'Parm's on it, type fast!'",
  buzz_interrupted:
    "A player buzzed and cut you off mid-sentence. React with mock exasperation or playful disbelief — vary your reaction so it feels fresh each time. Options: surprise ('Can't even finish!'), sarcastic deference ('Oh, by all means!'), amused frustration ('Zero patience. Go!'). Keep it short.",
  retry_next_player:
    "The previous player got this same on-screen question wrong; this player buzzed and now gets to steal it. Hand them the floor and prompt for their answer. Do not introduce or move to a new question.",
  answer_correct: "The player's typed answer was just judged correct.",
  answer_wrong:
    "The player's typed answer was just judged wrong. React with sympathy or playful teasing about the miss (like 'you'll get the next one'), NEVER praise them or say things like 'keep up that energy'. Don't reveal the real answer.",
  answer_lore:
    "The question answer was just publicly revealed. Your job: say ONE brief dry or absurd personal anecdote or tangent about that answer itself — not about the question or the players. It should feel like you briefly lost the thread — a weird non-sequitur, then drop it fast ('let's move on' or similar). Example: if the answer was 'Ohio', say 'I got banned from Ohio, long story, let's keep it moving.' If 'Napoleon', maybe 'Napoleon and I would not have gotten along, trust me.' Stay under 18 words. Never be educational or literal — be weird and brief.",
  scoreboard_reveal:
    "Scores are on screen. Comment on the standings. If the leader cannot be caught (isUnstoppableLead is true), acknowledge it with the leader's name — wryly, not cruelly. If a player just changed rank (rankChange is rose or fell), riff on that. If it's close, build tension. Under 18 words.",
  rank_rose:
    "A player just climbed a rank on the scoreboard. Celebrate the rise — name the player, mention the new position or who they just passed. If isTie is true and newRank is 1, say they're tied for the lead, not that they 'took' it. Keep it punchy.",
  rank_fell:
    "A player just dropped a rank on the scoreboard. Commiserate or tease gently — name the player, mention the drop or who overtook them. Keep it punchy.",
  runaway_lead:
    "The current leader's point gap is larger than the total points remaining in the game — nobody can catch them. Comment on the insurmountable lead naturally, using the leader's name. Under 18 words. The game still has to finish, so don't end it.",
  final_question:
    "This is the last question of the game. Build anticipation. If the leader cannot be caught (isUnstoppableLead is true), acknowledge it semi-sarcastically with their name — something like 'final question, doesn't really matter, X already has this.' Otherwise stress that everything is on the line. Under 18 words.",
  ttal_subject_intro:
    "The named player's three statements just went up on the big screen and you will read them aloud next. Speak to the OTHER players, not to the named player: challenge the group to figure out which of the named player's statements is the fake one and vote on their phones. Give the named player no instructions, they just sit tight and keep a straight face.",
  ttal_reveal:
    "Voting is over and the odd statement was just revealed on screen. Speak TO the subject by name: tell them how many players they fooled and how many caught them (e.g. 'you fooled 1, but 1 caught your lie'). Never mention points or scores. Don't ask anyone to do anything.",
  game_over_winner:
    "The whole game just ended and the named player has the top score across every round. Celebrate their overall victory, never describe a single-round action (like spotting one lie or answering one question) as the reason they won.",
  game_over_tie:
    "The whole game just ended with the named players tied for the top score across every round. Celebrate the shared victory, never describe a single-round action as the reason they won.",
  wyr_reveal:
    "The voting results for Would You Rather are shown. wyrMajorityVotes = how many people actually CHOSE the majority option. caughtCount = how many correctly PREDICTED the majority (a separate number — never confuse them). If wyrTimedOut is true, say the time ran out and some people didn't answer. Otherwise if isTie say nobody scored. Otherwise announce the majority option and how many CHOSE it (wyrMajorityVotes), plus how many PREDICTED it (caughtCount). Under 18 words.",
  mlt_round_intro:
    "Read the prompt to the room: say 'Most likely to [prompt text]' then tell everyone to vote on their phones. Keep it punchy, one sentence.",
  mlt_reveal:
    "Votes are revealed. Announce who the group voted as most likely and how many votes they got. If it's a tie, say so. React to the winner naturally, they're sitting right there! End with something like 'if you voted for them, you just scored!'",
  gtp_answer_reveal:
    "The author of the anonymous answer was just revealed on screen. Announce who wrote it and how many players guessed correctly. Keep it playful.",
  tank_reveal:
    "The Shark Tank investment votes are in. Announce how many players invested and how many points the pitcher earned. If nobody invested, commiserate. Keep it punchy.",
  charades_reveal:
    "The charades round just ended. The word is now revealed on screen. Announce who guessed it (or that nobody got it). React to the actor's performance.",
  num_reveal:
    "The number guessing reveal is done, all actual numbers and guesses are shown. Announce how many points the guesser earned for their accuracy. Be encouraging about their performance.",
};

export async function generateHostLine(
  moment: HostMoment,
  context: HostLineContext,
  personality: HostPersonality = "neutral"
): Promise<{ text: string; source: "llm" | "template" }> {
  const fallback = templateLine(moment, context);
  if (!LIVE_MOMENTS.includes(moment)) return { text: fallback, source: "template" };

  const gameFact =
    context.gameKind === "ttal"
      ? `The game is Two Truths and a Lie: each player wrote statements about themselves and the others guess which is the ${context.variationWord ?? "lie"}. Players score over many rounds by catching others' ${context.variationWord ?? "lie"}s AND by fooling voters with their own. This is NOT trivia, never call it trivia.`
      : context.gameKind === "wyr"
        ? "The game is Majority Would You Rather: everyone picks a side and predicts the majority. This is NOT trivia."
        : context.gameKind === "mlt"
          ? "The game is Most Likely To: a prompt appears and everyone votes for who fits it best. Voters who pick the top person score points. This is a social party game."
          : context.gameKind === "hol"
            ? "The game is Higher or Lower: two items are shown and players vote whether the right one's value is higher or lower than the left. Majority wins."
            : context.gameKind === "gtp"
              ? "The game is Guess the Player: everyone answers a prompt anonymously, then answers are revealed one at a time and players guess who wrote each one."
              : context.gameKind === "tank"
                ? "The game is Shark Tank: each player pitches a product with a timer, then others vote to invest or pass. The pitcher earns points per investor."
                : context.gameKind === "charades"
                  ? "The game is Charades: one player acts out a word (no speaking), and others type guesses on their phones. First correct guess wins points for both actor and guesser."
                  : context.gameKind === "num"
                    ? "The game is Number Crunch: everyone except the guesser gets a secret number 1-10 and submits an example that matches that position on a theme scale. The guesser then assigns numbers to all examples and earns points for accuracy."
                    : undefined;

  const facts = [
    gameFact,
    context.playerName && `Player: ${context.playerName}`,
    context.submittedAnswer && `They answered: "${context.submittedAnswer}", react to their answer specifically`,
    context.points !== undefined && `Points just scored: ${context.points}`,
    context.situationHint && `What happens next: ${context.situationHint}`,
    context.winnerNames?.length && `Winner(s): ${context.winnerNames.join(", ")}`,
    context.leaderName && `Current leader: ${context.leaderName}`,
    context.secondPlaceName && `Player in 2nd place: ${context.secondPlaceName}`,
    context.leaderGap !== undefined && context.leaderGap > 0 && `Point gap (1st vs 2nd): ${context.leaderGap}`,
    context.isUnstoppableLead && "isUnstoppableLead: true — the leader cannot be caught with questions remaining",
    context.rankChange && context.rankChange !== "same" && [
      `${context.playerName ?? "Player"} just ${context.rankChange === "rose" ? "climbed" : "dropped"} in rank`,
      context.previousRank && `Previous rank: ${context.previousRank}`,
      context.newRank && `New rank: ${context.newRank}`,
    ].filter(Boolean).join(", "),
    context.revealedAnswer && `Revealed answer: "${context.revealedAnswer}"`,
    context.questionText && moment === "answer_lore" && `Question was: ${context.questionText}`,
    context.fooledCount !== undefined && `Players fooled: ${context.fooledCount}`,
    context.caughtCount !== undefined && `Players who guessed right: ${context.caughtCount}`,
    context.revealedStatement && `The revealed ${context.variationWord ?? "lie"}: "${context.revealedStatement}"`,
    context.optionA && `Option A: ${context.optionA} / Option B: ${context.optionB}`,
    context.majorityOption && `Majority picked: ${context.majorityOption}`,
    context.wyrMajorityVotes !== undefined && `People who actually chose the majority option: ${context.wyrMajorityVotes}`,
    context.wyrTimedOut && "Timer ran out — nobody voted before time was up",
    context.isTie && (moment === "wyr_reveal" ? "The vote was a perfect tie" : "It's currently a tie at the top — no single leader"),
    context.mltPrompt && `Prompt: "${context.mltPrompt}"`,
    context.mltTopPlayerName && `Top voted player: ${context.mltTopPlayerName} (${context.mltVoteCount} votes)`,
    context.holLeftLabel && context.holLeftValue != null && `Left item: ${holValueLine(context.holLeftLabel, context.holLeftValue, context.holLeftUnit!, context.holLeftCategory)}`,
    context.holRightLabel && `Right item: ${context.holRightLabel}${context.holRightUnit ? ` (${context.holRightUnit})` : ""}`,
    context.holRightValue !== undefined && `Right item value: ${holValueLine(context.holRightLabel!, context.holRightValue, context.holRightUnit!, context.holRightCategory)} (${context.holCorrectAnswer} than left)`,
    context.holCorrectVoterCount !== undefined && `Correct voters: ${context.holCorrectVoterCount}`,
    context.gtpPromptText && `Prompt: "${context.gtpPromptText}"`,
    context.gtpAnswerText && `Anonymous answer shown: "${context.gtpAnswerText}"`,
    context.gtpAuthorName && `Author revealed: ${context.gtpAuthorName}`,
    context.gtpCorrectGuesserCount !== undefined && `Correct guessers: ${context.gtpCorrectGuesserCount}`,
    context.tankPitcherName && `Pitcher: ${context.tankPitcherName}`,
    context.tankProductName && `Product: ${context.tankProductName}`,
    context.tankTagline && `Tagline: "${context.tankTagline}"`,
    context.tankInvestorCount !== undefined && `Investors: ${context.tankInvestorCount}`,
    context.tankPitcherPoints !== undefined && `Points earned: ${context.tankPitcherPoints}`,
    context.charadesActorName && `Actor: ${context.charadesActorName}`,
    context.charadesCategory && `Category: ${context.charadesCategory}`,
    context.charadesWord && `Word revealed: ${context.charadesWord}`,
    context.charadesWinnerName && `Winner who guessed it: ${context.charadesWinnerName}`,
    context.numGuesserName && `Guesser: ${context.numGuesserName}`,
    context.numTheme && `Theme: ${context.numTheme}`,
    context.numScaleLow && `Scale: 1 = ${context.numScaleLow}, 10 = ${context.numScaleHigh}`,
    context.numGuesserPoints !== undefined && `Guesser scored: ${context.numGuesserPoints} points`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chatComplete({
    system: SYSTEM_PROMPTS[personality],
    user: `Moment: ${moment}${MOMENT_BRIEFS[moment] ? `\nWhat's happening: ${MOMENT_BRIEFS[moment]}` : ""}\n${facts}`,
    maxTokens: 60,
    temperature: 0.9,
  });

  if (!raw) return { text: fallback, source: "template" };
  const line = sanitize(raw);
  if (line.length === 0 || line.length > MAX_LINE_LENGTH || containsBlockedWord(line)) {
    return { text: fallback, source: "template" };
  }
  return { text: line, source: "llm" };
}
