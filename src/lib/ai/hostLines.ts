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
  "answer_correct",
  "answer_wrong",
  "retry_next_player",
  "no_buzz_timeout",
  "show_answer",
  "scoreboard_reveal",
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
  // server-set description of what happens next (e.g. buzzing reopened vs
  // answer reveal), so the host never narrates the wrong transition
  situationHint?: string;
  // two truths and a lie
  variationWord?: "lie" | "truth";
  caughtCount?: number;
  fooledCount?: number;
  // only ever set once the round is revealed
  revealedStatement?: string;
  // one statement read out when voting opens (verbatim, never through the
  // LLM), with its on-screen letter ("A"/"B"/"C")
  statementText?: string;
  statementLabel?: string;
  // would you rather (options are public once the round starts)
  optionA?: string;
  optionB?: string;
  majorityOption?: string;
  isTie?: boolean;
  // most likely to
  mltPrompt?: string;
  mltTopPlayerName?: string;
  mltVoteCount?: number;
  // higher or lower
  holLeftLabel?: string;
  holLeftValue?: number | null;
  holLeftUnit?: string;
  holRightLabel?: string;
  holRightUnit?: string;
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

const MAX_LINE_LENGTH = 160; // host line length is capped (PRD §13)

// Deterministic-ish fallbacks so virtual host works with no API key. A few
// variants per moment keep it from sounding like a broken record.
const TEMPLATES: Record<HostMoment, ((c: HostLineContext) => string)[]> = {
  game_intro: [
    (c) => {
      if (c.gameKind === "ttal") return `Welcome to the show! Write your three statements, the sneakier the ${c.variationWord ?? "lie"}, the better!`;
      if (c.gameKind === "wyr") return "Welcome to the show! Tough choices ahead, pick a side and guess what the room would rather!";
      if (c.gameKind === "mlt") return "Welcome to Most Likely To! A prompt pops up, vote for who fits it best on your phones!";
      if (c.gameKind === "hol") return "Welcome to Higher or Lower! We'll give you two numbers and you guess which is bigger!";
      if (c.gameKind === "gtp") return "Welcome to Guess the Player! Answer anonymously, then try to spot who wrote what!";
      if (c.gameKind === "tank") return "Welcome to Shark Tank! You'll pitch products and vote on whether to invest!";
      if (c.gameKind === "charades") return "Welcome to Charades! Act it out, no talking! Your friends guess on their phones!";
      if (c.gameKind === "num") return "Welcome to Number Rating! Get a secret number, submit an example, then the guesser figures out the scale!";
      return "Welcome to the show! Phones ready, fingers steady, let's play some trivia!";
    },
    (c) => {
      if (c.gameKind === "ttal") return "It's game time! Keep a straight face and make that fib convincing. Good luck everyone!";
      if (c.gameKind === "wyr") return "It's game time! Answer honestly, predict the majority. Good luck everyone!";
      if (c.gameKind === "mlt") return "It's game time! Vote fast and pick your most likely candidate!";
      if (c.gameKind === "hol") return "It's game time! Trust your gut and vote higher or lower. Good luck!";
      if (c.gameKind === "gtp") return "It's game time! Stay anonymous, be creative, and try to fool everyone!";
      if (c.gameKind === "tank") return "It's game time! Pitch hard, invest wisely, earn those points!";
      if (c.gameKind === "charades") return "It's game time! Get those acting muscles ready, and no peeking at each other's phones!";
      if (c.gameKind === "num") return "It's game time! Think carefully about your number, help the guesser figure out the scale!";
      return "It's game time! Buzz fast, think faster. Good luck everyone!";
    },
  ],
  question_intro: [
    (c) =>
      c.questionNumber === c.questionCount
        ? "Final question, make it count!"
        : `Question ${c.questionNumber ?? "next"}, here it comes!`,
    (c) => `Alright, question ${c.questionNumber ?? "time"}. Eyes on the screen!`,
  ],
  read_question: [(c) => c.questionText ?? "Read it on the screen!"],
  buzz_received: [
    (c) => `${c.playerName ?? "Someone"} buzzes in first, type your answer!`,
    (c) => `${c.playerName ?? "A player"} is on the buzzer. No pressure!`,
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
      c.isTie
        ? "Let's check the scores, it's a tie at the top!"
        : c.leaderName
          ? `Let's check the scores, ${c.leaderName} leads the pack!`
          : "Let's check the scores!",
    () => "Scoreboard time, let's see who's climbing!",
    (c) =>
      c.isTie
        ? "We're all tied up at the top, anyone's game!"
        : c.leaderName
          ? `${c.leaderName} is out in front, for now!`
          : "Drumroll please… here come the scores!",
    () => "The numbers don't lie, let's see the damage!",
    (c) =>
      c.isTie
        ? "All eyes on the board, it's neck and neck at the top!"
        : c.leaderName
          ? `All eyes on the board, can anyone catch ${c.leaderName}?`
          : "All eyes on the board!",
    () => "Let's see where everybody stands!",
    (c) =>
      c.isTie
        ? "Dead heat up top, who's going to break the tie?"
        : c.leaderName
          ? `Somebody's feeling good, ${c.leaderName} is on top!`
          : "Time for a leaderboard check!",
  ],
  final_question: [() => "Final question, everything's on the line!"],
  game_over_winner: [
    (c) => `Game over! Give it up for ${c.winnerNames?.[0] ?? "our champion"}!`,
    (c) => `That's the game, ${c.winnerNames?.[0] ?? "the winner"} takes the crown!`,
  ],
  game_over_tie: [
    (c) =>
      `It's a tie at the top! ${(c.winnerNames ?? []).join(" and ") || "Our champions"} share the glory!`,
  ],
  ttal_collect_intro: [
    (c) =>
      `Time to get sneaky! Everyone write your statements, make that ${c.variationWord ?? "lie"} convincing!`,
    () => "Phones out! Write your three statements, and don't make it too easy…",
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
  // spoken as the unveil animation starts, must not hint at the outcome
  ttal_reveal_intro: [
    () => "The votes are in, let's see those results!",
    () => "Alright, moment of truth… let's see how everyone did!",
    () => "Time to find out who saw through it, results coming up!",
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
      c.isTie
        ? "It's a perfect split, no majority, no points! You're all impossible to predict."
        : c.majorityOption
          ? `The majority went with ${c.majorityOption}! ${c.caughtCount ?? 0} of you called it.`
          : "The votes are locked in, let's see the split!",
  ],
  // Most Likely To
  mlt_round_intro: [
    (c) => `Who is most likely to ${c.mltPrompt ?? "..."}? Vote on your phones!`,
    (c) => `Here's a spicy one, ${c.mltPrompt ?? "..."}! Pick your person!`,
    (c) => `Hot prompt! ${c.mltPrompt ?? "..."}. Vote for who fits best!`,
  ],
  mlt_reveal: [
    (c) =>
      c.mltTopPlayerName
        ? `The group voted, ${c.mltTopPlayerName} is most likely to ${c.mltPrompt ?? "..."}! ${c.mltVoteCount ?? 0} votes!`
        : "It's a tie, no clear winner this round!",
    (c) =>
      c.mltTopPlayerName
        ? `Looks like everyone agrees, ${c.mltTopPlayerName} takes this one with ${c.mltVoteCount ?? 0} votes!`
        : "Split decision! No points awarded this round.",
  ],
  // Higher or Lower
  hol_round_intro: [
    (c) =>
      c.holLeftValue != null
        ? `${c.holLeftLabel} is ${c.holLeftValue.toLocaleString()} ${c.holLeftUnit}. Is ${c.holRightLabel} higher or lower? Vote!`
        : `Is ${c.holRightLabel} higher or lower? Make your call!`,
    (c) =>
      c.holLeftValue != null
        ? `You know ${c.holLeftLabel} is ${c.holLeftValue.toLocaleString()} ${c.holLeftUnit}, now what about ${c.holRightLabel}?`
        : `${c.holRightLabel}, higher or lower than the left? Vote on your phones!`,
  ],
  hol_reveal: [
    (c) =>
      `${c.holRightLabel} is ${c.holRightValue?.toLocaleString()} ${c.holRightUnit}, that's ${c.holCorrectAnswer}! ${c.holCorrectVoterCount ?? 0} got it right!`,
    (c) =>
      `The answer is ${c.holRightValue?.toLocaleString()} ${c.holRightUnit}! ${c.holCorrectAnswer === "higher" ? "Higher" : "Lower"} than the left. ${c.holCorrectVoterCount ?? 0} players nailed it!`,
  ],
  // Guess the Player
  gtp_answering_intro: [
    (c) => `${c.gtpPromptText ?? "Answer the prompt"}, type something on your phones! Stay anonymous for now!`,
    (c) => `Here's your prompt: ${c.gtpPromptText ?? "..."}. Answer on your phones, nobody knows who said what yet!`,
  ],
  gtp_guessing: [
    (c) => `"${c.gtpAnswerText ?? "..."}", who wrote this? Guess on your phones!`,
    (c) => `Someone said "${c.gtpAnswerText ?? "..."}". Who was it? Pick your suspect!`,
  ],
  gtp_answer_reveal: [
    (c) =>
      `That was ${c.gtpAuthorName ?? "a mystery player"}! ${c.gtpCorrectGuesserCount ?? 0} of you spotted them.`,
    (c) =>
      c.gtpCorrectGuesserCount
        ? `${c.gtpAuthorName ?? "Our writer"} is revealed! ${c.gtpCorrectGuesserCount} clever guesser${c.gtpCorrectGuesserCount !== 1 ? "s" : ""} caught them.`
        : `${c.gtpAuthorName ?? "Our writer"} revealed, nobody guessed right this time!`,
  ],
  // Shark Tank
  tank_pitch_intro: [
    (c) => `${c.tankPitcherName ?? "Our pitcher"} is pitching ${c.tankProductName ?? "their product"}, "${c.tankTagline ?? "..."}". Listen up!`,
    (c) => `Eyes on ${c.tankPitcherName ?? "our pitcher"}! They're selling ${c.tankProductName ?? "something"}: "${c.tankTagline ?? "..."}". Will you bite?`,
  ],
  tank_invest: [
    (c) => `Time to vote! Will you invest in ${c.tankProductName ?? "this pitch"}? Decide on your phones!`,
    (c) => `The pitch is done, invest or pass? Lock in your vote on your phones!`,
  ],
  tank_reveal: [
    (c) =>
      c.tankInvestorCount && c.tankInvestorCount > 0
        ? `${c.tankInvestorCount} investor${c.tankInvestorCount !== 1 ? "s" : ""}! ${c.tankPitcherName ?? "The pitcher"} earns ${c.tankPitcherPoints ?? 0} points!`
        : `No investors this round, tough crowd for ${c.tankPitcherName ?? "our pitcher"}!`,
    (c) =>
      c.tankInvestorCount && c.tankInvestorCount > 0
        ? `${c.tankPitcherName ?? "The pitcher"} got ${c.tankInvestorCount} bite${c.tankInvestorCount !== 1 ? "s" : ""}! That's ${c.tankPitcherPoints ?? 0} points!`
        : `Nobody bit on that pitch. Better luck next round!`,
  ],
  // Charades
  charades_round_intro: [
    (c) => `${c.charadesActorName ?? "Our actor"} is acting out something in ${c.charadesCategory ?? "..."}! Type your guesses on your phones, no talking!`,
    (c) => `Watch ${c.charadesActorName ?? "our actor"} carefully! They're acting out a ${c.charadesCategory ?? "..."}, guess on your phones!`,
  ],
  charades_reveal: [
    (c) =>
      c.charadesWinnerName
        ? `${c.charadesWinnerName} got it, the word was ${c.charadesWord ?? "..."}! Great acting and great guessing!`
        : `Time's up! The word was ${c.charadesWord ?? "..."}. Nobody cracked it this round!`,
    (c) =>
      c.charadesWinnerName
        ? `${c.charadesWord ?? "..."}! ${c.charadesWinnerName} nailed it!`
        : `Nobody guessed ${c.charadesWord ?? "..."}! Tough crowd for ${c.charadesActorName ?? "our actor"}!`,
  ],
  // Number Rating
  num_round_intro: [
    (c) => `${c.numGuesserName ?? "Our guesser"} doesn't know your numbers! Submit an example on your phones. Remember: 1 is ${c.numScaleLow ?? "worst"}, 10 is ${c.numScaleHigh ?? "best"}!`,
    (c) => `Theme: ${c.numTheme ?? "..."}! Everyone except ${c.numGuesserName ?? "the guesser"} has a secret number, submit your example now!`,
  ],
  num_guessing: [
    (c) => `All examples are in! ${c.numGuesserName ?? "Our guesser"}, assign a number 1 to 10 to each one. 1 is ${c.numScaleLow ?? "worst"}, 10 is ${c.numScaleHigh ?? "best"}!`,
    (c) => `${c.numGuesserName ?? "Our guesser"} has all the examples, now they have to figure out each person's number!`,
  ],
  num_reveal: [
    (c) => `${c.numGuesserName ?? "Our guesser"} scored ${c.numGuesserPoints ?? 0} points this round! Let's see how close they got!`,
    (c) => `Results are in! ${c.numGuesserName ?? "Our guesser"} earned ${c.numGuesserPoints ?? 0} points for their accuracy!`,
  ],
};

function templateLine(moment: HostMoment, context: HostLineContext): string {
  const variants = TEMPLATES[moment];
  const pick = variants[Math.floor(Math.random() * variants.length)];
  return pick(context);
}

// Moments worth a live LLM line (player-specific color). Everything else uses
// templates even when a key is configured, cheaper and instant (PRD §13
// hybrid voice strategy).
const LIVE_MOMENTS: HostMoment[] = [
  "buzz_received",
  "answer_correct",
  "answer_wrong",
  "retry_next_player",
  "game_over_winner",
  "game_over_tie",
  "ttal_subject_intro",
  "ttal_reveal",
  "wyr_reveal",
  "mlt_reveal",
  "gtp_answer_reveal",
  "tank_reveal",
  "charades_reveal",
  "num_reveal",
];

// Lines go straight to the caption AND to text-to-speech, so anything that
// isn't plain spoken text gets scrubbed: emojis (read out loud as "party
// popper"), *stage directions*, markdown, and smart quotes.
function sanitize(line: string): string {
  return line
    .replace(/\*[^*]*\*/g, " ")
    .replace(/[_`#>~|]/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// What each live moment actually is, so the model doesn't misread it (e.g.
// treating a buzz as a transition to a new question).
const MOMENT_BRIEFS: Partial<Record<HostMoment, string>> = {
  buzz_received:
    "The player just buzzed in on the question that is ALREADY on screen and is about to type their answer. Hype the buzz and prompt them for their answer. Do not introduce, number, or move to any question.",
  retry_next_player:
    "The previous player got this same on-screen question wrong; this player buzzed and now gets to steal it. Hand them the floor and prompt for their answer. Do not introduce or move to a new question.",
  answer_correct: "The player's typed answer was just judged correct.",
  answer_wrong:
    "The player's typed answer was just judged wrong. React with sympathy or playful teasing about the miss (like 'you'll get the next one'), NEVER praise them or say things like 'keep up that energy'. Don't reveal the real answer.",
  ttal_subject_intro:
    "The named player's three statements just went up on the big screen and you will read them aloud next. Speak to the OTHER players, not to the named player: challenge the group to figure out which of the named player's statements is the fake one and vote on their phones. Give the named player no instructions, they just sit tight and keep a straight face.",
  ttal_reveal:
    "Voting is over and the odd statement was just revealed on screen. Speak TO the subject by name: tell them how many players they fooled and how many caught them (e.g. 'you fooled 1, but 1 caught your lie'). Never mention points or scores. Don't ask anyone to do anything.",
  game_over_winner:
    "The whole game just ended and the named player has the top score across every round. Celebrate their overall victory, never describe a single-round action (like spotting one lie or answering one question) as the reason they won.",
  game_over_tie:
    "The whole game just ended with the named players tied for the top score across every round. Celebrate the shared victory, never describe a single-round action as the reason they won.",
  mlt_reveal:
    "Votes are revealed. Announce who the group voted as most likely and how many votes they got. If it's a tie, say so. React to the winner naturally, they're sitting right there!",
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
  context: HostLineContext
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
                    ? "The game is Number Rating: everyone except the guesser gets a secret number 1-10 and submits an example that matches that position on a theme scale. The guesser then assigns numbers to all examples and earns points for accuracy."
                    : undefined;

  // no question number in facts: it reliably invites "on to question N!"
  // improv mid-question (templates handle numbering where it belongs)
  const facts = [
    gameFact,
    context.playerName && `Player: ${context.playerName}`,
    context.submittedAnswer && `They answered: "${context.submittedAnswer}", react to their answer specifically`,
    context.points !== undefined && `Points just scored: ${context.points}`,
    context.situationHint && `What happens next: ${context.situationHint}`,
    context.winnerNames?.length && `Winner(s): ${context.winnerNames.join(", ")}`,
    context.leaderName && `Current leader: ${context.leaderName}`,
    context.fooledCount !== undefined && `Players fooled: ${context.fooledCount}`,
    context.caughtCount !== undefined && `Players who guessed right: ${context.caughtCount}`,
    context.revealedStatement && `The revealed ${context.variationWord ?? "lie"}: "${context.revealedStatement}"`,
    context.optionA && `Option A: ${context.optionA} / Option B: ${context.optionB}`,
    context.majorityOption && `Majority picked: ${context.majorityOption}`,
    context.isTie && "The vote was a perfect tie",
    // most likely to
    context.mltPrompt && `Prompt: "${context.mltPrompt}"`,
    context.mltTopPlayerName && `Top voted player: ${context.mltTopPlayerName} (${context.mltVoteCount} votes)`,
    // higher or lower
    context.holLeftLabel && context.holLeftValue != null && `Left item: ${context.holLeftLabel} = ${context.holLeftValue.toLocaleString()} ${context.holLeftUnit}`,
    context.holRightLabel && `Right item: ${context.holRightLabel} (${context.holRightUnit})`,
    context.holRightValue !== undefined && `Right item value: ${context.holRightValue.toLocaleString()} ${context.holRightUnit} (${context.holCorrectAnswer} than left)`,
    context.holCorrectVoterCount !== undefined && `Correct voters: ${context.holCorrectVoterCount}`,
    // guess the player
    context.gtpPromptText && `Prompt: "${context.gtpPromptText}"`,
    context.gtpAnswerText && `Anonymous answer shown: "${context.gtpAnswerText}"`,
    context.gtpAuthorName && `Author revealed: ${context.gtpAuthorName}`,
    context.gtpCorrectGuesserCount !== undefined && `Correct guessers: ${context.gtpCorrectGuesserCount}`,
    // shark tank
    context.tankPitcherName && `Pitcher: ${context.tankPitcherName}`,
    context.tankProductName && `Product: ${context.tankProductName}`,
    context.tankTagline && `Tagline: "${context.tankTagline}"`,
    context.tankInvestorCount !== undefined && `Investors: ${context.tankInvestorCount}`,
    context.tankPitcherPoints !== undefined && `Points earned: ${context.tankPitcherPoints}`,
    // charades
    context.charadesActorName && `Actor: ${context.charadesActorName}`,
    context.charadesCategory && `Category: ${context.charadesCategory}`,
    context.charadesWord && `Word revealed: ${context.charadesWord}`,
    context.charadesWinnerName && `Winner who guessed it: ${context.charadesWinnerName}`,
    // number rating
    context.numGuesserName && `Guesser: ${context.numGuesserName}`,
    context.numTheme && `Theme: ${context.numTheme}`,
    context.numScaleLow && `Scale: 1 = ${context.numScaleLow}, 10 = ${context.numScaleHigh}`,
    context.numGuesserPoints !== undefined && `Guesser scored: ${context.numGuesserPoints} points`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chatComplete({
    system:
      "You are the upbeat host of a live party game show for all ages. Write ONE short spoken line (max 18 words) for the given moment. Rules: PG-safe, no swearing, no insults about identity or appearance, no rambling, never reveal or hint at hidden answers, use the player's name naturally if given, keep the game moving. If the facts include what the player answered, your line MUST quote or riff on their exact answer (e.g. 'Ooh, Spider-Man was not it!'). The line is read aloud by text-to-speech: plain spoken words only, absolutely no emojis, no asterisks, no stage directions, no formatting. Output only the line itself.",
    user: `Moment: ${moment}${MOMENT_BRIEFS[moment] ? `\nWhat's happening: ${MOMENT_BRIEFS[moment]}` : ""}\n${facts}`,
    maxTokens: 60,
    temperature: 0.9,
  });

  if (!raw) return { text: fallback, source: "template" };
  const line = sanitize(raw);
  // moderation gate before anything reaches the screen or voice generation
  if (line.length === 0 || line.length > MAX_LINE_LENGTH || containsBlockedWord(line)) {
    return { text: fallback, source: "template" };
  }
  return { text: line, source: "llm" };
}
